import AlternativesConfig from "~/content/data/alternatives.yaml";
import PromotedConfig from "~/content/data/promoted.yaml";
import TagsConfig from "~/content/data/tags.yaml";

export const getTags = () => {
  return TagsConfig.tags;
};

export const getTagName = (tag: string) => {
  const t = getTags()[tag];
  return t?.value ?? t ?? tag;
};

export const getTagTitle = (tag: string) => {
  const t = getTags()[tag];
  return t?.title;
};

export const getPromoted = () => {
  return PromotedConfig.promoted;
};

type Alternative = {
  slug: string;
  name: string;
  icon?: string;
  description: string;
};

export const getAlternativeMetadata = (slug: string): Alternative => {
  return AlternativesConfig.alternatives.find(
    (entry: any) => entry.slug === slug,
  );
};
