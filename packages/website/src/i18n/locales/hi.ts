import type { I18n } from "~/i18n/locales";

export const hi: Partial<I18n> = {
  /** Generic */
  Download: "डाउनलोड",
  Recipes: "रेसिपी",
  Catalog: "कैटलॉग",
  Back: "वापस",
  "No description provided.": "कोई विवरण उपलब्ध नहीं है।",

  /** Page / */
  "The best of free software, accessible":
    "सबसे अच्छा फ्री सॉफ्टवेयर, एक्सेसिबल",
  "The *best free software* made&nbsp;*accessible*.":
    "सबसे *बेस्ट फ्री सॉफ्टवेयर* को *एक्सेसिबल* बनाया।",
  "Spin up local alternatives to": "स्थानीय विकल्पों को चालू करें",
  "and other": "और अन्य",
  "popular software": "लोकप्रिय सॉफ्टवेयर",
  "Remix your own.": "",
  "Available for macOS": "macOS के लिए उपलब्ध",
  "★ {starCount} cumulative stars": "★ {starCount} संचित तारे",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "{count}+ चयनित ओपन सोर्स सॉफ्टवेयर पैकेजों तक पहुंचें, जो एक क्लिक में इंस्टॉल करने के लिए तैयार हैं।",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "[लोकप्रिय एप्लिकेशनों]({url}) के लिए मुफ्त, सुरक्षित और गोपनीयता-केंद्रित विकल्प।",
  "Then install software in one-click ↓":
    "फिर सॉफ्टवेयर एक क्लिक में इंस्टॉल करें ↓",
  "Search software": "सॉफ्टवेयर खोजें",
  "a smart alternative to {apps}": "{apps} के लिए एक स्मार्ट विकल्प",

  /** Page /download */
  "Download Stack": "स्टैक डाउनलोड करें",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "अपने डेस्कटॉप को *सुपरपावर्स* दें।<br />इसे एक झटके में किसी भी ओपन सोर्स गुणवत्ता वाले सॉफ्टवेयर को चलाएं।",
  "Download for {os}": "{os} के लिए डाउनलोड करें",
  "Requires {os} {version} or later":
    "{os} {version} या उसके बाद की आवश्यकता है",

  /** Page /<stack> */
  "About *{name}*": "*{name}* के बारे में",
  "An alternative to": "का एक विकल्प",
  Related: "संबंधित",
} as const;
