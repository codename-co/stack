import type { I18n } from "~/i18n/locales";

export const fr: I18n = {
  /** Generic */
  Download: "Télécharger",
  Back: "Retour",

  /** Page / */
  "The best of free software, accessible":
    "Le meilleur du logiciel libre, accessible",
  "The *best free software* made&nbsp;*accessible*.":
    "Le *meilleur du logiciel libre*, *accessible*&nbsp;de&nbsp;tous.",
  "Spin up local alternatives to": "Démarrer des alternatives locales à",
  "and other": "et autres",
  "popular software": "logiciels populaires",
  "Remix your own.": "",
  "Available for macOS": "Disponible sur macOS",
  "Simply the best": "Le meilleur, tout simplement",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "Accédez à une sélection de plus de {count} solutions open source prêtes à l'installation en un clic.",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "Des alternatives aux [logiciels populaires]({url}) gratuites, sécurisées et respectueuses de la vie privée.",
  "Search software": "Rechercher des logiciels",
  "a smart alternative to {apps}": "une alternative à {apps}",

  /** Page /alternativesto */
  "Alternatives to popular software": "Alternatives à des logiciels populaires",
  "The open source ecosystem is *awe-inspiring*.":
    "L'écosystème open source est *impressionnant*.",
  "The community has created numerous high-quality, open source alternatives to popular software. Discover our curated list of amazing alternatives below.":
    "La communauté a créé de nombreuses alternatives open source de qualité à des logiciels populaires. Découvrez notre liste d'alternatives incroyables ci-dessous.",
  "Kinda *popular software* and their open counterparts":
    "Des *logiciels populaires* et leurs alternatives open source",
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
  "Download Stack Desktop": "Télécharger Stack Desktop",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "Donnez à votre ordinateur *des superpouvoirs*.<br />Faites-lui démarrer de nombreux logiciels open source de qualité en un clin d'œil.",
  "Download for {os}": "Télécharger pour {os}",
  "Requires {os} {version} or later": "Requiert {os} {version} ou ultérieur",

  /** Page /download/<os>} */
  "Downloading Stack for {os}…": "Téléchargement de Stack pour {os}…",
  "Once the download is complete": "Une fois le téléchargement terminé",
  "Install the Stack app by double-clicking the downloaded file. Then drag it to your Applications folder.":
    "Installez l'application Stack en double-cliquant sur le fichier téléchargé. Ensuite, faites-le glisser dans votre dossier Applications.",
  "Run the Stack app from your Applications folder.":
    "Exécutez l'application Stack depuis votre dossier Applications.",

  /** Page /<stack> */
  "Start it now": "Démarrer",
  "Download the stack file": "Télécharger le fichier stack",
  "About *{name}*": "À propos de *{name}*",
  "Environment variables": "Variables d'environnement",
  "No environment variables defined.":
    "Aucune variable d'environnement définie.",
  "View environment variables": "Voir les variables d'environnement",
  "An alternative to": "Une alternative à",
  Related: "Autres alternatives",

  /** Page /<stack>.stack */
  "{name} {version} is starting…": "{name} {version} démarre…",
  "{name} {version} is live.": "{name} {version} est démarré.",
  "Access it in fullscreen": "Accéder en plein écran",

  /** Component Debug */
  "Service is running…": "Service en cours d'exécution…",
} as const;
