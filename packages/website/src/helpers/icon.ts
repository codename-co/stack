import { type SimpleIcon } from "simple-icons";
import * as SimpleIcons from "simple-icons";

const icons = Object.values(SimpleIcons as any as SimpleIcons.SimpleIcon[]).map(
  (icon) => ({
    slug: icon.slug,
    svg: icon.svg,
    hex: `#${icon.hex}`,
  }),
);

export const iconOf = (slug?: string) => {
  return icons.find((icon) => icon.slug === slug);
};
