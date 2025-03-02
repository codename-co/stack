import type { I18n } from "~/i18n/locales";

export const tr: Partial<I18n> = {
  /** Generic */
  Download: "Scarica",
  Recipes: "Ricette",
  Search: "Cerca",
  Back: "Indietro",
  "No description provided.": "Nessuna descrizione fornita.",

  /** Page / */
  "The *best free software* made&nbsp;*accessible*.":
    "En *iyi ücretsiz yazılımı* *erişilebilir* hale getirin.",
  "Spin up local alternatives to": "Yerel alternatifler oluşturun",
  "and other": "ve diğerleri",
  "popular software": "popüler yazılım",
  "Remix your own.": "",
  "Available for macOS": "macOS için kullanılabilir",
  "★ {starCount} cumulative stars": "★ {starCount} birikmiş yıldız",
  "Then install software in one-click ↓":
    "Sonra yazılımı tek tıklamayla yükleyin ↓",
  "Search software": "Yazılım ara",

  /** Page /<stack> */
  "About *{name}*": "*{name}* hakkında",
  "An alternative to": "Bir alternatif",
  Related: "İlgili",
} as const;
