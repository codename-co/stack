import { getCollection } from "astro:content";
import React from "react";
import { type SimpleIcon } from "simple-icons";
import * as SimpleIcons from "simple-icons";

type LogoProps = {
  slug: string;
  className?: string;
  style?: React.CSSProperties;
};

const icons = Object.values(SimpleIcons as any as SimpleIcon[]).map((icon) => ({
  slug: icon.slug,
  svg: icon.svg,
  hex: `#${icon.hex}`,
}));

const alternatives = await getCollection("alternatives");
const stacks = await getCollection("stacks");

const Logo: React.FC<LogoProps> = ({ slug, className, style }) => {
  if (!slug) return null;

  const alternative = alternatives.find(
    (alternative) => alternative.data.slug === slug,
  );
  const stack = stacks.find((stack) => stack.data.slug === slug);

  const name = alternative?.data.name ?? stack?.data.name;
  const ic = alternative?.data.icon ?? stack?.data.icon;
  const icon =
    icons.find((icon) => icon.slug === ic) ??
    icons.find((icon) => icon.slug === slug);

  return (
    <span
      title={name}
      dangerouslySetInnerHTML={{ __html: icon?.svg ?? ic ?? "" }}
      className={className}
      style={{ color: icon?.hex, ...style }}
    />
  );
};

export default Logo;
