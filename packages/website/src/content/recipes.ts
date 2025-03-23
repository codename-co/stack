import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// At launch, prepare the src/content/stacks and src/content/recipes directories to collect the JSON of each stacks:
import "./prepareStacksAndRecipes";
import { languages } from "~/i18n";

const langCodes = Object.keys(languages);

export const recipes = defineCollection({
  loader: glob({ pattern: "recipes/*.json", base: "src/content/data" }),
  schema: z.object({
    type: z.literal("recipe"),
    slug: z.string(),
    name: z.string(),
    icon: z.string().optional(),
    flavor: z.string(),
    version: z.coerce.string(),
    updated_at: z
      .string()
      .transform((str) => new Date(str))
      .optional(),
    description: z.string(),
    author: z.string(),
    license: z.string(),
    homepage: z.string().optional(),
    repository: z.string().optional(),
    tags: z.array(z.string()).optional(),
    alternativeTo: z.array(z.string()).optional(),
    dependencies: z
      .array(
        z.object({
          name: z.string(),
          icon: z.string().optional(),
          role: z.string().optional(),
          custom: z.boolean().optional(),
        })
      )
      .optional(),
    readme: z.string().optional(),
    env: z.record(z.any()).optional(),
    size: z.number().optional(),
    stars: z.number().optional(),
    rank: z.number(),
    i18n: z
      .record(
        z.enum(langCodes as [string, ...string[]]),
        z.object({
          slug: z.string().optional(),
          name: z.string().optional(),
          description: z.string().optional(),
          readme: z.string().optional(),
        })
      )
      .optional(),
  }),
});
