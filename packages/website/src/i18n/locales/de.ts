import type { I18n } from "~/i18n/locales";

export const de: I18n = {
  /** Generic */
  Stack: "Stack",
  Stacks: "Stacks",
  Download: "Herunterladen",
  Recipes: "Rezepte",
  Catalog: "Katalog",
  Back: "Zurück",
  "No description provided.": "Keine Beschreibung vorhanden.",

  /** Page / */
  "The best of free software, accessible":
    "Das Beste an kostenloser Software, zugänglich",
  "The *best free software* made&nbsp;*accessible*.":
    "Die *beste kostenlose Software* zugänglich gemacht.",
  "Spin up local alternatives to": "Starten Sie lokale Alternativen zu",
  "and other": "und anderen",
  "popular software": "beliebten Software",
  "Remix your own.": "",
  "Available for macOS": "Verfügbar für macOS",
  "★ {starCount} cumulative stars": "★ {starCount} kumulierte Sterne",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "Zugriff auf {count}+ kuratierte Open-Source-Softwarepakete, bereit zur Installation mit einem Klick.",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "Kostenlose, sichere und datenschutzorientierte Alternativen zu [beliebten Apps]({url}).",
  "Then install software in one-click ↓":
    "Dann Software in einem Klick installieren ↓",
  "Search software": "Software suchen",
  "a smart alternative to {apps}": "eine intelligente alternative zu {apps}",

  /** Page /alternativesto */
  "Alternatives to popular software": "Alternativen zu beliebten Software",
  "The open source ecosystem is *awe-inspiring*.":
    "Das Open-Source-Ökosystem ist *beeindruckend*.",
  "The community has created numerous high-quality, open source alternatives to popular software. Discover our curated list of amazing alternatives below.":
    "Die Community hat zahlreiche hochwertige, Open-Source-Alternativen zu beliebten Software erstellt. Entdecken Sie unsere kuratierte Liste erstaunlicher Alternativen unten.",
  "Kinda *popular software* and their open counterparts":
    "Irgendwie *beliebte Software* und ihre offenen Gegenst ücke",
  "Recognize these *popular software*?":
    "Erkennen Sie diese *beliebte Software*?",
  "You'll love their *open source counterparts*":
    "Sie werden ihre *Open-Source-Gegenstücke* lieben",
  "Browse *by category*": "Durchsuchen *nach Kategorie*",

  /** Page /alternativesto/<app> */
  "Alternatives to {app}": "Alternativen zu {app}",
  "Sure, {logo} {name} is *awesome*.": "Sicher, {logo} {name} ist *genial*.",
  "But have you considered these open source alternatives?":
    "Aber haben Sie diese Open-Source-Alternativen in Betracht gezogen?",
  "They are free, self-hostable and community-driven.":
    "Sie sind kostenlos, selbst gehostet und von der Community getrieben.",
  "Check by yourself: ": "Überprüfen Sie selbst: ",
  "So is {logo} *[{name}]({url})*": "{logo} *[{name}]({url})* auch",
  "Read more about {name}": "Mehr über {name} erfahren",

  /** Page /download */
  "Download Stack": "Stack herunterladen",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "Geben Sie Ihrem Desktop *Superkräfte*.<br />Lassen Sie ihn sofort jede Open-Source-Qualitätssoftware ausführen.",
  "Download for {os}": "Herunterladen für {os}",
  "Requires {os} {version} or later": "Erfordert {os} {version} oder höher",

  /** Page /download/<os>} */
  "Downloading Stack for {os}…": "Stack für {os} herunterladen…",
  "Once the download is complete": "Sobald der Download abgeschlossen ist",
  "Install the Stack app by double-clicking the downloaded file. Then drag it to your Applications folder.":
    "Installieren Sie die Stack-App, indem Sie die heruntergeladene Datei doppelklicken. Ziehen Sie es dann in Ihren Anwendungen-Ordner.",
  "Run the Stack app from your Applications folder.":
    "Führen Sie die Stack-App aus Ihrem Anwendungen-Ordner aus.",

  /** Page /<stack> */
  "Start it now": "Jetzt starten",
  "Download the stack file": "Die stack herunterladen",
  "About *{name}*": "Über *{name}*",
  "Environment variables": "Umgebungsvariablen",
  "No environment variables defined.": "Keine Umgebungsvariablen definiert.",
  "View environment variables": "Umgebungsvariablen anzeigen",
  "An alternative to": "Eine Alternative zu",
  Related: "Ähnliche",

  /** Page /<stack>.stack */
  "{name} {version} is starting…": "{name} {version} wird gestartet…",
  "{name} {version} is live.": "{name} {version} ist live.",
  "Access it in fullscreen": "Greifen Sie darauf im Vollbildmodus zu",
  "Execution logs": "Ausführungsprotokolle",

  /** Page /recipes */
  Recipe: "Rezept",
  "*Curated Recipes* of powerful stack combinations.":
    "*Kuratierte Rezepte* von leistungsstarken Stack-Kombinationen.",
  "Recipes are curated stack combinations. Each recipe is a collection of stacks that work well together.":
    "Rezepte sind kuratierte Stack-Kombinationen. Jedes Rezept ist eine Sammlung von Stacks, die gut zusammenarbeiten.",

  /** Page /recipes/<recipe> */
  "*Recipe*: {name}": "*Rezept*: {name}",
  "Recipe ingredients": "Rezeptzutaten",
  "Last update": "Letztes Update",
  "Related recipes": "Ähnliche Rezepte",

  /** Component Debug */
  "Service is running…": "Dienst wird ausgeführt…",
} as const;
