// Upstream registry client shared by the hub maintenance scripts.
//
// Everything the hub says about a piece of software (stars, homepage, license,
// release dates, versions) has an authoritative source somewhere upstream. This
// module is the single place that knows how to talk to those sources, so the
// scripts on top of it only deal with hub data.
//
// Supported sources:
//   - GitHub          (205 of the 208 hub apps)
//   - Codeberg/Forgejo, GitLab
//   - Docker Hub, GHCR, Quay  (tag listings, for image-only stacks)
//
// Two cross-cutting concerns live here on purpose:
//   - a small on-disk response cache, so re-running a sweep locally (or a
//     retried CI job) costs no API quota and stays reproducible within a run;
//   - a bounded worker pool, because ~250 apps x several endpoints would
//     otherwise trip secondary rate limits.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

export const CACHE_DIR = process.env.STACK_UPSTREAM_CACHE ?? ".cache/upstream";
const DEFAULT_TTL_MS = Number(process.env.STACK_UPSTREAM_TTL ?? 6 * 3600 * 1000);

export type RepoHost = "github" | "codeberg" | "gitlab";

export interface RepoRef {
  host: RepoHost;
  owner: string;
  repo: string;
  /** `owner/repo`, as written upstream. */
  slug: string;
}

export interface RepoMeta {
  /** Canonical URL, after any upstream rename/transfer. */
  url: string;
  stars: number;
  /** Upstream-declared product homepage, empty when unset. */
  homepage: string;
  /** SPDX identifier when upstream states one unambiguously. */
  license: string;
  /** ISO date of the last push to the default branch. */
  pushedAt: string;
  archived: boolean;
}

export interface Release {
  /** Raw upstream tag, e.g. `v1.2.3`. */
  tag: string;
  /** Tag stripped of its leading `v`/name prefix, e.g. `1.2.3`. */
  version: string;
  date: string; // YYYY-MM-DD
  prerelease: boolean;
}

// ---------------------------------------------------------------------------
// HTTP plumbing
// ---------------------------------------------------------------------------

let githubToken: string | undefined;

/**
 * A token multiplies the GitHub quota by 12 (60 -> 5000 req/h), which is the
 * difference between a sweep that completes and one that dies halfway. CI
 * provides GITHUB_TOKEN; locally we borrow the `gh` CLI's token rather than ask
 * anyone to export one.
 */
export function resolveGithubToken(): string | undefined {
  if (githubToken !== undefined) return githubToken || undefined;
  githubToken =
    process.env.GITHUB_TOKEN ??
    process.env.GH_TOKEN ??
    (() => {
      try {
        return execFileSync("gh", ["auth", "token"], {
          encoding: "utf-8",
          stdio: ["ignore", "pipe", "ignore"],
        }).trim();
      } catch {
        return "";
      }
    })();
  return githubToken || undefined;
}

export class HttpError extends Error {
  status: number;
  url: string;
  constructor(status: number, url: string, message: string) {
    super(message);
    this.status = status;
    this.url = url;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface FetchOptions {
  /** Bypass the on-disk cache for this request. */
  noCache?: boolean;
  /** 404 is a legitimate answer for "does this tag exist?" style lookups. */
  allow404?: boolean;
}

/**
 * GET a JSON endpoint, with cache, retries and rate-limit awareness.
 *
 * Rate limiting is handled by waiting rather than failing: a sweep that pauses
 * for a minute still produces a complete, trustworthy dataset, whereas one that
 * gives up produces a partial diff that looks like real data loss.
 */
export async function fetchJSON<T = any>(
  url: string,
  opts: FetchOptions = {}
): Promise<T | null> {
  const cacheFile = join(
    CACHE_DIR,
    createHash("sha256").update(url).digest("hex").slice(0, 32) + ".json"
  );

  if (!opts.noCache && existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(readFileSync(cacheFile, "utf-8"));
      if (Date.now() - cached.at < DEFAULT_TTL_MS) return cached.body as T;
    } catch {
      // A corrupt cache entry is never worth failing over: refetch.
    }
  }

  const headers: Record<string, string> = {
    accept: "application/json",
    "user-agent": "stack-hub-maintenance (+https://stack.lol)",
  };
  if (url.startsWith("https://api.github.com/")) {
    const token = resolveGithubToken();
    if (token) headers.authorization = `Bearer ${token}`;
    headers.accept = "application/vnd.github+json";
    headers["x-github-api-version"] = "2022-11-28";
  }

  let lastError = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { headers });
    } catch (e) {
      lastError = String(e);
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    if (res.ok) {
      const body = (await res.json()) as T;
      mkdirSync(CACHE_DIR, { recursive: true });
      writeFileSync(cacheFile, JSON.stringify({ at: Date.now(), url, body }));
      return body;
    }

    // 422 is GitHub's answer to "that ref does not exist" on commit lookups,
    // and 451 is a DMCA takedown: both are answers, not failures.
    if (res.status === 404 || res.status === 422 || res.status === 451) {
      if (opts.allow404) return null;
      throw new HttpError(res.status, url, `${res.status} on ${url}`);
    }

    // Primary (x-ratelimit-remaining: 0) and secondary (retry-after) limits.
    const retryAfter = Number(res.headers.get("retry-after") ?? 0);
    const reset = Number(res.headers.get("x-ratelimit-reset") ?? 0);
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (retryAfter > 0 || (remaining === "0" && reset > 0)) {
      const waitMs = retryAfter
        ? retryAfter * 1000
        : Math.max(0, reset * 1000 - Date.now()) + 1000;
      console.warn(
        `  rate limited, waiting ${Math.ceil(waitMs / 1000)}s (${url})`
      );
      await sleep(Math.min(waitMs, 15 * 60 * 1000));
      continue;
    }

    lastError = `${res.status} ${res.statusText}`;
    if (res.status < 500 && res.status !== 429) break;
    await sleep(1000 * 2 ** attempt);
  }

  throw new HttpError(0, url, `failed to fetch ${url}: ${lastError}`);
}

