import { getCollection } from "astro:content";

// const promoted = await getCollection("promoted");
const _recipes = await getCollection("recipes");

export const getRecipes = (lang: string) =>
  _recipes
    .sort((a, b) => {
      // const aPromoted = promoted.some(({ data }) => data.slug === a.data.slug);
      // const bPromoted = promoted.some(({ data }) => data.slug === b.data.slug);

      // if (aPromoted && !bPromoted) {
      //   return -1;
      // }
      // if (!aPromoted && bPromoted) {
      //   return 1;
      // }

      const aRank = a.data.rank ?? 0;
      const bRank = b.data.rank ?? 0;

      return aRank > bRank ? -1 : aRank < bRank ? 1 : 0;
    })
    .map((recipe) => ({
      ...recipe,
      data: {
        ...recipe.data,
        type: recipe.data.type ?? "recipe",
        name: recipe.data.i18n?.[lang]?.name ?? recipe.data.name,
        description:
          recipe.data.i18n?.[lang]?.description ?? recipe.data.description,
        readme: recipe.data.i18n?.[lang]?.readme ?? recipe.data.readme,
      },
    }));
