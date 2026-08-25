import { GlassCard, Sparkle } from "performative-ui";
import { formatStars, timeago } from "~helpers";
import { logoFromIcon } from "./Logo";

type CardProps = {
  lang: string;
  slug: string;
  name: string;
  description: string;
  small?: boolean;
  url: string;
  icon?: string;
  stars?: number;
  updated_at?: Date;
  className?: string;
  style?: React.CSSProperties;
  breathing?: boolean;
  mentionHtml?: string;
  children?: React.ReactNode;
};

/**
 * A catalog entry, rendered as a GlassCard.
 *
 * The one thing the library cannot know is the software's own brand color, so
 * the icon tile — and only the icon tile — is tinted from the simple-icons hex.
 * Everything else (chrome, halo, hover lift) is left to performative-ui, which
 * keeps 250+ cards on the same surface treatment as the rest of the page.
 */
const Card: React.FC<CardProps> = ({
  className,
  children,
  description,
  icon,
  lang,
  name,
  slug,
  small,
  stars,
  style,
  updated_at,
  url,
  breathing,
  mentionHtml,
}) => {
  // `logoFromIcon` yields the icon record, an empty string, or null depending
  // on which of the three lookups hit. Normalise once, here.
  const resolved = logoFromIcon({ slug, icon });
  const logo = resolved && typeof resolved === "object" ? resolved : null;

  return (
    <div
      // `small` cards live in dense grids (the related rail, the alternatives
      // list). The catalog's min-widths are what forced those into one
      // full-width card per row.
      className={`relative w-full ${
        small ? "min-w-0" : "min-w-56 md:min-w-72 lg:min-w-96"
      } ${className ?? ""}`}
      style={style}
    >
      {children}
      <GlassCard
        breathing={breathing}
        glowOnHover
        className={`h-full ${small ? "!p-4" : ""}`}
        style={
          {
            // Bleed the brand color into the card's own halo.
            ...(logo?.hex &&
              logo.hex !== "currentColor" && {
                "--pui-grad-from": logo.hex,
              }),
          } as React.CSSProperties
        }
      >
        <a
          href={url}
        >
          {mentionHtml && (
            <span
              className="absolute -end-4 -top-8 py-0.5 ms-16"
              dangerouslySetInnerHTML={{ __html: mentionHtml }}
            />
          )}

          {logo ? (
            <GlassCard.Icon>
              {/* No `.icon` class here on purpose: the tile is 38px and the
                  global `svg[role=img]` rule already sizes the glyph to 1em. */}
              <span
                className="inline-flex"
                title={`Icon of ${name}`}
                style={{ color: logo.hex }}
                dangerouslySetInnerHTML={{ __html: logo.svg }}
              />
            </GlassCard.Icon>
          ) : (
            <GlassCard.Icon>
              <Sparkle />
            </GlassCard.Icon>
          )}

          <GlassCard.Title className="line-clamp-1">{name}</GlassCard.Title>
          <GlassCard.Body className="line-clamp-2 min-h-11">
            {description}
          </GlassCard.Body>

          {(stars || updated_at) && (
            <p className="flex gap-3 subtle m-0">
              {stars && (
                <span className="text-sm">★&nbsp;{formatStars(stars, lang)}</span>
              )}
              {updated_at && (
                <span className="text-sm">
                  <time
                    dateTime={updated_at.toISOString()}
                    title={new Intl.DateTimeFormat(lang, {
                      dateStyle: "full",
                      timeStyle: undefined,
                    }).format(updated_at)}
                  >
                    {timeago(updated_at, lang)}
                  </time>
                </span>
              )}
            </p>
          )}
        </a>
      </GlassCard>
    </div>
  );
};

export default Card;
