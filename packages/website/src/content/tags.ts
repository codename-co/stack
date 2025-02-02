import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";
import { parse as parseYaml } from "yaml";

export const tags = defineCollection({
  loader: file("src/content/data/tags.yaml", {
    parser: (text) => parseYaml(text).tags,
  }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    title: z.string().optional(),
  }),
});
