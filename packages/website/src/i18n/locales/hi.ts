import type { I18n } from "~/i18n/locales";

export const hi: Partial<I18n> = {
  /** Generic */
  Download: "डाउनलोड",

  /** Page / */
  "The *best free software* made&nbsp;*accessible*.":
    "सबसे *बेस्ट फ्री सॉफ्टवेयर* को *एक्सेसिबल* बनाया।",
  "Spin up local alternatives to": "स्थानीय विकल्पों को चालू करें",
  "and other": "और अन्य",
  "popular software": "लोकप्रिय सॉफ्टवेयर",
  "Remix your own.": "",
  "Available for macOS": "macOS के लिए उपलब्ध",
  "Simply the best": "बस सबसे अच्छा",
  "Search software": "सॉफ्टवेयर खोजें",

  /** Page /<stack> */
  "About *{name}*": "*{name}* के बारे में",
  "An alternative to": "का एक विकल्प",
  Related: "संबंधित",
} as const;
