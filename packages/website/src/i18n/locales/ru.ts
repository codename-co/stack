import type { I18n } from "~/i18n/locales";

export const ru: Partial<I18n> = {
  /** Generic */
  Download: "Скачать",
  Recipes: "Рецепты",
  Search: "Поиск",
  Back: "Назад",
  "No description provided.": "Описание отсутствует.",

  /** Page / */
  "The *best free software* made&nbsp;*accessible*.":
    "Лучшие *бесплатные программы* сделаны&nbsp;*доступными*.",
  "Spin up local alternatives to": "Запустите локальные альтернативы для",
  "and other": "и другие",
  "popular software": "популярные программы",
  "Remix your own.": "",
  "Available for macOS": "Доступно для macOS",
  "★ {starCount} cumulative stars": "★ {starCount} накопленных звёзд",
  "Then install software in one-click ↓":
    "Затем установите программу в один клик ↓",
  "Search software": "Поиск программ",

  /** Page /<stack> */
  "About *{name}*": "О *{name}*",
  "An alternative to": "Альтернатива для",
  Related: "Связанные",
} as const;
