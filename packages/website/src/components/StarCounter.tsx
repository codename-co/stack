import { useEffect, useState } from "react";
import { StatCounter } from "performative-ui";
// Imported from the leaf module, not the `~helpers` barrel: the barrel also
// re-exports `icon.ts`, which pulls the whole of simple-icons into whatever
// bundle touches it. This island needs one number formatter.
import { formatStars } from "~helpers/format";

/**
 * The cumulative star count, animated.
 *
 * The count-up is an enhancement, not the source of truth: StatCounter starts
 * at zero, so rendering it server-side would ship "★ 0 cumulative stars" to
 * crawlers and to anyone without JS. The real figure is rendered first and
 * only handed to the animation once mounted.
 *
 * The formatter has to live on this side of the island boundary too — Astro
 * serializes island props as JSON, so a `format` function passed from a
 * `.astro` file arrives as `null`.
 */
export const StarCounter: React.FC<{ target: number; lang?: string }> = ({
  target,
  lang,
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className="pui-stat">{formatStars(target, lang)}</span>;
  }

  return (
    <StatCounter
      target={target}
      // Clamped: the easing curve undershoots below zero on the first frames,
      // and "★ -223.9K cumulative stars" is not the impression we're after.
      format={(value: number) =>
        formatStars(Math.max(1, Math.round(value)), lang)
      }
    />
  );
};
