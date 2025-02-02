import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";
import { parse as parseYaml } from "yaml";

export const alternatives = defineCollection({
  loader: file("src/content/data/alternatives.yaml", {
    parser: (text) => parseYaml(text).alternatives,
  }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    icon: z.string().optional(),
    description: z.string().optional(),
  }),
});
