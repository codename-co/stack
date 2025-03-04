import type { I18n } from "~/i18n/locales";

export const ru: Partial<I18n> = {
  /** Generic */
  Download: "Скачать",
  Recipes: "Рецепты",
  Catalog: "Каталог",
  Back: "Назад",
  "No description provided.": "Описание отсутствует.",

  /** Page / */
  "The best of free software, accessible":
    "Лучшее бесплатное программное обеспечение, доступное",
  "The *best free software* made&nbsp;*accessible*.":
    "Лучшие *бесплатные программы* сделаны&nbsp;*доступными*.",
  "Spin up local alternatives to": "Запустите локальные альтернативы для",
  "and other": "и другие",
  "popular software": "популярные программы",
  "Remix your own.": "",
  "Available for macOS": "Доступно для macOS",
  "★ {starCount} cumulative stars": "★ {starCount} накопленных звёзд",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "Доступ к {count}+ отобранным пакетам программ с открытым исходным кодом, готовым к установке в один клик.",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "Бесплатные, безопасные и ориентированные на конфиденциальность альтернативы для [популярных приложений]({url}).",
  "Then install software in one-click ↓":
    "Затем установите программу в один клик ↓",
  "Search software": "Поиск программ",

  /** Page /download */
  "Download Stack": "Скачать Stack",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "Придайте вашему рабочему столу *суперсилу*.<br />Запустите любое качественное программное обеспечение с открытым исходным кодом мгновенно.",
  "Download for {os}": "Скачать для {os}",
  "Requires {os} {version} or later":
    "Требуется {os} {version} или более поздняя",

  /** Page /<stack> */
  "About *{name}*": "О *{name}*",
  "An alternative to": "Альтернатива для",
  Related: "Связанные",
} as const;
