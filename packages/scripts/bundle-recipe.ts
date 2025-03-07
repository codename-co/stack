#!/usr/bin/env npx ts-node

// Bundle a recipe and its dependencies into a single directory.
// Usage: ./packages/scripts/bundle-recipe.ts <recipe-slug>
//        ./packages/scripts/bundle-recipe.ts

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { argv } from "node:process";
import { parse as parseYAML, stringify } from "yaml";

const args = argv.slice(2);

const ROOT_DEST_FOLDER = "./recipes/.dist";

const bundleRecipe = (recipeSlug: string) => {
  const recipePath = `./recipes/${recipeSlug}`;

  const rootCompose = parseYAML(
    readFileSync(`${recipePath}/compose.yaml`, "utf-8")
  );
  // const stack = parseYAML(readFileSync(`${recipePath}/stack.yaml`, "utf-8"));

  const hasComposeIncludes = rootCompose.include?.length > 0;

  if (!hasComposeIncludes) {
    console.warn("No includes found in compose.yaml");
    process.exit(0);
  }

  const dependencies = rootCompose.include.map((file: string) => {
    console.log(`Reading ${recipePath}/${file}`);
    const stackFilePath = `${recipePath}/${file}`.replace(
      /compose\.yaml$/,
      "stack.yaml"
    );
    const content = readFileSync(stackFilePath, "utf-8");
    const parsed = parseYAML(content);
    return parsed;
  });

  rootCompose.include = rootCompose.include.map((file: string) =>
    file.replace("../../hub/", "./stacks/")
  );

  // console.log(stringify(rootCompose));

  const outdir = `${ROOT_DEST_FOLDER}/${recipeSlug}`;
  // create directory if it doesn't exist
  mkdirSync(outdir, { recursive: true });

  execSync(`cp -R ${recipePath} ${ROOT_DEST_FOLDER}`);
  console.debug(`Copied ${recipePath} to ${ROOT_DEST_FOLDER}`);

  writeFileSync(`${outdir}/compose.yaml`, stringify(rootCompose));
  console.log(`Wrote ${outdir}/compose.yaml`);

  dependencies.forEach((dep) => {
    // Copy ./hub/${dep}/ to ./stacks/${recipeSlug}/
    const depPath = `./hub/${dep.slug}`;
    const depOutdir = `${ROOT_DEST_FOLDER}/${recipeSlug}/stacks/`;
    mkdirSync(depOutdir, { recursive: true });
    execSync(`cp -R ${depPath} ${depOutdir}`);
    console.debug(`Copied ${depPath} to ${depOutdir}`);
  });
};

if (args.length === 1) {
  bundleRecipe(args[0]);
} else {
  // bundle all recipes

  const stdout = execSync(
    "ls ./recipes | grep -v .dist | grep -v README.md"
  ).toString();
  const recipes = stdout.split("\n").filter((r) => r.length > 0);
  recipes.forEach(bundleRecipe);
}
