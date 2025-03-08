import rss from "@astrojs/rss";
import { getRecipes } from "~content/collections/recipes";
import { getStacks } from "~content/collections/stacks";
import { langs, useTranslations } from "~/i18n";
import type { APIRoute } from "astro";

export const GET: APIRoute = (context) => {
  console.log({ context });
  const lang = context.params.lang ?? "";
  const stacks = getStacks(lang);
  const recipes = getRecipes(lang);

  const items = [
    ...stacks.map((e) => ({
      title: e.data.name,
      description: e.data.description,
      link: `/${e.id}`,
      pubDate: e.data.updated_at,
    })),
    ...recipes.map((e) => ({
      title: e.data.name,
      description: e.data.description,
      link: `/recipes/${e.id}`,
      pubDate: e.data.updated_at,
    })),
    // @ts-ignore
  ].sort((a, b) => (a.pubDate > b.pubDate ? -1 : 1));

  const t = useTranslations(lang as (typeof langs)[number]);

  return rss({
    title: "Stack",
    description: t("The best of free software, accessible"),
    site: String(context.site),
    trailingSlash: false,
    items,
    customData: `<language>${lang || "en-us"}</language>`,
  });
};

export const getStaticPaths = async () => {
  return langs.map((lang) => ({
    params: { lang },
  }));
};
