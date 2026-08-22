#!/usr/bin/env node
//
// Detect hub entries whose pinned version is behind upstream.
//
// This script deliberately **never edits a file**. A version bump changes the
// image a user actually runs: it can drop a config key, require a database
// migration, or move a port, and none of that is visible from a release feed.
// So the safe half of maintenance (sync-metadata.ts) and the unsafe half are
// split, and this script only produces *work orders* — one precise, verified
// description of a bump — that the upgrade task then applies and validates with
// test-stack.sh before anything is merged.
//
// Usage:
//   node packages/scripts/maintenance/check-versions.ts
//   node packages/scripts/maintenance/check-versions.ts --only affine
//   node packages/scripts/maintenance/check-versions.ts --json work/version-drift.json --markdown
//   node packages/scripts/maintenance/check-versions.ts --max-age 30   # only report bumps released >30d ago

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { listStacks, parseImagePins, primaryImage } from "./lib/hub.ts";
import {
  fetchImageTags,
  fetchReleases,
  isRollingTag,
  isStableVersion,
  normalizeTag,
  parseImage,
  parseRepository,
  pool,
  type Release,
} from "./lib/upstream.ts";

const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
const values = (n: string) =>
  argv.flatMap((a, i) => (a === `--${n}` ? [argv[i + 1]] : []));

const ONLY = values("only").filter(Boolean);
const NO_CACHE = flag("no-cache");
const CONCURRENCY = Number(values("concurrency")[0] ?? 8);
const JSON_OUT = values("json")[0];
const MARKDOWN = flag("markdown");
/** Skip releases younger than N days: brand-new releases are often yanked. */
const MIN_AGE_DAYS = Number(values("min-age")[0] ?? 3);

export type Severity = "major" | "minor" | "patch" | "unknown";

interface Drift {
  slug: string;
  name: string;
  current: string;
  latest: string;
  latestTag: string;
  releaseDate: string;
  severity: Severity;
  releaseNotes: string;
  /** Exact edits the upgrade task has to make. */
  edits: { file: string; from: string; to: string }[];
  /** Container tag confirmed to exist for the new version. */
  imageTag: string | null;
  warnings: string[];
}

interface Skipped {
  slug: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// Version comparison
// ---------------------------------------------------------------------------

const parts = (v: string) =>
  normalizeTag(v)
    .split(/[.\-+]/)
    .map((p) => (/^\d+$/.test(p) ? Number(p) : p));

/** Numeric-aware comparison; falls back to string order for exotic segments. */
export function compareVersions(a: string, b: string): number {
  const pa = parts(a);
  const pb = parts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i];
    const y = pb[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (typeof x === "number" && typeof y === "number") {
      if (x !== y) return x < y ? -1 : 1;
    } else if (String(x) !== String(y)) {
      return String(x) < String(y) ? -1 : 1;
    }
  }
  return 0;
}

function severity(current: string, latest: string): Severity {
  const a = parts(current);
  const b = parts(latest);
  if (typeof a[0] !== "number" || typeof b[0] !== "number") return "unknown";
  if (a[0] !== b[0]) return "major";
  if (a[1] !== b[1]) return "minor";
  return "patch";
}

const daysSince = (date: string) =>
  date ? (Date.now() - Date.parse(date)) / 86_400_000 : Infinity;

/**
 * Rebuild the container tag for a new version by substituting it into the tag
 * we currently ship: `v0.9.0` -> `v1.2.0`, `25.4.0-alpine` -> `25.5.0-alpine`.
 * Preserving the surrounding decoration matters — `-alpine` is a different
 * image, and dropping it would silently change the runtime.
 */
export function projectTag(currentTag: string, current: string, latest: string): string {
  const bare = normalizeTag(current);
  if (bare && currentTag.includes(bare)) return currentTag.replace(bare, normalizeTag(latest));
  if (currentTag.includes(current)) return currentTag.replace(current, latest);
  return latest;
}

