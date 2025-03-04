import type { I18n } from "~/i18n/locales";

export const ro: Partial<I18n> = {
  /** Generic */
  Download: "Descarca",
  Recipes: "Retete",
  Catalog: "Catalog",
  Back: "Inapoi",
  "No description provided.": "Nicio descriere furnizata.",

  /** Page / */
  "The best of free software, accessible":
    "Cel mai bun software gratuit, accesibil",
  "The *best free software* made&nbsp;*accessible*.":
    "Cel *mai bun software gratuit* facut&nbsp;*accesibil*.",
  "Spin up local alternatives to": "Creeaza alternative locale pentru",
  "and other": "si alte",
  "popular software": "software popular",
  "Remix your own.": "",
  "Available for macOS": "Disponibil pentru macOS",
  "★ {starCount} cumulative stars": "★ {starCount} stele cumulative",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "Acceseaza {count}+ pachete de software open source, gata de instalat cu un singur clic.",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "Alternative gratuite, sigure si concentrate pe confidentialitate pentru [aplicatii populare]({url}).",
  "Then install software in one-click ↓":
    "Apoi instaleaza software-ul cu un singur clic ↓",
  "Search software": "Cauta software",

  /** Page /download */
  "Download Stack": "Descarca Stack",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "Ofera-ti desktop-ului *superputeri*.<br />Fa-l sa ruleze orice software de calitate open source intr-o clipire.",
  "Download for {os}": "Descarca pentru {os}",
  "Requires {os} {version} or later": "Necesita {os} {version} sau mai recent",

  /** Page /<stack> */
  "About *{name}*": "Despre *{name}*",
  "An alternative to": "O alternativa pentru",
  Related: "Relatate",
} as const;
