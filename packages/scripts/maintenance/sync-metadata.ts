#!/usr/bin/env node
//
// Refresh the *descriptive* metadata of every hub entry from upstream.
//
//   stars, homepage, repository, license, updated_at
//
// These fields describe software we already ship; refreshing them cannot change
// what a user runs, so this script is safe to run unattended and land as a
// mechanical PR.
//
// `version` is deliberately out of scope: bumping a version changes the bytes a
// user executes and needs the non-regression run in check-versions.ts +
// test-stack.sh. See docs/MAINTENANCE.md.
//
// ## Applied vs proposed
//
// Not every upstream field is equally authoritative, because the hub and the
// forge describe *different things*: our entry describes a piece of software,
// the API describes a repository. Usually the same thing — but `hub/factorio`
// points at `factoriotools/factorio-docker`, whose MIT license covers the
// Dockerfile while the game itself is proprietary, and `hub/wordpress` points
// at `wordpress-develop`, whose homepage is a contributor handbook rather than
// wordpress.org.
//
// So:
//   applied  — stars, repository, updated_at. The API is authoritative: a star
//              count is a star count, and a differing canonical URL means the
//              project genuinely moved.
//   proposed — license, homepage. Applied when we have no value at all (pure
//              gain), otherwise reported for a human to accept or reject. A
//              rejection is recorded in metadata-overrides.yaml so the same
//              suggestion never comes back the next day.
//
// Usage:
//   node packages/scripts/maintenance/sync-metadata.ts               # update files
//   node packages/scripts/maintenance/sync-metadata.ts --check       # CI: exit 1 on drift
//   node packages/scripts/maintenance/sync-metadata.ts --only affine --only 2048
//   node packages/scripts/maintenance/sync-metadata.ts --json report.json
//   node packages/scripts/maintenance/sync-metadata.ts --accept wordpress:homepage
//   node packages/scripts/maintenance/sync-metadata.ts --reject wordpress:homepage --reason "points at the contributor handbook"
//
// Env: GITHUB_TOKEN (falls back to `gh auth token`), STACK_UPSTREAM_TTL.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { listStacks, setField, writeStack, type StackEntry } from "./lib/hub.ts";
import {
  fetchDockerTagDate,
  fetchReleaseDate,
  fetchReleases,
  fetchRepoMeta,
  isRollingTag,
  parseImage,
  parseRepository,
  pool,
  type RepoMeta,
} from "./lib/upstream.ts";
import { parseImagePins, primaryImage } from "./lib/hub.ts";
import {
  isRejected,
  loadOverrides,
  recordRejection,
  OVERRIDES_FILE,
} from "./lib/overrides.ts";
import { readFileSync } from "node:fs";

interface Change {
  field: string;
  from: unknown;
  to: unknown;
}

interface Result {
  slug: string;
  changes: Change[];
  /** Divergences that need a human decision before they can be applied. */
  suggestions: Change[];
  notes: string[];
}

/**
 * Fields the API is authoritative about. Everything else is a proposal: see
 * the header comment for why license and homepage cannot be trusted blindly.
 */
const AUTO_APPLIED = new Set(["stars", "repository", "updated_at"]);

const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(`--${name}`);
const values = (name: string) =>
  argv.flatMap((a, i) => (a === `--${name}` ? [argv[i + 1]] : []));

const CHECK = flag("check");
const NO_CACHE = flag("no-cache");
const CONCURRENCY = Number(values("concurrency")[0] ?? 8);
const ONLY = values("only").filter(Boolean);
const JSON_OUT = values("json")[0];
/** `--accept slug:field` — apply a proposal this run. */
const ACCEPTED = new Set(values("accept").filter(Boolean));
const REJECTED = values("reject").filter(Boolean);
const REASON = values("reason")[0];
const OVERRIDES = loadOverrides();
// `--reject` needs to run a sync to learn the current upstream value, but it is
// a bookkeeping command: it must not leave edits in the catalogue as a side
// effect of recording a decision.
const READ_ONLY = CHECK || REJECTED.length > 0;

/**
 * Stars move constantly; rewriting 200 files because a project gained three
 * stars produces daily noise PRs that nobody reads. We round to the same
 * precision the hub already uses (3 significant digits) and only write when
 * that rounded value actually moves.
 */
