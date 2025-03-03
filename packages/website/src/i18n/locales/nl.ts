import type { I18n } from "~/i18n/locales";

export const nl: Partial<I18n> = {
  /** Generic */
  Download: "Downloaden",
  Recipes: "Recepten",
  Search: "Zoeken",
  Back: "Terug",
  "No description provided.": "Geen beschrijving gegeven.",

  /** Page / */
  "The *best free software* made&nbsp;*accessible*.":
    "De *beste gratis software* gemaakt&nbsp;*toegankelijk*.",
  "Spin up local alternatives to": "Lokale alternatieven voor",
  "and other": "en andere",
  "popular software": "populaire software",
  "Remix your own.": "",
  "Available for macOS": "Beschikbaar voor macOS",
  "★ {starCount} cumulative stars": "★ {starCount} cumulatieve sterren",
  "Then install software in one-click ↓":
    "Installeer vervolgens software in één klik ↓",
  "Search software": "Zoek software",

  /** Page /<stack> */
  "About *{name}*": "Over *{name}*",
  "An alternative to": "Een alternatief voor",
  Related: "Gerelateerd",
} as const;
