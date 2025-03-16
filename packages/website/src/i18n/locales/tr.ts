import type { I18n } from "~/i18n/locales";

export const tr: Partial<I18n> = {
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
    "Ücretsiz yazılımın en iyisi, erişilebilir",
  "The *best free software* made&nbsp;*accessible*.":
    "En *iyi ücretsiz yazılımı* *erişilebilir* hale getirin.",
  "Spin up local alternatives to": "Yerel alternatifler oluşturun",
  "and other": "ve diğerleri",
  "popular software": "popüler yazılım",
  "Remix your own.": "",
  "Available for macOS": "macOS için kullanılabilir",
  "★ {starCount} cumulative stars": "★ {starCount} birikmiş yıldız",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "{count}+ hazırlanmış açık kaynak yazılım paketlerine erişin, tek tıklamayla yüklemeye hazır.",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "[popüler uygulamalar]({url}) için ücretsiz, güvenli ve gizlilik odaklı alternatifler.",
  "Then install software in one-click ↓":
    "Sonra yazılımı tek tıklamayla yükleyin ↓",
  "Search software": "Yazılım ara",
  "Staff picks": "Personel seçimleri",
  "Youʼll enjoy these": "Bunlardan keyif alacaksınız",
  "Come get some": "Gel ve al",
  "All the stacks": "Tüm yığınlar",

  /** Page /download */
  "Download Stack": "Yığını İndir",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "Masaüstünüze *süper güçler* verin.<br />Herhangi bir açık kaynak kaliteli yazılımı hızla çalıştırın.",
  "Download for {os}": "{os} için indir",
  "Requires {os} {version} or later": "{os} {version} veya sonrası gerektirir",

  /** Page /<stack> */
  "About *{name}*": "*{name}* hakkında",
  "An alternative to": "Bir alternatif",
  Related: "İlgili",
} as const;