function roundStars(stars: number): number {
  if (stars < 1000) return Math.round(stars / 10) * 10;
  const magnitude = 10 ** (Math.floor(Math.log10(stars)) - 2);
  return Math.round(stars / magnitude) * magnitude;
}

/** Trailing slashes and http:// are cosmetic differences, not real drift. */
const canonical = (url: string) =>
  url.trim().replace(/\/+$/, "").replace(/^http:\/\//, "https://").toLowerCase();

async function syncEntry(entry: StackEntry): Promise<Result> {
  const { data } = entry;
  const changes: Change[] = [];
  const notes: string[] = [];
  const opts = { noCache: NO_CACHE };

  const ref = parseRepository(data.repository);
  let meta: RepoMeta | null = null;

  if (ref) {
    try {
      meta = await fetchRepoMeta(ref, opts);
      if (!meta) notes.push(`repository not found upstream: ${data.repository}`);
    } catch (e) {
      notes.push(`repository lookup failed: ${(e as Error).message}`);
    }
  } else if (data.repository) {
    notes.push(`unsupported repository host, skipped: ${data.repository}`);
  }

  const suggestions: Change[] = [];

  /**
   * Route a divergence: applied outright, or held for review when the API is
   * describing the repository rather than the software.
   */
  const propose = (field: string, from: unknown, to: string | number) => {
    const change = { field, from, to };
    if (AUTO_APPLIED.has(field) || from == null || from === "") {
      changes.push(change);
      return;
    }
    if (ACCEPTED.has(`${entry.slug}:${field}`)) {
      changes.push(change);
      return;
    }
    if (isRejected(OVERRIDES, entry.slug, field, String(to))) return;
    suggestions.push(change);
  };

  if (meta) {
    // repository — upstream resolves renames/transfers, so a differing
    // html_url means the project moved and our link is stale.
    if (canonical(meta.url) !== canonical(data.repository ?? "")) {
      propose("repository", data.repository, meta.url);
    }

    // stars
    const stars = roundStars(meta.stars);
    if (stars !== data.stars) propose("stars", data.stars ?? null, stars);

    // homepage — only when upstream declares one. An empty upstream field is
    // an absence of information, never a reason to drop a curated URL. A
    // homepage that merely repeats the repository is not information either:
    // `repository` already says that, and it would push a real product page
    // out of the catalogue.
    if (
      meta.homepage &&
      canonical(meta.homepage) !== canonical(data.homepage ?? "") &&
      canonical(meta.homepage) !== canonical(meta.url)
    ) {
      propose("homepage", data.homepage ?? null, meta.homepage);
    }

    // license — relicensing (MIT -> BUSL, AGPL -> ELv2) is exactly the kind of
    // change a curated catalogue must not miss, but see the note above about
    // packaging repositories before trusting it.
    if (meta.license && meta.license !== data.license) {
      propose("license", data.license ?? null, meta.license);
    }

    if (meta.archived) notes.push("upstream repository is archived");
  }

  // updated_at — the release date of the version we ship, so the pair
  // (version, updated_at) always describes one and the same release.
  const version = String(data.version ?? "").trim();
  const rolling = !version || isRollingTag(version);
  let updatedAt = "";

  if (ref && !rolling) {
    try {
      const releases = await fetchReleases(ref, opts);
      updatedAt = await fetchReleaseDate(ref, version, releases, opts);
      if (!updatedAt) notes.push(`no upstream release found for version ${version}`);
    } catch (e) {
      notes.push(`release lookup failed: ${(e as Error).message}`);
    }
  }

  if (!updatedAt && rolling && entry.composeFile) {
    // A rolling tag has no release to date, so the registry push date of the
    // exact tag we ship is the truthful answer for "when did this last change".
    const pins = parseImagePins(readFileSync(entry.composeFile, "utf-8"));
    const primary = primaryImage(pins, version);
    const image = primary && parseImage(primary.resolved);
    if (image) {
      try {
        updatedAt = await fetchDockerTagDate(image, image.tag, opts);
      } catch (e) {
        notes.push(`registry lookup failed: ${(e as Error).message}`);
      }
    }
    if (!updatedAt && meta?.pushedAt) updatedAt = meta.pushedAt;
  }

  // Note the asymmetry: for a pinned version we never fall back to repository
  // activity. "When did upstream last push" is not "when was 0.20.5 released",
  // and writing today's date next to a two-year-old pin would manufacture a
  // freshness the entry does not have.

  const current = String(data.updated_at ?? "").slice(0, 10);
  // Never move the date backwards: a later value may have been set by a
  // maintainer who knew better than the API (e.g. a re-tagged release).
  if (updatedAt && updatedAt > current) {
    propose("updated_at", data.updated_at ?? null, updatedAt);
  }

  if (changes.length && !READ_ONLY) {
    let text = entry.raw;
    for (const change of changes) {
      text = setField(text, change.field, change.to as string | number);
    }
    writeStack(entry, text);
  }

  return { slug: entry.slug, changes, suggestions, notes };
}

async function main() {
  // `--reject` is a bookkeeping operation, not a sync: record and stop.
  if (REJECTED.length) {
    if (!REASON) {
      console.error("--reject requires --reason (an unexplained override is unmaintainable)");
      process.exit(1);
    }
    for (const target of REJECTED) {
      const [slug, field] = target.split(":");
      if (!slug || !field) {
        console.error(`--reject expects <slug>:<field>, got "${target}"`);
        process.exit(1);
      }
      const entry = listStacks("hub", [slug])[0];
      if (!entry) {
        console.error(`unknown app: ${slug}`);
        process.exit(1);
      }
      // Pin the rejection to the value upstream reports right now, so a later,
      // different value is surfaced again instead of being silently swallowed.
      const result = await syncEntry(entry).catch(() => null);
      const upstream = result?.suggestions.find((s) => s.field === field);
      recordRejection(slug, field, String(upstream?.to ?? ""), REASON);
      console.log(`recorded: ${slug}.${field} stays curated (${REASON})`);
    }
    console.log(`updated ${OVERRIDES_FILE}`);
    return;
  }

  const stacks = listStacks("hub", ONLY);
  if (!stacks.length) {
    console.error("no stacks matched");
    process.exit(1);
  }
  console.error(
    `syncing metadata for ${stacks.length} stacks (concurrency ${CONCURRENCY})${
      CHECK ? " [check only]" : ""
    }`
  );

  let done = 0;
  const results = await pool(stacks, CONCURRENCY, async (entry) => {
    let result: Result;
    try {
      result = await syncEntry(entry);
    } catch (e) {
      result = {
        slug: entry.slug,
        changes: [],
        suggestions: [],
        notes: [`error: ${(e as Error).message}`],
      };
    }
    done++;
    if (done % 25 === 0) console.error(`  ${done}/${stacks.length}`);
    return result;
  });

  const changed = results.filter((r) => r.changes.length);
  const suggested = results.filter((r) => r.suggestions.length);
  const noted = results.filter((r) => r.notes.length);

  for (const r of changed) {
    console.log(`\n${r.slug}`);
    for (const c of r.changes) console.log(`  ${c.field}: ${c.from} -> ${c.to}`);
  }

  if (suggested.length) {
    console.log(
      "\nneeds review — upstream describes the repository, which is not always the software:"
    );
    for (const r of suggested) {
      for (const s of r.suggestions) {
        console.log(`  ${r.slug}.${s.field}: ${s.from} -> ${s.to}`);
        console.log(
          `    accept: --accept ${r.slug}:${s.field}    reject: --reject ${r.slug}:${s.field} --reason "..."`
        );
      }
    }
  }

  if (noted.length) {
    console.log("\nnotes:");
    for (const r of noted) for (const n of r.notes) console.log(`  ${r.slug}: ${n}`);
  }

  const byField = new Map<string, number>();
  for (const r of changed)
    for (const c of r.changes) byField.set(c.field, (byField.get(c.field) ?? 0) + 1);
  console.log(
    `\n${changed.length}/${stacks.length} stacks ${CHECK ? "out of date" : "updated"}` +
      (byField.size
        ? ` (${[...byField].map(([f, n]) => `${f}: ${n}`).join(", ")})`
        : "") +
      (suggested.length
        ? `, ${suggested.reduce((n, r) => n + r.suggestions.length, 0)} suggestion(s) awaiting review`
        : "")
  );

  if (JSON_OUT) {
    mkdirSync(dirname(JSON_OUT), { recursive: true });
    writeFileSync(
      JSON_OUT,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          checked: stacks.length,
          results: changed,
          suggestions: suggested,
          notes: noted,
        },
        null,
        2
      )
    );
  }

  if (CHECK && changed.length) process.exit(1);
}

await main();
