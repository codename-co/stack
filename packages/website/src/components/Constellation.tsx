import { NodeGraphBackground, SlippyWords } from "performative-ui";

/**
 * `svg` is the icon markup, already resolved by the page. This component is
 * `client:only` (NodeGraphBackground drives a canvas), so it cannot import
 * `Logo` — that reads `astro:content`, which does not exist in the browser
 * bundle. The lookup stays on the server where the content collection lives.
 */
type Item = { slug: string; name: string; url: string; svg?: string };

/**
 * The catalog, seen as a whole.
 *
 * Replaces a 136-line `ForceGraph3D` wrapper that pulled in `react-force-graph`,
 * `three`, its CSS3DRenderer and an undeclared `aframe` import — for a page
 * nothing linked to. NodeGraphBackground draws the same "everything is
 * connected" field on a plain canvas, and the catalog itself stays legible (and
 * clickable) as scroll-driven bands on top, which the 3D version never was.
 */
export const Constellation: React.FC<{ items: Item[]; rowCount?: number }> = ({
  items,
  rowCount = 6,
}) => {
  const rows = items.reduce((acc, item, i) => {
    (acc[i % rowCount] ??= []).push(item);
    return acc;
  }, [] as Item[][]);

  return (
    <div className="relative min-h-[70vh] overflow-hidden rounded-pui-xl">
      <NodeGraphBackground
        density={90}
        linkDistance={130}
        colors={[
          "var(--pui-grad-from)",
          "var(--pui-grad-mid)",
          "var(--pui-grad-to)",
        ]}
      />

      <div className="relative z-10 py-24">
        <SlippyWords
          fade
          intensity={160}
          rows={rows.map((row) =>
            row.map(({ slug, name, url, svg }) => ({
              key: slug,
              label: (
                <a
                  href={url}
                  aria-label={name}
                  className="inline-flex items-center gap-2 whitespace-nowrap"
                >
                  {svg && (
                    <span dangerouslySetInnerHTML={{ __html: svg }} />
                  )}
                  {name}
                </a>
              ),
            }))
          )}
        />
      </div>
    </div>
  );
};
