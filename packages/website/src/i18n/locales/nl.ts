import type { I18n } from "~/i18n/locales";

export const nl: Partial<I18n> = {
  /** Generic */
  Stack: "Stack",
  Stacks: "Stacks",
  Download: "Downloaden",
  Recipes: "Recepten",
  Catalog: "Catalogus",
  Back: "Terug",
  "No description provided.": "Geen beschrijving gegeven.",

  /** Page / */
  "The best of free software, accessible":
    "Het beste van gratis software, toegankelijk",
  "The *best free software* made&nbsp;*accessible*.":
    "De *beste gratis software* gemaakt&nbsp;*toegankelijk*.",
  "Spin up local alternatives to": "Lokale alternatieven voor",
  "and other": "en andere",
  "popular software": "populaire software",
  "Remix your own.": "",
  "Available for macOS": "Beschikbaar voor macOS",
  "★ {starCount} cumulative stars": "★ {starCount} cumulatieve sterren",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "Toegang tot {count}+ samengestelde open source softwarepakketten, klaar om met één klik te installeren.",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "Gratis, veilige en privacygerichte alternatieven voor [populaire apps]({url}).",
  "Then install software in one-click ↓":
    "Installeer vervolgens software in één klik ↓",
  "Search software": "Zoek software",
  "a smart alternative to {apps}": "een slim alternatief voor {apps}",
  "Staff picks": "Keuze van het personeel",
  "Youʼll enjoy these": "Je zult deze leuk vinden",
  "Come get some": "Kom er een paar halen",
  "All the stacks": "Alle stacks",

  /** Page /download */
  "Download Stack": "Download Stack",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "Geef je desktop *superkrachten*.<br />Laat het elk open source kwaliteitssoftware in een handomdraai uitvoeren.",
  "Download for {os}": "Downloaden voor {os}",
  "Requires {os} {version} or later": "Vereist {os} {version} of later",

  /** Page /<stack> */
  "About *{name}*": "Over *{name}*",
  "An alternative to": "Een alternatief voor",
  Related: "Gerelateerd",

  /** API */
  "Start exploring stacks programmatically.": "Stapel programatisch verkennen.",
  "We got you covered with every stacks and recipes, over API.":
    "We hebben je gedekt met elke stapel en recept, via API.",
  "API specification": "API-specificatie",
  "API endpoints": "API-eindpunten",
  "Localized endpoints": "Glocalizede eindpunten",
} as const;
