import type { I18n } from "~/i18n/locales";

export const ro: Partial<I18n> = {
  /** Generic */
  Download: "Descarca",
  Recipes: "Retete",
  Search: "Cauta",
  Back: "Inapoi",
  "No description provided.": "Nicio descriere furnizata.",

  /** Page / */
  "The *best free software* made&nbsp;*accessible*.":
    "Cel *mai bun software gratuit* facut&nbsp;*accesibil*.",
  "Spin up local alternatives to": "Creeaza alternative locale pentru",
  "and other": "si alte",
  "popular software": "software popular",
  "Remix your own.": "",
  "Available for macOS": "Disponibil pentru macOS",
  "★ {starCount} cumulative stars": "★ {starCount} stele cumulative",
  "Then install software in one-click ↓":
    "Apoi instaleaza software-ul cu un singur clic ↓",
  "Search software": "Cauta software",

  /** Page /<stack> */
  "About *{name}*": "Despre *{name}*",
  "An alternative to": "O alternativa pentru",
  Related: "Relatate",
} as const;
