import { getStacks } from "~content/collections/stacks";
import { langs } from "~/i18n";
import type { APIRoute } from "astro";

// Raw compose file contents keyed by absolute Vite path
const composeFiles = import.meta.glob<string>("~~/../hub/*/compose.yaml", {
  eager: true,
  query: "?raw",
  import: "default",
});

// Raw .env file contents keyed by absolute Vite path
const envFiles = import.meta.glob<string>("~~/../hub/*/.env", {
  eager: true,
  query: "?raw",
  import: "default",
});

// All hub files – lazy, loaded as raw text so Vite skips CSS/JS processing.
// We only call Object.keys() on this; the lazy functions are never invoked.
const allHubFiles = import.meta.glob("~~/../hub/**/*", {
  eager: false,
  query: "?raw",
});

const STANDARD_FILES = new Set(["compose.yaml", "stack.yaml", ".env"]);

/**
 * Given the full Vite path (e.g. /…/hub/activepieces/compose.yaml)
 * extract the part relative to hub/<slug>/ (e.g. "compose.yaml" or "config/nginx.conf")
 */
function relativeToSlug(vitePath: string, slug: string): string {
  const marker = `/hub/${slug}/`;
  const idx = vitePath.indexOf(marker);
  return idx === -1 ? vitePath : vitePath.slice(idx + marker.length);
}

function findBySlug<T>(
  map: Record<string, T>,
  slug: string,
  filename: string
): T | null {
  const key = Object.keys(map).find((p) =>
    p.includes(`/hub/${slug}/${filename}`)
  );
  return key !== undefined ? map[key] : null;
}

export const GET: APIRoute = (context) => {
  const { slug } = context.params;
  const lang = context.params.lang ?? "";

  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stacks = getStacks(lang);
  const stack = stacks.find((s) => s.data.slug === slug);

  if (!stack) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const compose = findBySlug(composeFiles, slug, "compose.yaml");
  const dotenv = findBySlug(envFiles, slug, ".env");

  // Collect asset paths relative to hub/<slug>/ — exclude standard files
  const assets = Object.keys(allHubFiles)
    .filter((p) => {
      const marker = `/hub/${slug}/`;
      if (!p.includes(marker)) return false;
      const rel = relativeToSlug(p, slug);
      // Skip standard files; keep everything else (including nested paths)
      const topLevel = rel.split("/")[0];
      return !STANDARD_FILES.has(topLevel);
    })
    .map((p) => relativeToSlug(p, slug))
    .sort();

  return new Response(
    JSON.stringify({
      metadata: stack.data,
      compose,
      dotenv,
      assets,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};

export const getStaticPaths = () => {
  // Generate one path per lang × slug. We derive slugs from the default locale
  // (slug list is identical across all langs) to avoid redundant getStacks calls.
  const slugs = getStacks("").map(({ data }) => data.slug);

  return langs.flatMap((lang) =>
    slugs.map((slug) => ({ params: { lang, slug } }))
  );
};
