import type { I18n } from "~/i18n/locales";

export const uk: Partial<I18n> = {
  /** Generic */
  Download: "Scarica",

  /** Page / */
  "The *best free software* made&nbsp;*accessible*.":
    "Найкраще *безкоштовне програмне забезпечення* зроблено&nbsp;*доступним*.",
  "Spin up local alternatives to": "Запустіть локальні альтернативи для",
  "and other": "і інші",
  "popular software": "популярне програмне забезпечення",
  "Remix your own.": "",
  "Available for macOS": "Доступно для macOS",
  "★ {starCount} cumulative stars": "★ {starCount} кумулятивні зірки",
  "Then install software in one-click ↓":
    "Потім встановіть програмне забезпечення в один клік ↓",
  "Search software": "Пошук програмного забезпечення",

  /** Page /<stack> */
  "About *{name}*": "Про *{name}*",
  "An alternative to": "Альтернатива для",
  Related: "Пов'язані",
} as const;
