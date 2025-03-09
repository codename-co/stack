import type { I18n } from "~/i18n/locales";

export const uk: I18n = {
  /** Generic */
  Download: "Завантажити",
  Recipes: "Рецепти",
  Catalog: "Каталог",
  Back: "Назад",
  "No description provided.": "Опис відсутній.",

  /** Page / */
  "The best of free software, accessible":
    "Найкраще безкоштовне програмне забезпечення, доступне",
  "The *best free software* made&nbsp;*accessible*.":
    "Найкраще *безкоштовне програмне забезпечення* зроблено&nbsp;*доступним*.",
  "Spin up local alternatives to": "Запустіть локальні альтернативи для",
  "and other": "і інші",
  "popular software": "популярне програмне забезпечення",
  "Remix your own.": "",
  "Available for macOS": "Доступно для macOS",
  "★ {starCount} cumulative stars": "★ {starCount} кумулятивні зірки",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "Отримайте доступ до {count}+ відібраних пакетів програмного забезпечення з відкритим вихідним кодом, готових до встановлення одним кліком.",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "Безкоштовні, безпечні та спрямовані на конфіденційність альтернативи для [популярних додатків]({url}).",
  "Then install software in one-click ↓":
    "Потім встановіть програмне забезпечення в один клік ↓",
  "Search software": "Пошук програмного забезпечення",
  "a smart alternative to {apps}": "розумна альтернатива для {apps}",

  /** Page /alternativesto */
  "Alternatives to popular software":
    "Альтернативи популярному програмному забезпеченню",
  "The open source ecosystem is *awe-inspiring*.":
    "Екосистема відкритого вихідного коду *вражає*.",
  "The community has created numerous high-quality, open source alternatives to popular software. Discover our curated list of amazing alternatives below.":
    "Спільнота створила численні високоякісні альтернативи з відкритим вихідним кодом для популярного програмного забезпечення. Відкрийте нашу відібрану ​​список неймовірних альтернатив нижче.",
  "Kinda *popular software* and their open counterparts":
    "Дещо *популярне програмне забезпечення* та їх відкриті аналоги",
  "Recognize these *popular software*?":
    "Впізнаєте це *популярне програмне забезпечення*?",
  "You'll love their *open source counterparts*":
    "Вам сподобаються їх *відкриті аналоги*",
  "Browse *by category*": "Перегляд *за категорією*",

  /** Page /alternativesto/<app> */
  "Alternatives to {app}": "Альтернативи для {app}",
  "Sure, {logo} {name} is *awesome*.": "Звичайно, {logo} {name} *чудовий*.",
  "But have you considered these open source alternatives?":
    "Але ви розглянули ці альтернативи з відкритим вихідним кодом?",
  "They are free, self-hostable and community-driven.":
    "Вони безкоштовні, можна самостійно розмістити та розвиваються спільнотою.",
  "Check by yourself: ": "Перевірте самостійно: ",
  "So is {logo} *[{name}]({url})*": "Також {logo} *[{name}]({url})*",
  "Read more about {name}": "Дізнайтеся більше про {name}",

  /** Page /download */
  "Download Stack": "Завантажити Stack",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "Надайте своєму робочому столу *суперсилу*.<br />Запустіть будь-яке програмне забезпечення високої якості з відкритим вихідним кодом митт єво.",
  "Download for {os}": "Завантажити для {os}",
  "Requires {os} {version} or later": "Вимагає {os} {version} або пізніше",

  /** Page /download/<os>} */
  "Downloading Stack for {os}…": "Завантаження Stack для {os}…",
  "Once the download is complete": "Після завершення завантаження",
  "Install the Stack app by double-clicking the downloaded file. Then drag it to your Applications folder.":
    "Встановіть додаток Stack, двічі клацнувши завантажений файл. Потім перетягніть його в папку Applications.",
  "Run the Stack app from your Applications folder.":
    "Запустіть додаток Stack з папки Applications.",

  /** Page /<stack> */
  "Start it now": "Запустіть його зараз",
  "Download the stack file": "Завантажити файл стеку",
  "About *{name}*": "Про *{name}*",
  "Environment variables": "Змінні середовища",
  "No environment variables defined.": "Змінні середовища не визначені.",
  "View environment variables": "Переглянути змінні середовища",
  "An alternative to": "Альтернатива для",
  Related: "Пов'язані",

  /** Page /<stack>.stack */
  "{name} {version} is starting…": "{name} {version} запускається…",
  "{name} {version} is live.": "{name} {version} працює.",
  "Access it in fullscreen": "Отримати доступ у повноекранному режимі",

  /** Page /recipes */
  Recipe: "Рецепт",
  "*Curated Recipes* of powerful stack combinations.":
    "*Відібрані рецепти* потужних комбінацій стеку.",
  "Recipes are curated stack combinations. Each recipe is a collection of stacks that work well together.":
    "Рецепти - це відібрані комбінації стеків. Кожен рецепт - це колекція стеків, які добре працюють разом.",

  /** Page /recipes/<recipe> */
  "*Recipe*: {name}": "*Рецепт*: {name}",
  "Recipe ingredients": "Інгредієнти рецепту",
  "Last update": "Останнє оновлення",
  "Related recipes": "Пов'язані рецепти",

  /** Component Debug */
  "Service is running…": "Сервіс працює…",
} as const;
