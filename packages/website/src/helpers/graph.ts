import { getCollection } from "astro:content";

const stacks = await getCollection("stacks");
const alternatives = await getCollection("alternatives");
const tags = await getCollection("tags");

export const graphData = () => ({
  nodes: [
    ...stacks.map((node) => ({
      type: "stack",
      id: `stack-${node.data.slug}`,
      name: node.data.name,
      icon: node.data.icon,
      path: `/${node.data.slug}`,
      val: (node.data.stars ?? 0) / 500,
      license: node.data.license,
      date: node.data.updated_at,
    })),
    ...alternatives.map((node) => ({
      type: "alt",
      id: `alt-${node.data.slug}`,
      name: node.data.name,
      icon: node.data.icon,
      path: `/alternatives/${node.data.slug}`,
    })),
    ...tags.map((node) => ({
      type: "tag",
      id: `tag-${node.data.slug}`,
      name: node.data.name,
      path: `/?q=${encodeURIComponent(node.data.slug)}`,
    })),
  ],
  links: [
    ...stacks
      .map((node) =>
        node.data.tags?.map((tag) => ({
          source: `stack-${node.data.slug}`,
          target: `tag-${tag}`,
        })),
      )
      .flat()
      .filter(Boolean),
    ...stacks
      .map((node) =>
        node.data.alternativeTo?.map((alternative) => ({
          source: `stack-${node.data.slug}`,
          target: `alt-${alternative}`,
        })),
      )
      .flat()
      .filter(Boolean),
  ],
});
