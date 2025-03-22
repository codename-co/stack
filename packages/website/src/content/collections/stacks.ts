import { getCollection } from "astro:content";

// const promoted = await getCollection("promoted");
const _stacks = await getCollection(
  "stacks",
  ({ data }) =>
    // import.meta.env.PROD ?
    ["working", "starting", undefined].includes(data.status)
  // : true
);

export const getStacks = (lang: string) =>
  _stacks
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
    .map((stack) => ({
      ...stack,
      data: {
        ...stack.data,
        description:
          stack.data.i18n?.[lang]?.description ?? stack.data.description,
        readme: stack.data.i18n?.[lang]?.readme ?? stack.data.readme,
      },
    }));
