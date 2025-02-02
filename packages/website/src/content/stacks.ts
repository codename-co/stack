import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// At launch, prepare the src/content/stacks directory to collect the JSON of each stacks:
import "./prepareStacks";
import { languages } from "~/i18n";

const langCodes = Object.keys(languages);

export const stacks = defineCollection({
  loader: glob({ pattern: "stacks/*.json", base: "src/content/data" }),
  schema: z.object({
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
          description: z.string().optional(),
          readme: z.string().optional(),
        }),
      )
      .optional(),
  }),
});
