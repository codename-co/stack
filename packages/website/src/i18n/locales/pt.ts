import type { I18n } from "~/i18n/locales";

export const pt: Partial<I18n> = {
  /** Generic */
  Download: "Baixar",
  Recipes: "Receitas",
  Search: "Pesquisar",
  Back: "Voltar",
  "No description provided.": "Nenhuma descrição fornecida.",

  /** Page / */
  "The *best free software* made&nbsp;*accessible*.":
    "O *melhor software livre* tornou-se&nbsp;*acessível*.",
  "Spin up local alternatives to": "Inicie alternativas locais para",
  "and other": "e outros",
  "popular software": "software popular",
  "Remix your own.": "",
  "Available for macOS": "Disponível para macOS",
  "★ {starCount} cumulative stars": "★ {starCount} estrelas acumuladas",
  "Then install software in one-click ↓":
    "Em seguida, instale o software em um clique ↓",
  "Search software": "Pesquisar software",

  /** Page /<stack> */
  "About *{name}*": "Sobre *{name}*",
  "An alternative to": "Uma alternativa para",
  Related: "Relacionados",
} as const;
