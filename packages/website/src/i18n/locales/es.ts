import type { I18n } from "~/i18n/locales";

export const es: I18n = {
  /** Generic */
  Stack: "Stack",
  Stacks: "Stacks",
  Download: "Descargar",
  Recipes: "Recetas",
  Catalog: "Catálogo",
  Back: "Volver",
  "No description provided.": "No se ha proporcionado descripción.",

  /** Page / */
  "The best of free software, accessible":
    "Lo mejor del software libre, accesible",
  "The *best free software* made&nbsp;*accessible*.":
    "El *mejor software libre* hecho&nbsp;*accesible*.",
  "Spin up local alternatives to": "Inicie alternativas locales a",
  "and other": "y otros",
  "popular software": "software popular",
  "Remix your own.": "",
  "Available for macOS": "Disponible para macOS",
  "Available for macOS, Windows and Linux":
    "Disponible para macOS, Windows y Linux",
  "Requires a 64-bit Linux distribution with WebKitGTK 4.1":
    "Requiere una distribución Linux de 64 bits con WebKitGTK 4.1",
  "Run the downloaded installer and follow the on-screen instructions.":
    "Ejecute el instalador descargado y siga las instrucciones en pantalla.",
  "Launch Stack from the Start menu.": "Inicie Stack desde el menú Inicio.",
  "Install the downloaded package with your package manager, or make the AppImage executable (`chmod +x`) and run it.":
    "Instale el paquete descargado con su gestor de paquetes, o haga que la AppImage sea ejecutable (`chmod +x`) y ejecútela.",
  "Launch Stack from your applications menu.":
    "Inicie Stack desde su menú de aplicaciones.",
  "Other downloads for {os}": "Otras descargas para {os}",
  "All downloads and release notes on GitHub":
    "Todas las descargas y notas de versión en GitHub",
  "★ {starCount} cumulative stars": "★ {starCount} estrellas acumuladas",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "Acceda a {count}+ paquetes de software de código abierto seleccionados, listos para instalar con un solo clic.",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "Alternativas gratuitas, seguras y centradas en la privacidad a [aplicaciones populares]({url}).",
  "Search software": "Buscar software",
  "a smart alternative to {apps}": "una alternativa a {apps}",
  "Staff picks": "Selección del personal",
  "Youʼll enjoy these": "Disfrutarás de estos",
  "Come get some": "Ven a por ellos",
  "All the stacks": "Todos los stacks",

  /** Page /alternativesto */
  "Alternatives to popular software": "Alternativas al software popular",
  "The open source ecosystem is *awe-inspiring*.":
    "El ecosistema de código abierto es *asombroso*.",
  "The community has created numerous high-quality, open source alternatives to popular software. Discover our curated list of amazing alternatives below.":
    "La comunidad ha creado numerosas alternativas de código abierto de alta calidad al software popular. Descubra nuestra lista curada de increíbles alternativas a continuación.",
  "Kinda *popular software* and their open counterparts":
    "Algo de *software popular* y sus contrapartes abiertas",
  "Recognize these *popular software*?": "¿Reconoces este *software popular*?",
  "You'll love their *open source counterparts*":
    "Te encantarán sus *contrapartes de código abierto*",
  "Browse *by category*": "Navegar *por categoría*",

  /** Page /alternativesto/<app> */
  "Alternatives to {app}": "Alternativas a {app}",
  "Sure, {logo} {name} is *awesome*.": "Claro, {logo} {name} es *increíble*.",
  "But have you considered these open source alternatives?":
    "Pero ¿has considerado estas alternativas de código abierto?",
  "They are free, self-hostable and community-driven.":
    "Son gratuitas, autohospedables y dirigidas por la comunidad.",
  "Check by yourself: ": "Compruébalo por ti mismo: ",
  "So is {logo} *[{name}]({url})*": "Así es {logo} *[{name}]({url})*",
  "Read more about {name}": "Leer más sobre {name}",

  /** Page /download */
  "Download Stack": "Descargar Stack",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "Dale a tu escritorio *superpoderes*.<br />Haz que ejecute cualquier software de calidad de código abierto en un instante.",
  "Download for {os}": "Descargar para {os}",
  "Requires {os} {version} or later": "Requiere {os} {version} o posterior",

  /** Page /download/<os>} */
  "Downloading Stack for {os}…": "Descargando Stack para {os}…",
  "Once the download is complete": "Una vez que la descarga esté completa",
  "Install the Stack app by double-clicking the downloaded file. Then drag it to your Applications folder.":
    "Instale la aplicación Stack haciendo doble clic en el archivo descargado. Luego arrástrelo a su carpeta de Aplicaciones.",
  "Run the Stack app from your Applications folder.":
    "Ejecute la aplicación Stack desde su carpeta de Aplicaciones.",

  /** Page /<stack> */
  "Start it now": "Iniciar ahora",
  "Download the stack file": "Descargar el archivo de la pila",
  "Runs locally, in one click.": "Se ejecuta localmente, en un clic.",
  "Ready to run *{name}*?": "¿Listo para ejecutar *{name}*?",
  Version: "Versión",
  Stars: "Estrellas",
  License: "Licencia",
  Author: "Autor",
  Links: "Enlaces",
  Homepage: "Sitio web",
  "Source code": "Código fuente",
  "About *{name}*": "Acerca de *{name}*",
  "Environment variables": "Variables de entorno",
  "{count} variables you can tune before starting.":
    "{count} variables que puedes ajustar antes de iniciar.",
  "No environment variables defined.":
    "No se han definido variables de entorno.",
  "View environment variables": "Ver variables de entorno",
  "An alternative to": "Una alternativa a",
  Related: "Relacionados",

  /** Page /<stack>.stack */
  "{name} {version} is starting…": "{name} {version} está iniciando…",
  "{name} {version} is live.": "{name} {version} está en vivo.",
  "Access it in fullscreen": "Acceder a pantalla completa",
  "Execution logs": "Registros de ejecución",

  /** Page /recipes */
  Recipe: "Receta",
  "*Curated Recipes* of powerful stack combinations.":
    "*Recetas seleccionadas* de potentes combinaciones de pilas.",
  "Recipes are curated stack combinations. Each recipe is a collection of stacks that work well together.":
    "Las recetas son combinaciones de pilas seleccionadas. Cada receta es una colección de pilas que funcionan bien juntas.",

  /** Page /recipes/<recipe> */
  "*Recipe*: {name}": "*Receta*: {name}",
  "Recipe ingredients": "Ingredientes de la receta",
  "{count} services, wired together and started as one.":
    "{count} servicios, conectados entre sí y arrancados como uno solo.",
  "Last update": "Última actualización",
  "Related recipes": "Recetas relacionadas",

  /** Component Debug */
  "Service is running…": "El servicio está en ejecución…",

  /** API */
  "Start exploring stacks programmatically.":
    "Comienza a explorar pilas programáticamente.",
  "We got you covered with every stacks and recipes, over API.":
    "Te tenemos cubierto con todas las pilas y recetas, a través de la API.",
  "API specification": "Especificación de la API",
  "API endpoints": "Puntos de terminación de la API",
  "Localized endpoints": "Puntos de terminación localizados",
} as const;
