import type { I18n } from "~/i18n/locales";

export const fr: I18n = {
  /** Generic */
  Stack: "Stack",
  Stacks: "Stacks",
  Download: "Télécharger",
  Recipes: "Recettes",
  Catalog: "Catalogue",
  Back: "Retour",
  "No description provided.": "Aucune description fournie.",

  /** Page / */
  "The best of free software, accessible":
    "Le meilleur du logiciel libre, accessible",
  "The *best free software* made&nbsp;*accessible*.":
    "Le *meilleur du logiciel libre*, *accessible*&nbsp;de&nbsp;tous.",
  "Spin up local alternatives to": "Démarrer des alternatives locales à",
  "and other": "et autres",
  "popular software": "logiciels populaires",
  "Remix your own.": "",
  "Available for macOS, Windows and Linux":
    "Disponible pour macOS, Windows et Linux",
  "Available for macOS": "Disponible sur macOS",
  "★ {starCount} cumulative stars": "★ {starCount} étoiles cumulées",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "Accédez à une sélection de plus de {count} solutions open source prêtes à installer en 1 clic.",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "Des alternatives aux [logiciels populaires]({url}). Qualitatives, gratuites, sécurisées et respectueuses de la vie privée.",
  "Search software": "Rechercher des logiciels",
  "a smart alternative to {apps}": "une alternative à {apps}",
  "Staff picks": "Sélection de lʼéquipe",
  "Youʼll enjoy these": "Vous allez adorer",
  "Come get some": "Venez découvrir",
  "All the stacks": "Toutes les stacks",

  /** Page /alternativesto */
  "Alternatives to popular software": "Alternatives à des logiciels populaires",
  "The open source ecosystem is *awe-inspiring*.":
    "L'écosystème open source est *impressionnant*.",
  "The community has created numerous high-quality, open source alternatives to popular software. Discover our curated list of amazing alternatives below.":
    "La communauté a créé de nombreuses alternatives open source de qualité à des logiciels populaires. Découvrez notre liste d'alternatives incroyables ci-dessous.",
  "Kinda *popular software* and their open counterparts":
    "Des *logiciels populaires* et leurs alternatives open source",
  "Recognize these *popular software*?":
    "Reconnaissez-vous ces *logiciels populaires* ?",
  "You'll love their *open source counterparts*":
    "Vous allez adorer leurs *alternatives open source*",
  "Browse *by category*": "Parcourir *par catégorie*",

  /** Page /alternativesto/<app> */
  "Alternatives to {app}": "Alternatives à {app}",
  "Sure, {logo} {name} is *awesome*.":
    "{logo} {name} est particulièrement *génial*.",
  "But have you considered these open source alternatives?":
    "Mais avez-vous envisagé ces alternatives open source&nbsp;?",
  "They are free, self-hostable and community-driven.":
    "Elles sont gratuites, auto-hébergeables et communautaires.",
  "Check by yourself: ": "Vérifiez par vous-même : ",
  "So is {logo} *[{name}]({url})*": "{logo} *[{name}]({url})* aussi",
  "Read more about {name}": "Plus d'infos sur {name}",

  /** Page /download */
  "Download Stack": "Télécharger Stack",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "Donnez à votre ordinateur *des superpouvoirs*.<br />Faites-lui démarrer de nombreux logiciels open source de qualité en un clin d'œil.",
  "Download for {os}": "Télécharger pour {os}",
  "Requires {os} {version} or later": "Requiert {os} {version} ou ultérieur",
  "Requires a 64-bit Linux distribution with WebKitGTK 4.1":
    "Requiert une distribution Linux 64 bits avec WebKitGTK 4.1",

  /** Page /download/<os>} */
  "Downloading Stack for {os}…": "Téléchargement de Stack pour {os}…",
  "Once the download is complete": "Une fois le téléchargement terminé",
  "Install the Stack app by double-clicking the downloaded file. Then drag it to your Applications folder.":
    "Installez l'application Stack en double-cliquant sur le fichier téléchargé. Ensuite, faites-le glisser dans votre dossier Applications.",
  "Run the Stack app from your Applications folder.":
    "Exécutez l'application Stack depuis votre dossier Applications.",
  "Run the downloaded installer and follow the on-screen instructions.":
    "Lancez l'installateur téléchargé et suivez les instructions à l'écran.",
  "Launch Stack from the Start menu.":
    "Démarrez Stack depuis le menu Démarrer.",
  "Install the downloaded package with your package manager, or make the AppImage executable (`chmod +x`) and run it.":
    "Installez le paquet téléchargé avec votre gestionnaire de paquets, ou rendez l'AppImage exécutable (`chmod +x`) et lancez-la.",
  "Launch Stack from your applications menu.":
    "Démarrez Stack depuis votre menu d'applications.",
  "Other downloads for {os}": "Autres téléchargements pour {os}",
  "All downloads and release notes on GitHub":
    "Tous les téléchargements et notes de version sur GitHub",

  /** Page /<stack> */
  "Start it now": "Démarrer",
  "Download the stack file": "Télécharger le fichier stack",
  "Runs locally, in one click.": "S'exécute en local, en un clic.",
  "Ready to run *{name}*?": "Prêt à lancer *{name}*&nbsp;?",
  Version: "Version",
  Stars: "Étoiles",
  License: "Licence",
  Author: "Auteur",
  Links: "Liens",
  Homepage: "Site web",
  "Source code": "Code source",
  "About *{name}*": "À propos de *{name}*",
  "Environment variables": "Variables d'environnement",
  "{count} variables you can tune before starting.":
    "{count} variables que vous pouvez ajuster avant le démarrage.",
  "No environment variables defined.":
    "Aucune variable d'environnement définie.",
  "View environment variables": "Voir les variables d'environnement",
  "An alternative to": "Une alternative à",
  Related: "Alternatives",

  /** Page /<stack>.stack */
  "{name} {version} is starting…": "{name} {version} démarre…",
  "{name} {version} is live.": "{name} {version} est démarré.",
  "Access it in fullscreen": "Accéder en plein écran",
  "Execution logs": "Journaux",

  /** Page /recipes */
  Recipe: "Recette",
  "*Curated Recipes* of powerful stack combinations.":
    "*Compositions de stacks* prêtes à déguster.",
  "Recipes are curated stack combinations. Each recipe is a collection of stacks that work well together.":
    "Les recettes sont des combinaisons de stacks prêtes à l'emploi. Chaque recette est une collection de stacks qui fonctionnent bien ensemble.",

  /** Page /recipes/<recipe> */
  "*Recipe*: {name}": "*Recette*&nbsp;: {name}",
  "Recipe ingredients": "Ingrédients de la recette",
  "{count} services, wired together and started as one.":
    "{count} services, reliés entre eux et démarrés d'un seul coup.",
  "Last update": "Dernière mise à jour",
  "Related recipes": "Recettes similaires",

  /** Component Debug */
  "Service is running…": "Service en cours d'exécution…",

  /** API */
  "Start exploring stacks programmatically.":
    "Explorez les stacks de manière programmatique.",
  "We got you covered with every stacks and recipes, over API.":
    "Tout est couvert avec chaque stack et recette, via API.",
  "API specification": "Spécification de l’API",
  "API endpoints": "Points de terminaison de l’API",
  "Localized endpoints": "Points de terminaison localisés",
} as const;
