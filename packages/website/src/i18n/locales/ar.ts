import type { I18n } from "~/i18n/locales";

export const ar: I18n = {
  /** Generic */
  Download: "تحميل",
  Back: "رجوع",

  /** Page / */
  "The best of free software, accessible": "أفضل البرمجيات المجانية، متاحة",
  "The *best free software* made&nbsp;*accessible*.":
    "أفضل *برمجيات مجانية* مصنوعة&nbsp;*متاحة*.",
  "Spin up local alternatives to": "بدء بدائل محلية لـ",
  "and other": "وغيرها",
  "popular software": "برمجيات شهيرة",
  "Remix your own.": "",
  "Available for macOS": "متاح لنظام التشغيل macOS",
  "Simply the best": "ببساطة الأفضل",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "الوصول إلى أكثر من {count} حزمة برمجيات مفتوحة المصدر مرتبة، جاهزة للتثبيت بنقرة واحدة.",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "بدائل مجانية وآمنة ومركزة على الخصوصية لـ [التطبيقات الشهيرة]({url}).",
  "Search software": "البحث عن برامج",
  "a smart alternative to {apps}": "بديل ذكي لـ {apps}",

  /** Page /alternativesto */
  "Alternatives to popular software": "بدائل لبرمجيات شهيرة",
  "The open source ecosystem is *awe-inspiring*.":
    "نظام البرمجيات مفتوحة المصدر *ملهم*.",
  "The community has created numerous high-quality, open source alternatives to popular software. Discover our curated list of amazing alternatives below.":
    "قامت المجتمع بإنشاء العديد من البدائل عالية الجودة ومفتوحة المصدر للبرمجيات الشهيرة. اكتشف قائمتنا المرتبة من البدائل المذهلة أدناه.",
  "Kinda *popular software* and their open counterparts":
    "نوعًا ما *برمجيات شهيرة* ونظرائها المفتوحة",
  "Recognize these *popular software*?": "هل تعرف هذه *البرمجيات الشهيرة*؟",
  "You'll love these *open source counterparts*":
    "ستحب هذه *البدائل مفتوحة المصدر*",
  "Browse *by category*": "تصفح *حسب الفئة*",

  /** Page /alternativesto/<app> */
  "Alternatives to {app}": "بدائل لـ {app}",
  "Sure, {logo} {name} is *awesome*.": "بالتأكيد، {logo} {name} *رائع*.",
  "But have you considered these open source alternatives?":
    "لكن هل فكرت في هذه البدائل مفتوحة المصدر؟",
  "They are free, self-hostable and community-driven.":
    "هي مجانية، يمكن استضافتها ذاتيًا وتدعمها المجتمع.",
  "Check by yourself: ": "تحقق بنفسك: ",
  "So is {logo} *[{name}]({url})*": "كذلك {logo} *[{name}]({url})*",
  "Read more about {name}": "اقرأ المزيد عن {name}",

  /** Page /download */
  "Download Stack Desktop": "تحميل Stack Desktop",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "منح سطح المكتب الخاص بك *قوى خارقة*.<br />جعله يشغل أي برمجية مفتوحة المصدر بجودة في لمح البصر.",
  "Download for {os}": "تحميل لـ {os}",
  "Requires {os} {version} or later": "يتطلب {os} {version} أو أحدث",

  /** Page /download/<os>} */
  "Downloading Stack for {os}…": "تحميل Stack لـ {os}…",
  "Once the download is complete": "بمجرد اكتمال التحميل",
  "Install the Stack app by double-clicking the downloaded file. Then drag it to your Applications folder.":
    "قم بتثبيت تطبيق Stack بالنقر المزدوج على الملف المحمل. ثم اسحبه إلى مجلد التطبيقات الخاص بك.",
  "Run the Stack app from your Applications folder.":
    "تشغيل تطبيق Stack من مجلد التطبيقات الخاص بك.",

  /** Page /<stack> */
  "Start it now": "ابدأ الآن",
  "Download the stack file": "تحميل ملف الكومة",
  "About *{name}*": "حول *{name}*",
  "Environment variables": "متغيرات البيئة",
  "No environment variables defined.": "لم يتم تعريف متغيرات بيئية.",
  "View environment variables": "عرض متغيرات البيئة",
  "An alternative to": "بديل لـ",
  Related: "ذات صلة",

  /** Page /<stack>.stack */
  "{name} {version} is starting…": "{name} {version} يبدأ…",
  "{name} {version} is live.": "{name} {version} مباشر.",
  "Access it in fullscreen": "الوصول إليه بشاشة كاملة",

  /** Page /recipes/<recipe> */
  "*Recipe*: {name}": "*وصفة*: {name}",
  "Recipe ingredients": "مكونات الوصفة",
  "Last update": "آخر تحديث",

  /** Component Debug */
  "Service is running…": "الخدمة قيد التشغيل…",
} as const;
