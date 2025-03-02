import type { I18n } from "~/i18n/locales";

export const it: Partial<I18n> = {
  /** Generic */
  Download: "Scarica",

  /** Page / */
  "The *best free software* made&nbsp;*accessible*.":
    "Il *miglior software libero* reso&nbsp;*accessibile*.",
  "Spin up local alternatives to": "Avvia alternative locali a",
  "and other": "e altri",
  "popular software": "software popolare",
  "Remix your own.": "",
  "Available for macOS": "Disponibile per macOS",
  "★ {starCount} cumulative stars": "★ {starCount} stelle cumulative",
  "Then install software in one-click ↓":
    "Poi installa il software in un clic ↓",
  "Search software": "Cerca software",

  /** Page /<stack> */
  "About *{name}*": "Informazioni su *{name}*",
  "An alternative to": "Un'alternativa a",
  Related: "Correlati",
} as const;
