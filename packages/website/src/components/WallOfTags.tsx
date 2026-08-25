import { SlippyWords } from "performative-ui";

/**
 * `svg` is the icon markup, resolved by the page. This component hydrates
 * (SlippyWords is scroll-coupled), so it cannot import `Logo` — that reads
 * `astro:content`, which does not exist in the browser bundle.
 */
type Item = { slug: string; name: string; url: string; svg?: string };

/**
 * The wall of catalog entries.
 *
 * Has been three different components: hand-rolled `@keyframes` rows, then
 * LogoMarquee rows, and now SlippyWords — the scroll-driven bands the library
 * ships for exactly this "kinetic typography" strip. Motion is coupled to
 * scroll position rather than running on a timer, so the wall moves only when
 * the reader moves, and alternating rows still travel opposite ways because
 * that is SlippyWords' default.
 */
export const WallOfTags: React.FC<{
  items: Item[];
  rowCount?: number;
  rtl?: boolean;
}> = ({ items, rowCount = 3, rtl = false }) => {
  const rows = items
    // Weird sorting to make the list look more random
    .sort((a, b) => a.name.split("").reverse().join("").localeCompare(b.name))
    .reduce((acc, item, i) => {
      const row = i % rowCount;
      (acc[row] ??= []).push(item);
      return acc;
    }, [] as Item[][]);

  return (
    <SlippyWords
      fade
      gap={12}
      intensity={140}
      startDirection={rtl ? "right" : "left"}
      rows={rows.map((row) =>
        row.map(({ slug, name, url, svg }) => ({
          key: slug,
          label: (
            <a href={url} aria-label={name}>
              <span className="inline-flex items-center gap-2">
                {svg && (
                  <span dangerouslySetInnerHTML={{ __html: svg }} />
                )}
                <span>{name}</span>
              </span>
            </a>
          ),
        }))
      )}
    />
  );
};
