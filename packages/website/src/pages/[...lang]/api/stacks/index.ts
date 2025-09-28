import { getStacks } from "~content/collections/stacks";
import { langs, useTranslations } from "~/i18n";
import type { APIRoute } from "astro";

export const GET: APIRoute = (context) => {
  console.log({ context });
  const lang = context.params.lang ?? "";
  const stacks = getStacks(lang);

  const orderByPubDate = (items: Array<any>) =>
    items.sort((a, b) => (a.pubDate > b.pubDate ? -1 : 1));

  const items = orderByPubDate(
    stacks.map((e) => ({
      slug: e.data.slug,
      name: e.data.name,
      version: e.data.version,
      updated_at: e.data.updated_at,
      description: e.data.description,
      license: e.data.license,
      tags: e.data.tags,
      alternativeTo: e.data.alternativeTo,
      link: `/${e.id}`,
      stars: e.data.stars,
    }))
  );

  const t = useTranslations(lang as (typeof langs)[number]);

  return new Response(
    JSON.stringify({
      items,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};

export const getStaticPaths = async () => {
  return langs.map((lang) => ({
    params: { lang },
  }));
};
