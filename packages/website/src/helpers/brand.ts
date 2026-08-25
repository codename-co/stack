import { logoFromIcon } from "~/components/Logo";

/**
 * The colour a stack or recipe gets to paint with.
 *
 * `logoFromIcon` has three exits — an icon record, an empty string, or null —
 * and two of the three carry no usable colour: the literal "currentColor" that
 * simple-icons uses for pure-black marks, and the hash-of-the-slug fallback for
 * software with no icon at all. Both would produce a halo that says nothing
 * about the product, so they resolve to the theme gradient instead.
 *
 * `icon` matters for recipes: they are in neither the stacks nor the
 * alternatives collection, so a slug lookup alone finds nothing and every
 * recipe would end up wearing the same purple.
 */
const hexOf = (slug?: string, icon?: string) => {
  const resolved = slug || icon ? logoFromIcon({ slug, icon }) : null;
  const logo = resolved && typeof resolved === "object" ? resolved : null;
  const hex = logo?.hex;
  return hex && hex !== "currentColor" ? hex : null;
};

/**
 * Whether the resolved mark is something you can actually put in a tile.
 *
 * `logoFromIcon`'s last resort is to wrap whatever it was given in a
 * `.custom-icon` span and render it as text. That is right for the stacks
 * whose `icon` field holds an emoji, and wrong for a recipe's custom
 * ingredient, where the "icon" defaults to the dependency's own name — so
 * `pg_featureserv` was being painted across a 2.25rem box. Accept the text
 * fallback only when it is short enough to read as a glyph.
 */
export const hasLogoOf = (slug?: string, icon?: string) => {
  const resolved = slug || icon ? logoFromIcon({ slug, icon }) : null;
  const svg =
    resolved && typeof resolved === "object" ? (resolved.svg ?? "") : "";
  if (svg.startsWith("<svg")) return true;
  const text = svg.match(/<span class="custom-icon">([\s\S]*)<\/span>/)?.[1];
  // Spread, not `.length`: an emoji is one glyph and several UTF-16 units.
  return text ? [...text].length <= 2 : false;
};

/** Solid brand colour, for the icon tile and the card halo. */
export const brandOf = (slug?: string, icon?: string) =>
  hexOf(slug, icon) ?? "var(--pui-grad-from)";

/** The same colour at ~35% alpha, for an `<Aurora>` blob. */
export const brandGlowOf = (slug?: string, icon?: string) => {
  const hex = hexOf(slug, icon);
  return hex ? `${hex}59` : "rgba(124,58,237,0.35)";
};