// ---------------------------------------------------------------------------

async function inspect(entry: ReturnType<typeof listStacks>[number]): Promise<Drift | Skipped> {
  const { data, slug } = entry;
  const opts = { noCache: NO_CACHE };
  const current = String(data.version ?? "").trim();

  if (!current) return { slug, reason: "no version field" };
  if (isRollingTag(current))
    return { slug, reason: `rolling tag (${current}) — always current by construction` };

  const ref = parseRepository(data.repository);
  if (!ref) return { slug, reason: `no queryable repository (${data.repository ?? "unset"})` };

  let releases: Release[];
  try {
    releases = await fetchReleases(ref, opts);
  } catch (e) {
    return { slug, reason: `release lookup failed: ${(e as Error).message}` };
  }
  if (!releases.length) return { slug, reason: "upstream publishes no releases or tags" };

  const stable = releases.filter(
    (r) => !r.prerelease && isStableVersion(r.version) && r.version
  );
  if (!stable.length) return { slug, reason: "no stable release found" };

  // Very fresh releases get yanked, so they are excluded from *selection* —
  // not from the check. Excluding the app instead would hide an entry that is
  // twenty versions behind just because upstream happened to publish
  // yesterday; here we simply target the newest release that has settled.
  const settled = stable.filter((r) => !r.date || daysSince(r.date) >= MIN_AGE_DAYS);
  if (!settled.length)
    return { slug, reason: `no release older than ${MIN_AGE_DAYS} days yet` };

  // Highest version wins rather than "first in the feed": projects backport to
  // older branches, so the newest *published* release is often not the newest
  // version.
  const latest = settled.reduce((a, b) => (compareVersions(a.version, b.version) >= 0 ? a : b));

  // Non-comparable schemes (build hashes like `5777fe0a`, `REL-9_9`) cannot be
  // ordered, so "newer" is meaningless: any comparison is a coin flip. Report
  // them as unresolved rather than emit a work order nobody should act on.
  if (severity(current, latest.version) === "unknown")
    return {
      slug,
      reason: `version scheme not comparable (ships ${current}, upstream latest ${latest.version}) — review by hand`,
    };

  if (compareVersions(current, latest.version) >= 0)
    return { slug, reason: `up to date (${current})` };

  const warnings: string[] = [];
  const edits: Drift["edits"] = [];
  let imageTag: string | null = null;

  // stack.yaml
  edits.push({ file: entry.stackFile, from: `version: "${current}"`, to: `version: "${latest.version}"` });
  if (latest.date)
    edits.push({ file: entry.stackFile, from: `updated_at: ${data.updated_at}`, to: `updated_at: ${latest.date}` });

  // compose.yaml — the pin that actually decides what runs.
  if (entry.composeFile) {
    const pins = parseImagePins(readFileSync(entry.composeFile, "utf-8"));
    const primary = primaryImage(pins, current);
    if (!primary?.variable) {
      warnings.push("no `${VAR:-version}` pin found in compose.yaml — locate the image by hand");
    } else {
      const image = parseImage(primary.resolved);
      const currentTag = image?.tag ?? primary.pinned ?? current;
      const wantedTag = projectTag(currentTag, current, latest.version);

      // A release existing on GitHub does not mean an image was published for
      // it: verifying now avoids handing the upgrade task a bump that cannot
      // even be pulled.
      if (image) {
        try {
          const tags = await fetchImageTags(image, opts);
          if (tags.length) {
            imageTag = tags.includes(wantedTag) ? wantedTag : null;
            if (!imageTag) {
              const alt = tags.find((t) => normalizeTag(t) === latest.version);
              imageTag = alt ?? null;
              if (alt) warnings.push(`image tag is \`${alt}\`, not the expected \`${wantedTag}\``);
              else warnings.push(`no image tag found for ${latest.version} on ${image.registry}`);
            }
          } else {
            warnings.push(`could not list tags for ${image.name} (${image.registry})`);
          }
        } catch (e) {
          warnings.push(`tag listing failed: ${(e as Error).message}`);
        }
      }

      // The variable holds only the part of the tag that varies (`0.9.0` in
      // `foo:v${VER:-0.9.0}-alpine`), so the substitution happens on the
      // pinned value, not on the whole tag.
      edits.push({
        file: entry.composeFile,
        from: `\${${primary.variable}:-${primary.pinned}}`,
        to: `\${${primary.variable}:-${projectTag(primary.pinned ?? "", current, latest.version)}}`,
      });

      if (entry.envFile) {
        const env = readFileSync(entry.envFile, "utf-8");
        const line = env.match(new RegExp(`^${primary.variable}=(.*)$`, "m"));
        if (line)
          edits.push({
            file: entry.envFile,
            from: `${primary.variable}=${line[1]}`,
            to: `${primary.variable}=${projectTag(line[1], current, latest.version)}`,
          });
      }
    }
  }

  const sev = severity(current, latest.version);
  if (sev === "major")
    warnings.push("major version bump — expect breaking changes, read the release notes first");

  return {
    slug,
    name: data.name ?? slug,
    current,
    latest: latest.version,
    latestTag: latest.tag,
    releaseDate: latest.date,
    severity: sev,
    releaseNotes:
      ref.host === "github"
        ? `https://github.com/${ref.slug}/releases/tag/${latest.tag}`
        : `${data.repository}/releases`,
    edits,
    imageTag,
    warnings,
  };
}

