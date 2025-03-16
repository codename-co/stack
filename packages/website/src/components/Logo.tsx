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

const hexFromSlug = (s?: string) => {
  if (!s) return null;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hex = "#" + ("000000" + (hash & 0xffffff).toString(16)).slice(-6);
  return hex;
};

export const logoFromIcon = ({ slug, icon }: LogoProps) => {
  if (!slug && !icon) return null;

  const alternative = alternatives.find(
    (alternative) => alternative.data.slug === slug
  );
  const stack = stacks.find((stack) => stack.data.slug === slug);

  const ic = alternative?.data.icon ?? stack?.data.icon;

  const _icon =
    iconOf(ic) ??
    iconOf(slug) ??
    iconOf(icon) ??
    (icon && {
      slug,
      svg: /* html */ `<span class="p-2 custom-icon">${icon}</span>`,
      hex: hexFromSlug(slug) ?? "#000000",
    });

  return _icon;
};

const Logo: React.FC<LogoProps> = ({ slug, className, icon, style }) => {
  const _icon =
    logoFromIcon({ slug, icon }) ?? ({ svg: "", hex: "#000000" } as any);

  const alternative = alternatives.find(
    (alternative) => alternative.data.slug === slug
  );
  const stack = stacks.find((stack) => stack.data.slug === slug);
  const ic = alternative?.data.icon ?? stack?.data.icon;
  const name = alternative?.data.name ?? stack?.data.name;

  return (
    <span
      title={name}
      dangerouslySetInnerHTML={{ __html: _icon?.svg ?? icon ?? ic ?? "" }}
      className={`${className ?? ""} dark:!text-white`}
      style={{ color: _icon?.hex, ...style }}
    />
  );
};

export default Logo;
