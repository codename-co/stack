import * as localesIndex from "./locales/index";

export const languages = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  pt: "Português",
  ro: "Română",
  nl: "Nederlands",
  tr: "Türkçe",
  ar: "العربية",
  uk: "Українська",
  ru: "Русский",
  hi: "हिन्दी",
  zh: "中文",
  ko: "한국어",
  ja: "日本語",
} as const;

export const defaultLang = "en";

export type I18n = Record<(typeof localesIndex.en)[number], string>;

export const locales = localesIndex as Record<
  keyof typeof languages,
  I18n | Partial<I18n>
>;
