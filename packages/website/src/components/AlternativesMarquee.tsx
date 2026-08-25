import { LogoMarquee } from "performative-ui";
import Logo from "./Logo";

type Item = { slug: string; name: string; url: string };

/**
 * The "logos of companies you've heard of" wall, pointed the other way round:
 * these are the proprietary products the catalog replaces, so every logo is a
 * link into the corresponding alternatives page rather than a customer brag.
 */
export const AlternativesMarquee: React.FC<{
  items: Item[];
  speed?: number;
}> = ({ items, speed = 90 }) => (
  <LogoMarquee
    fade
    pauseOnHover
    speed={speed}
    style={{
      opacity: 0.4,
      // position: "absolute",
      // marginTop: "-3em",
      marginBottom: "1.5em",
      zIndex: 100,
    }}
    logos={items.map(({ slug, name, url }) => ({
      kind: "node" as const,
      key: slug,
      node: (
        <a
          href={url}
          aria-label={name}
          className="pui-marquee__text inline-flex items-center gap-2"
        >
          <Logo slug={slug} />
          {name}
        </a>
      ),
    }))}
  />
);
