import type { I18n } from "~/i18n/locales";

export const ja: Partial<I18n> = {
  /** Generic */
  Download: "ダウンロード",

  /** Page / */
  "The *best free software* made&nbsp;*accessible*.":
    "最高の無料ソフトウェアを*アクセス可能に*。",
  "Spin up local alternatives to": "ローカルの代替を開始",
  "and other": "その他",
  "popular software": "人気のあるソフトウェア",
  "Remix your own.": "",
  "Available for macOS": "macOS用",
  "Simply the best": "単に最高",
  "Search software": "ソフトウェアを検索",

  /** Page /<stack> */
  "About *{name}*": "*{name}* について",
  "An alternative to": "代替",
  Related: "関連",
} as const;
