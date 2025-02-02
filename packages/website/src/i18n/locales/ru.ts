import type { I18n } from "~/i18n/locales";

export const ru: Partial<I18n> = {
  /** Generic */
  Download: "Скачать",

  /** Page / */
  "The *best free software* made&nbsp;*accessible*.":
    "Лучшие *бесплатные программы* сделаны&nbsp;*доступными*.",
  "Spin up local alternatives to": "Запустите локальные альтернативы для",
  "and other": "и другие",
  "popular software": "популярные программы",
  "Remix your own.": "",
  "Available for macOS": "Доступно для macOS",
  "Simply the best": "Просто лучшие",
  "Search software": "Поиск программ",

  /** Page /<stack> */
  "About *{name}*": "О *{name}*",
  "An alternative to": "Альтернатива для",
  Related: "Связанные",
} as const;
