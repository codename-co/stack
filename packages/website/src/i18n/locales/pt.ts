import type { I18n } from "~/i18n/locales";

export const pt: Partial<I18n> = {
  /** Generic */
  Stack: "Stack",
  Stacks: "Stacks",
  Download: "Baixar",
  Recipes: "Receitas",
  Catalog: "Catálogo",
  Back: "Voltar",
  "No description provided.": "Nenhuma descrição fornecida.",

  /** Page / */
  "The best of free software, accessible":
    "O melhor do software livre, acessível",
  "The *best free software* made&nbsp;*accessible*.":
    "O *melhor software livre* tornou-se&nbsp;*acessível*.",
  "Spin up local alternatives to": "Inicie alternativas locais para",
  "and other": "e outros",
  "popular software": "software popular",
  "Remix your own.": "",
  "Available for macOS": "Disponível para macOS",
  "★ {starCount} cumulative stars": "★ {starCount} estrelas acumuladas",
  "Access {count}+ curated open source software packages, ready to install with one click.":
    "Acesse {count}+ pacotes de software de código aberto curados, prontos para instalar com um clique.",
  "Free, secure, and privacy-focused alternatives to [popular apps]({url}).":
    "Alternativas gratuitas, seguras e focadas em privacidade para [aplicativos populares]({url}).",
  "Then install software in one-click ↓":
    "Em seguida, instale o software em um clique ↓",
  "Search software": "Pesquisar software",

  /** Page /download */
  "Download Stack": "Baixar Stack",
  "Give your desktop *superpowers*.<br />Make it run any open source quality software in a snap.":
    "Dê ao seu desktop *superpoderes*.<br />Faça-o executar qualquer software de qualidade de código aberto em um instante.",
  "Download for {os}": "Baixar para {os}",
  "Requires {os} {version} or later": "Requer {os} {version} ou posterior",

  /** Page /<stack> */
  "About *{name}*": "Sobre *{name}*",
  "An alternative to": "Uma alternativa para",
  Related: "Relacionados",
} as const;
