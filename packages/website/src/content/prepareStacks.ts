// This script prepares the stack metadata for the website by combining the stack.yaml, stack.*.yaml, and .env files
// and writing the resulting JSON files to the src/content/stacks directory.

import { writeFileSync } from "node:fs";
import { parseDotEnv } from "~/helpers/dotenv";

type Stack = {
  $schema?: string;
  slug: string;
  name: string;
  flavor:
    | "HelmChart"
    | "DockerCompose"
    | "DockerService"
    | "NodePackage"
    | "GoPackage"
    | "StaticWebsite";
  version: string;
  updated_at?: Date;
  description: string;
  author: string;
  license: string;
  homepage?: string;
  repository?: string;
  tags?: string[];
  alternativeTo?: string[];
  readme?: string;
  env?: Record<string, any>;
  size?: number;
  stars?: number;
  rank: number;
  lang?: string;
};

console.debug("Preparing stacks…");

const stackConfigs: Record<string, Record<string, Stack>> = import.meta.glob(
  "~~/../hub/*/stack.yaml",
  {
    eager: true,
  },
);
// const stackLangConfigs: Record<
//   string,
//   Record<string, Stack>
// > = import.meta.glob("~~/../hub/*/stack.*.yaml", {
//   eager: true,
// });
const stackEnvs: Record<string, Record<string, string>> = import.meta.glob(
  "~~/../hub/*/.env",
  {
    eager: true,
    query: "?raw",
  },
);
// const stackBundles = import.meta.glob("~~/../hub/*/*.stack", {
//   eager: true,
//   query: "?raw",
// });

const stacksBase = await Promise.all(
  Object.entries<{
    [s: string]: Stack;
  }>(stackConfigs).map(async ([path, stackConfig]) => {
    const stackMetadata = stackConfig.default;
    delete stackMetadata.$schema;
    stackMetadata.env = parseDotEnv(
      stackEnvs[path.replace("stack.yaml", ".env")]?.default,
    );
    // stackMetadata.size =
    //   stackBundles[path.replace("stack.yaml", `${stackMetadata.slug}.stack`)]
    //     ?.default?.length ?? undefined;
    // if (stackMetadata.repository) {
    //   stackMetadata.stars = await getRepoStars(stackMetadata.repository);
    // }
    stackMetadata.rank =
      (stackMetadata.stars ?? 0) /
      Math.pow(
        (Date.now() - (stackMetadata.updated_at?.getTime() ?? Date.now())) /
          1000 /
          60 /
          60 +
          2,
        0.5,
      );
    return stackMetadata;
  }),
);

// const stacksLang = await Promise.all(
//   Object.entries<{
//     [s: string]: Stack;
//   }>(stackLangConfigs).map(async ([path, stackConfig]) => {
//     const stackMetadata = stackConfig.default;
//     delete stackMetadata.$schema;

//     stackMetadata.lang = path
//       .replace(/\.yaml$/, "")
//       .split(".")
//       .pop();
//     return stackMetadata;
//   }),
// );

// const availableLanguages = [...new Set(stacksLang.map((s) => s.lang))];

const stacks = stacksBase.map((stack) => ({
  ...stack,
  // i18n: {
  //   // Dynamically create language-specific metadata
  //   ...Object.fromEntries(
  //     availableLanguages.map((lang) => [
  //       lang,
  //       {
  //         ...stacksLang.find((s) => s.slug === stack.slug && s.lang === lang),
  //       },
  //     ]),
  //   ),
  // },
}));

// Write the collection to the file system
for (const stack of stacks) {
  writeFileSync(
    `src/content/data/stacks/${stack.slug}.json`,
    JSON.stringify(stack, null, 2),
  );
}

console.debug(`${stacks.length} stacks prepared.`);