/** Run `tasks` with at most `limit` in flight. */
export async function pool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

// ---------------------------------------------------------------------------
// Repository references
// ---------------------------------------------------------------------------

const HOSTS: Record<string, RepoHost> = {
  "github.com": "github",
  "www.github.com": "github",
  "codeberg.org": "codeberg",
  "gitlab.com": "gitlab",
};

/**
 * Parse a `repository:` value into a host/owner/repo triple.
 *
 * Returns null for anything we cannot query (self-hosted forges, deep links
 * into a monorepo subtree such as the recipe entries, non-URLs).
 */
export function parseRepository(url: string | undefined): RepoRef | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = HOSTS[parsed.hostname];
  if (!host) return null;

  const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (parts.length < 2) return null;
  // `/owner/repo/tree/main/...` — a subtree link, not a repository of its own.
  if (parts.length > 2 && ["tree", "blob", "-"].includes(parts[2])) return null;
  if (parts.length > 2 && host !== "gitlab") return null;

  const owner = host === "gitlab" ? parts.slice(0, -1).join("/") : parts[0];
  const repo = parts[parts.length - 1].replace(/\.git$/, "");
  return { host, owner, repo, slug: `${owner}/${repo}` };
}

// ---------------------------------------------------------------------------
// Repository metadata
// ---------------------------------------------------------------------------

const iso = (value: string | null | undefined): string =>
  value ? String(value).slice(0, 10) : "";

/**
 * `NOASSERTION` means GitHub's classifier found a LICENSE file it could not
 * identify; `other` means the same on Forgejo. Writing either into the hub
 * would replace a curated, correct value with noise.
 */
const cleanLicense = (id: string | null | undefined): string => {
  const value = (id ?? "").trim();
  if (!value || /^(noassertion|other|unlicensed|none)$/i.test(value)) return "";
  return value;
};

