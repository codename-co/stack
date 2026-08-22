import type { APIRoute } from "astro";

/**
 * The Tauri updater manifest, mirrored from the latest GitHub release.
 *
 * Apps in the wild poll `https://stack.lol/releases/latest.json` (it is the
 * last endpoint in `tauri.conf.json`, and the *only* one older builds knew
 * about). That path used to be a file rsynced to the minicloud box; on GitHub
 * Pages it disappeared, which stranded those installs on a 404. Serving the
 * manifest from here keeps them updating, while the payload URLs point at
 * GitHub Releases, so nothing but this small JSON is hosted by us.
 *
 * The signatures are copied verbatim: they are minisign signatures over the
 * artifacts, so the updater still refuses anything we could have tampered with.
 */
export const GET: APIRoute = async () => {
  const url =
    "https://github.com/codename-co/stack/releases/latest/download/latest.json";

  const res = await fetch(url, {
    headers: { "user-agent": "stack.lol-website-build" },
    redirect: "follow",
  });

  if (!res.ok) {
    // Better a build-time failure than silently publishing a manifest that
    // tells every installed app there is nothing to update to.
    throw new Error(`cannot fetch updater manifest: ${url} -> ${res.status}`);
  }

  const manifest = await res.json();

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "content-type": "application/json",
      // Advisory only (GitHub Pages sets its own), but honoured by Cloudflare
      // if the zone is proxied again.
      "cache-control": "public, max-age=600",
    },
  });
};
