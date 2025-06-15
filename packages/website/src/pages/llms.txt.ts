import type { APIRoute } from "astro";
import { getStacks } from "~/content/collections/stacks";

const getContent = (stacks = getStacks("en")) => /* Markdown */ `# Stack

> Stack is a collection of ${stacks.length} curated open source software that can be installed with a single click. It is designed to make it easy for users to discover, install, and manage quality free software.

- Our mission: make exceptional software accessible to all.
- Stack transforms the often complex process of discovering, installing, and managing quality free software into a delightful experience. With our carefully curated collection and one-click installation, we're eliminating barriers between people and the tools they need.
- Stack desktop app is a powerful tool that allows users to easily install and manage applications from our curated collection. It provides a simple and intuitive interface for discovering new software, installing it with a single click, and keeping it up to date.
- Stack is a community-driven project that relies on contributions from developers and users to grow and improve. We welcome contributions of all kinds.
- This project is in early development and is not ready for production use.

## Components

- [Desktop App](https://stack.lol/download/): Install Stack with a single click
- [Hub](https://github.com/codename-co/stack/tree/main/hub): Browse our curated collection of 190+ applications
- [Website](https://stack.lol): Access documentation and resources
`;

export const GET: APIRoute = ({ site }) => {
  return new Response(getContent(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      Link: `<${site}/_llms-txt/llms.txt>; rel="alternate"; type="text/plain"`,
    },
  });
};
