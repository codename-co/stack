import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";
import { parse as parseYaml } from "yaml";

export const promoted = defineCollection({
  loader: file("src/content/data/promoted.yaml", {
    parser: (text) => parseYaml(text).promoted,
  }),
  schema: z.object({
    slug: z.string(),
  }),
});