const isDrift = (r: Drift | Skipped): r is Drift => "latest" in r;

async function main() {
  const stacks = listStacks("hub", ONLY);
  console.error(`checking ${stacks.length} stacks for version drift`);

  let done = 0;
  const results = await pool(stacks, CONCURRENCY, async (entry) => {
    let out: Drift | Skipped;
    try {
      out = await inspect(entry);
    } catch (e) {
      out = { slug: entry.slug, reason: `error: ${(e as Error).message}` };
    }
    if (++done % 25 === 0) console.error(`  ${done}/${stacks.length}`);
    return out;
  });

  const drifted = results.filter(isDrift).sort((a, b) => a.slug.localeCompare(b.slug));
  const skipped = results.filter((r): r is Skipped => !isDrift(r));

  const rank = { major: 0, minor: 1, patch: 2, unknown: 3 };
  drifted.sort((a, b) => rank[a.severity] - rank[b.severity] || a.slug.localeCompare(b.slug));

  for (const d of drifted) {
    console.log(
      `${d.slug.padEnd(24)} ${d.current.padEnd(14)} -> ${d.latest.padEnd(14)} ${d.severity}` +
        (d.imageTag ? "" : "  [no verified image tag]")
    );
  }
  console.log(`\n${drifted.length} of ${stacks.length} stacks are behind upstream`);

  const report = {
    generatedAt: new Date().toISOString(),
    checked: stacks.length,
    drifted,
    skipped,
  };

  if (JSON_OUT) {
    mkdirSync(dirname(JSON_OUT), { recursive: true });
    writeFileSync(JSON_OUT, JSON.stringify(report, null, 2));
    console.error(`report written to ${JSON_OUT}`);
  }
  if (MARKDOWN) console.log("\n" + toMarkdown(drifted));
}

export function toMarkdown(drifted: Drift[]): string {
  if (!drifted.length) return "Every hub entry is on the latest upstream release.";
  const rows = drifted.map(
    (d) =>
      `| [${d.slug}](../../hub/${d.slug}) | \`${d.current}\` | [\`${d.latest}\`](${d.releaseNotes}) | ${d.severity} | ${
        d.releaseDate || "?"
      } | ${d.imageTag ? `\`${d.imageTag}\`` : "⚠️ not found"} |`
  );
  return [
    "| App | Current | Latest | Bump | Released | Image tag |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

await main();
