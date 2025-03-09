import { getCollection } from "astro:content";
import React from "react";
import { iconOf } from "~helpers";

type LogoProps = {
  slug?: string;
  className?: string;
  icon?: string;
  style?: React.CSSProperties;
};

const alternatives = await getCollection("alternatives");
const stacks = await getCollection("stacks");

const Logo: React.FC<LogoProps> = ({ slug, className, icon, style }) => {
  if (!slug && !icon) return null;

  const alternative = alternatives.find(
    (alternative) => alternative.data.slug === slug
  );
  const stack = stacks.find((stack) => stack.data.slug === slug);

  const name = alternative?.data.name ?? stack?.data.name;
  const ic = alternative?.data.icon ?? stack?.data.icon;
  const _icon = iconOf(ic) ?? iconOf(slug) ?? iconOf(icon);

  return (
    <span
      title={name}
      dangerouslySetInnerHTML={{ __html: _icon?.svg ?? icon ?? ic ?? "" }}
      className={`${className} dark:!text-white`}
      style={{ color: _icon?.hex, ...style }}
    />
  );
};

export default Logo;
