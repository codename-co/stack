// @ts-check
// @ts-check
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import ViteYaml from "@modyfi/vite-plugin-yaml";
import { defineConfig } from "astro/config";
import { envParse } from "vite-plugin-env-parse";

// https://astro.build/config
export default defineConfig({
  site: "https://stack.lol",

  devToolbar: {
    enabled: false,
  },

  prefetch: {
    defaultStrategy: "tap",
  },

  vite: {
    plugins: [envParse(), ViteYaml()],
  },

  integrations: [
    tailwind({
      // applyBaseStyles: false,
    }),
    react(),
    sitemap({
      entryLimit: 10000,
    }),
  ],

  i18n: {
    locales: ["en", "fr"],
    defaultLocale: "en",
  },

  trailingSlash: "ignore",
});
