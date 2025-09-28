import type { I18n } from "~/i18n/locales";

export const it: Partial<I18n> = {
  /** Generic */
  Stack: "Stack",
  Stacks: "Stacks",
  Download: "Scarica",
  Recipes: "Ricette",
  Catalog: "Catalogo",
  Back: "Indietro",
  "No description provided.": "Nessuna descrizione fornita.",

  /** Page / */
  "The best of free software, accessible":
    "Il meglio del software libero, accessibile",
  "The *best free software* made&nbsp;*accessible*.":
    "Il *miglior software libero* reso&nbsp;*accessibile*.",
  "Spin up local alternatives to": "Avvia alternative locali a",
  "and other": "e altri",
  "popular software": "software popolare",
  "Remix your own.": "",
  "Available for macOS": "Disponibile per macOS",
  "★ {starCount} cumulative stars": "★ {starCount} stelle cumulative",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "Accedi a {count}+ pacchetti software open source curati, pronti per l'installazione con un clic.",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "Alternative gratuite, sicure e incentrate sulla privacy a [app popolari]({url}).",
  "Then install software in one-click ↓":
    "Poi installa il software in un clic ↓",
  "Search software": "Cerca software",
  "a smart alternative to {apps}": "un'alternativa intelligente a {apps}",
  "Staff picks": "Scelte dello staff",
  "Youʼll enjoy these": "Ti piaceranno",
  "Come get some": "Vieni a prenderne un po'",
  "All the stacks": "Tutti gli stack",

  /** Page /download */
  "Download Stack": "Scarica Stack",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "Dai al tuo desktop *superpoteri*.<br />Fallo eseguire qualsiasi software open source di qualità in un attimo.",
  "Download for {os}": "Scarica per {os}",
  "Requires {os} {version} or later": "Richiede {os} {version} o successivo",

  /** Page /<stack> */
  "About *{name}*": "Informazioni su *{name}*",
  "An alternative to": "Un'alternativa a",
  Related: "Correlati",

  /** API */
  "Start exploring stacks programmatically.":
    "Inizia a esplorare le stack in modo programmatico.",
  "We got you covered with every stacks and recipes, over API.":
    "Ti abbiamo coperto con tutte le stack e le ricette, tramite API.",
  "API specification": "Specifica dell’API",
  "API endpoints": "Endpoint dell’API",
  "Localized endpoints": "Endpoint localizzati",
} as const;