export async function fetchRepoMeta(
  ref: RepoRef,
  opts: FetchOptions = {}
): Promise<RepoMeta | null> {
  switch (ref.host) {
    case "github": {
      const r = await fetchJSON<any>(
        `https://api.github.com/repos/${ref.owner}/${ref.repo}`,
        { ...opts, allow404: true }
      );
      if (!r) return null;
      return {
        // `html_url` is the canonical location: GitHub resolves renames and
        // transfers transparently, so this is how a moved repo is detected.
        url: r.html_url,
        stars: r.stargazers_count ?? 0,
        homepage: (r.homepage ?? "").trim(),
        license: cleanLicense(r.license?.spdx_id),
        pushedAt: iso(r.pushed_at),
        archived: Boolean(r.archived),
      };
    }
    case "codeberg": {
      const r = await fetchJSON<any>(
        `https://codeberg.org/api/v1/repos/${ref.owner}/${ref.repo}`,
        { ...opts, allow404: true }
      );
      if (!r) return null;
      return {
        url: r.html_url,
        stars: r.stars_count ?? 0,
        homepage: (r.website ?? "").trim(),
        license: "",
        pushedAt: iso(r.updated_at),
        archived: Boolean(r.archived),
      };
    }
    case "gitlab": {
      const id = encodeURIComponent(`${ref.owner}/${ref.repo}`);
      const r = await fetchJSON<any>(
        `https://gitlab.com/api/v4/projects/${id}?license=true`,
        { ...opts, allow404: true }
      );
      if (!r) return null;
      return {
        url: r.web_url,
        stars: r.star_count ?? 0,
        homepage: "",
        license: cleanLicense(r.license?.key?.toUpperCase()),
        pushedAt: iso(r.last_activity_at),
        archived: Boolean(r.archived),
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Releases
// ---------------------------------------------------------------------------

/**
 * Tags that name a moving target rather than a release. The version they point
 * at changes under us, so they can never be "out of date" and have no release
 * date of their own.
 */
export function isRollingTag(tag: string): boolean {
  return /^(latest|stable|edge|main|master|nightly|rolling|dev|release)([-_.].*)?$/i.test(
    tag.trim()
  );
}

/**
 * Strip the decoration around a version inside a tag: `v1.2.3`, `app-1.2.3`,
 * `release/1.2.3` all describe version `1.2.3`.
 */
export function normalizeTag(tag: string): string {
  return tag
    .replace(/^[\w.@/-]*?[-/]?v?(?=\d)/, "")
    .replace(/^v/, "")
    .trim();
}

const PRERELEASE =
  /(alpha|beta|rc\d*|-rc|canary|nightly|preview|snapshot|dev|insiders|test|pre)/i;

export function isStableVersion(version: string): boolean {
  return /^\d/.test(version) && !PRERELEASE.test(version);
}

/** Releases newest-first. Falls back to tags for projects that only tag. */
export async function fetchReleases(
  ref: RepoRef,
  opts: FetchOptions = {}
): Promise<Release[]> {
  if (ref.host === "github") {
    const list =
      (await fetchJSON<any[]>(
        `https://api.github.com/repos/${ref.owner}/${ref.repo}/releases?per_page=100`,
        { ...opts, allow404: true }
      )) ?? [];
    const releases = list
      .filter((r) => !r.draft)
      .map((r) => ({
        tag: r.tag_name as string,
        version: normalizeTag(r.tag_name),
        date: iso(r.published_at ?? r.created_at),
        prerelease: Boolean(r.prerelease) || !isStableVersion(normalizeTag(r.tag_name)),
      }));
    if (releases.length) return releases;

    // Tag-only project: dates need a second call per tag, so we only date the
    // handful of most recent ones — that is all any caller looks at.
    const tags =
      (await fetchJSON<any[]>(
        `https://api.github.com/repos/${ref.owner}/${ref.repo}/tags?per_page=100`,
        { ...opts, allow404: true }
      )) ?? [];
    return tags.map((t) => ({
      tag: t.name as string,
      version: normalizeTag(t.name),
      date: "",
      prerelease: !isStableVersion(normalizeTag(t.name)),
    }));
  }

  if (ref.host === "codeberg") {
    const list =
      (await fetchJSON<any[]>(
        `https://codeberg.org/api/v1/repos/${ref.owner}/${ref.repo}/releases?limit=50`,
        { ...opts, allow404: true }
      )) ?? [];
    return list
      .filter((r) => !r.draft)
      .map((r) => ({
        tag: r.tag_name,
        version: normalizeTag(r.tag_name),
        date: iso(r.published_at ?? r.created_at),
        prerelease: Boolean(r.prerelease) || !isStableVersion(normalizeTag(r.tag_name)),
      }));
  }

  const id = encodeURIComponent(`${ref.owner}/${ref.repo}`);
  const list =
    (await fetchJSON<any[]>(
      `https://gitlab.com/api/v4/projects/${id}/releases?per_page=50`,
      { ...opts, allow404: true }
    )) ?? [];
  return list.map((r) => ({
    tag: r.tag_name,
    version: normalizeTag(r.tag_name),
    date: iso(r.released_at ?? r.created_at),
    prerelease: !isStableVersion(normalizeTag(r.tag_name)),
  }));
}

/**
 * Publication date of one specific version.
 *
 * The hub pins a version, so `updated_at` must describe *that* release and not
 * whatever landed upstream since — otherwise the pair (version, updated_at)
 * would claim a release date the shipped version never had.
 */
export async function fetchReleaseDate(
  ref: RepoRef,
  version: string,
  releases: Release[],
  opts: FetchOptions = {}
): Promise<string> {
  const wanted = normalizeTag(version);
  const hit = releases.find((r) => r.version === wanted || r.tag === version);
  if (hit?.date) return hit.date;
  if (ref.host !== "github") return "";

  // Not in the first page (old release) or tag-only project: ask directly.
  for (const tag of [version, `v${version}`, hit?.tag].filter(Boolean) as string[]) {
    const release = await fetchJSON<any>(
      `https://api.github.com/repos/${ref.owner}/${ref.repo}/releases/tags/${encodeURIComponent(tag)}`,
      { ...opts, allow404: true }
    );
    if (release?.published_at) return iso(release.published_at);

    const commit = await fetchJSON<any>(
      `https://api.github.com/repos/${ref.owner}/${ref.repo}/commits/${encodeURIComponent(tag)}`,
      { ...opts, allow404: true }
    );
    const date = commit?.commit?.committer?.date ?? commit?.commit?.author?.date;
    if (date) return iso(date);
  }
  return "";
}

// ---------------------------------------------------------------------------
// Container registries
// ---------------------------------------------------------------------------

export interface ImageRef {
  registry: "dockerhub" | "ghcr" | "quay" | "other";
  /** Repository path without registry host, e.g. `library/postgres`. */
  name: string;
  tag: string;
  raw: string;
}

/** Parse a compose `image:` value, with the `${VAR:-default}` pin resolved. */
export function parseImage(image: string): ImageRef | null {
  const raw = image.trim();
  if (!raw) return null;
  const at = raw.lastIndexOf("@");
  const withoutDigest = at > 0 ? raw.slice(0, at) : raw;
  const lastColon = withoutDigest.lastIndexOf(":");
  const lastSlash = withoutDigest.lastIndexOf("/");
  const tag = lastColon > lastSlash ? withoutDigest.slice(lastColon + 1) : "latest";
  const path = lastColon > lastSlash ? withoutDigest.slice(0, lastColon) : withoutDigest;

  const [maybeHost, ...rest] = path.split("/");
  if (rest.length && (maybeHost.includes(".") || maybeHost.includes(":"))) {
    const name = rest.join("/");
    if (maybeHost === "ghcr.io") return { registry: "ghcr", name, tag, raw };
    if (maybeHost === "quay.io") return { registry: "quay", name, tag, raw };
    if (maybeHost.endsWith("docker.io"))
      return { registry: "dockerhub", name: name.includes("/") ? name : `library/${name}`, tag, raw };
    return { registry: "other", name, tag, raw };
  }
  return {
    registry: "dockerhub",
    name: path.includes("/") ? path : `library/${path}`,
    tag,
    raw,
  };
}

/** Tags available for an image, newest-first where the registry allows it. */
export async function fetchImageTags(
  image: ImageRef,
  opts: FetchOptions = {}
): Promise<string[]> {
  if (image.registry === "dockerhub") {
    const r = await fetchJSON<any>(
      `https://hub.docker.com/v2/repositories/${image.name}/tags?page_size=100&ordering=last_updated`,
      { ...opts, allow404: true }
    );
    return (r?.results ?? []).map((t: any) => t.name as string);
  }
  if (image.registry === "ghcr" || image.registry === "quay") {
    if (image.registry === "quay") {
      const r = await fetchJSON<any>(
        `https://quay.io/api/v1/repository/${image.name}/tag/?limit=100&onlyActiveTags=true`,
        { ...opts, allow404: true }
      );
      return (r?.tags ?? []).map((t: any) => t.name as string);
    }
    // GHCR requires a token even for public images; the anonymous one is free.
    const token = await fetchJSON<any>(
      `https://ghcr.io/token?scope=repository:${image.name}:pull&service=ghcr.io`,
      { ...opts, allow404: true }
    );
    if (!token?.token) return [];
    const res = await fetch(`https://ghcr.io/v2/${image.name}/tags/list?n=1000`, {
      headers: { authorization: `Bearer ${token.token}` },
    });
    if (!res.ok) return [];
    return ((await res.json()) as any).tags ?? [];
  }
  return [];
}

/** Last push date of a Docker Hub tag (the "Docker API" freshness signal). */
export async function fetchDockerTagDate(
  image: ImageRef,
  tag: string,
  opts: FetchOptions = {}
): Promise<string> {
  if (image.registry !== "dockerhub") return "";
  const r = await fetchJSON<any>(
    `https://hub.docker.com/v2/repositories/${image.name}/tags/${encodeURIComponent(tag)}`,
    { ...opts, allow404: true }
  );
  return iso(r?.last_updated ?? r?.tag_last_pushed);
}
