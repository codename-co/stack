#!/usr/bin/env npx ts-node

import { globSync as glob } from "glob";
import { readFileSync, writeFileSync } from "node:fs";
import { parse as parseYAML, stringify } from "yaml";

const ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022";
const ANTHROPIC_API_KEY = globalThis.process.env.ANTHROPIC_API_KEY ?? "";
if (!ANTHROPIC_API_KEY) {
  console.error("Please set the ANTHROPIC_API_KEY environment variable.");
  globalThis.process.exit(1);
}

const SYSTEM_PROMPT = (targetLang: Language) => `
  You are a translator.

  Your task is to translate the english prompt given by the user to ${targetLang[1]}.

  Restitute the meaning of the text in the target language.

  Just translate the text to ${targetLang[1]}. Do not add any additional information. Do not explain the text. Do not provide any additional context.

  Preserve the Markdown formatting of the text. Do not alter the formatting of the text.
`;

type LanguageCode = string;
type LanguageName = string;
type Language = [LanguageCode, LanguageName];

const LANGUAGES: Language[] = [
  ["de", "German"],
  ["es", "Spanish"],
  ["fr", "French"],
  ["it", "Italian"],
  ["pt", "Portuguese"],
  ["ru", "Russian"],
  ["ar", "Arabic"],
  ["hi", "Hindi"],
  ["zh", "Chinese"],
  ["ko", "Korean"],
  ["ja", "Japanese"],
];

/**
 * Translate text to the target language using generative AI.
 */
const translate = async (
  prompt: string,
  targetLang: Language
): Promise<string | undefined> => {
  try {
    const response = await (
      await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
          system: SYSTEM_PROMPT(targetLang),
          stream: false,
        }),
      })
    ).json();

    const error = response.error;
    if (error) {
      throw new Error(`[${error.type}] ${error.message}`);
    }

    return response.content.reverse()[0].text;
  } catch (error) {
    console.error(`Error translating to ${targetLang[1]}:`, error);
    return undefined;
  }
};

const STACKS = glob("../hub/immi*/stack.yaml");

STACKS.forEach(async (file) => {
  const content = readFileSync(file, "utf-8");
  const stack = parseYAML(content);

  const { description, readme } = stack;

  let i18n = stack.i18n ?? {};
  const existingLanguages = Object.keys(i18n);

  // for all languages, promise all translations
  const translations = await Promise.all(
    LANGUAGES.map(async (lang) => {
      if (existingLanguages.includes(lang[0])) {
        return i18n[lang[0]];
      }

      const [translatedDescription, translatedReadme] = await Promise.all([
        translate(description, lang),
        translate(readme, lang),
      ]);

      if (!translatedDescription || !translatedReadme) {
        return i18n[lang[0]];
      }

      return {
        lang: lang[0],
        description: translatedDescription,
        readme: translatedReadme,
      };
    }).filter(Boolean)
  );

  for (const t of translations) {
    if (t?.lang === undefined) {
      continue;
    }

    i18n[t.lang] = {
      // slug: t.slug,
      description: t.description,
      readme: t.readme,
    };
  }

  const translatedStack = {
    ...stack,
    i18n,
  };

  // console.log(stringify(translatedStack));

  writeFileSync(file, stringify(translatedStack));

  return stack;
});

// translate("This is *very nice*.", ["ko", "Korean"]).then(console.log);
