import { readFileSync } from "node:fs";

// The app version declared in the Tauri config. It is the version CI *will*
// publish, which is not necessarily the version that is published *now*: the
// config is bumped in a commit, the release appears minutes (or days) later.
// Linking to it directly is what produced 404s on the download page, so it is
// only ever used as a last-resort fallback here.
const configuredVersion = (): string => {
  const { version } = JSON.parse(
    readFileSync(
      new URL("../../../app/src-tauri/tauri.conf.json", import.meta.url),
      "utf-8"
    )
  );
  return version as string;
};

const REPO = "codename-co/stack";

export type Release = {
  /** Version without the `app-v` prefix, e.g. `0.2.4`. */
  version: string;
  /** Release tag, e.g. `app-v0.2.4`. */
  tag: string;
  /** Universal macOS installer. Guaranteed to exist when `resolved` is true. */
  dmgUrl: string;
  /** The GitHub release page. */
  htmlUrl: string;
  /** False when the GitHub API could not be reached and we fell back. */
  resolved: boolean;
};

let cached: Promise<Release> | undefined;

const fallback = (): Release => {
  const version = configuredVersion();
  const tag = `app-v${version}`;
  return {
    version,
    tag,
    // `releases/latest/download/...` resolves at click time on GitHub's side,
    // so even a stale build points at something that exists.
    dmgUrl: `https://github.com/${REPO}/releases/latest`,
    htmlUrl: `https://github.com/${REPO}/releases/latest`,
    resolved: false,
  };
};

/**
 * The latest *published* GitHub release, resolved once per build.
 *
 * Everything the website says about downloads derives from this, so a link can
 * never point at a release that does not exist yet. GITHUB_TOKEN is used when
 * present (CI passes `github.token`) purely to avoid the 60 req/h anonymous
 * rate limit; the call is memoised, so a build makes at most one request.
 */
export const getLatestRelease = (): Promise<Release> => {
  cached ??= (async () => {
    try {
      const token = process.env.GITHUB_TOKEN;
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/releases/latest`,
        {
          headers: {
            accept: "application/vnd.github+json",
            "user-agent": "stack.lol-website-build",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);

      const data = (await res.json()) as {
        tag_name: string;
        html_url: string;
        assets: { name: string; browser_download_url: string }[];
      };

      const tag = data.tag_name;
      const version = tag.replace(/^app-v/, "");
      const dmg = data.assets.find((a) => a.name.endsWith(".dmg"));
      if (!dmg) throw new Error(`no .dmg asset on ${tag}`);

      return {
        version,
        tag,
        dmgUrl: dmg.browser_download_url,
        htmlUrl: data.html_url,
        resolved: true,
      };
    } catch (error) {
      // A network hiccup must not break `npm run build`, so degrade to the
      // version-less "latest" URLs, which GitHub resolves server-side.
      console.warn(
        `[release] falling back to tauri.conf.json version: ${
          (error as Error).message
        }`
      );
      return fallback();
    }
  })();

  return cached;
};
