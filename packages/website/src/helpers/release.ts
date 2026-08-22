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

export const REPO = "codename-co/stack";

/** The GitHub release page for whatever is newest, resolved by GitHub itself. */
export const LATEST_RELEASE_URL = `https://github.com/${REPO}/releases/latest`;

export type Platform = "mac" | "windows" | "linux";

export type ArtifactId =
  | "dmg"
  | "exe"
  | "msi"
  | "appimage"
  | "deb"
  | "rpm";

export type Artifact = {
  id: ArtifactId;
  platform: Platform;
  /** Human label, e.g. `Universal (Apple Silicon & Intel)`. */
  label: string;
  /** File extension shown next to the label, e.g. `.dmg`. */
  ext: string;
  /** Direct download URL, or the release page when unresolved. */
  url: string;
  /** Asset file name, when resolved. */
  name?: string;
  /** Asset size in bytes, when resolved. */
  size?: number;
  /**
   * Regex (as a string) matching the asset name inside *any* release. The
   * download pages hand it to the browser so a cached/stale page can
   * re-resolve the newest asset at click time — see `LatestDownload.astro`.
   */
  pattern: string;
};

export type Release = {
  /** Version without the `app-v` prefix, e.g. `0.2.5`. */
  version: string;
  /** Release tag, e.g. `app-v0.2.5`. */
  tag: string;
  /** The GitHub release page. */
  htmlUrl: string;
  /** False when the GitHub API could not be reached and we fell back. */
  resolved: boolean;
  /** Every artifact we advertise, resolved or falling back to the release page. */
  artifacts: Artifact[];
};

/**
 * What we advertise, per platform, in display order. The first entry of a
 * platform is its recommended download.
 *
 * The patterns deliberately anchor on `$` so that the detached minisign
 * signatures (`…deb.sig`) and the updater tarball never leak into the UI.
 */
const SPECS: Omit<Artifact, "url">[] = [
  {
    id: "dmg",
    platform: "mac",
    label: "Universal (Apple Silicon & Intel)",
    ext: ".dmg",
    pattern: String.raw`_universal\.dmg$`,
  },
  {
    id: "exe",
    platform: "windows",
    label: "Installer (64-bit)",
    ext: ".exe",
    pattern: String.raw`_x64-setup\.exe$`,
  },
  {
    id: "msi",
    platform: "windows",
    label: "MSI package (64-bit)",
    ext: ".msi",
    pattern: String.raw`_x64_[A-Za-z-]+\.msi$`,
  },
  {
    id: "appimage",
    platform: "linux",
    label: "AppImage (x86_64)",
    ext: ".AppImage",
    pattern: String.raw`_amd64\.AppImage$`,
  },
  {
    id: "deb",
    platform: "linux",
    label: "Debian / Ubuntu (x86_64)",
    ext: ".deb",
    pattern: String.raw`_amd64\.deb$`,
  },
  {
    id: "rpm",
    platform: "linux",
    label: "Fedora / RHEL (x86_64)",
    ext: ".rpm",
    pattern: String.raw`\.x86_64\.rpm$`,
  },
];

export const platformName: Record<Platform, string> = {
  mac: "macOS",
  windows: "Windows",
  linux: "Linux",
};

/** Artifacts for one platform, recommended one first. */
export const artifactsFor = (release: Release, platform: Platform) =>
  release.artifacts.filter((a) => a.platform === platform);

let cached: Promise<Release> | undefined;

const fallback = (): Release => {
  const version = configuredVersion();
  return {
    version,
    tag: `app-v${version}`,
    htmlUrl: LATEST_RELEASE_URL,
    resolved: false,
    // The release page always exists and always shows the newest assets, so a
    // failed API call degrades to "one extra click", never to a 404.
    artifacts: SPECS.map((spec) => ({ ...spec, url: LATEST_RELEASE_URL })),
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
        assets: { name: string; browser_download_url: string; size: number }[];
      };

      const tag = data.tag_name;
      const version = tag.replace(/^app-v/, "");

      const artifacts = SPECS.map((spec) => {
        const asset = data.assets.find((a) =>
          new RegExp(spec.pattern).test(a.name)
        );
        return asset
          ? {
              ...spec,
              url: asset.browser_download_url,
              name: asset.name,
              size: asset.size,
            }
          : // A platform can be missing from a given release (a build failed,
            // or the target was added later): point at the release page rather
            // than dropping the platform silently.
            { ...spec, url: data.html_url };
      });

      if (!artifacts.some((a) => a.name)) {
        throw new Error(`no known asset on ${tag}`);
      }

      return {
        version,
        tag,
        htmlUrl: data.html_url,
        resolved: true,
        artifacts,
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

/** `11.4 MB`, or an empty string when the size is unknown. */
export const formatSize = (bytes?: number) =>
  bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : "";
