import { textDirection } from "~i18n";
import Logo from "./Logo";

export const WallOfTags: React.FC<{
  items: { slug: string; name: string; url: string }[];
  rowCount?: number;
  rtl?: boolean;
}> = ({ items, rowCount = 3, rtl = false }) => {
  return (
    <>
      <style>{styles}</style>
      <span className="wall-of-tags whitespace-nowrap [writing-mode:horizontal-tb]">
        {/* Rest of your component code remains the same */}
        {items
          // Weird sorting to make the list look more random
          .sort((a, b) =>
            a.name.split("").reverse().join("").localeCompare(b.name),
          )
          .reduce(
            (acc, stack, i) => {
              const row = i % rowCount;
              if (!acc[row]) {
                acc[row] = [];
              }
              acc[row].push(stack);
              return acc;
            },
            [] as (typeof items)[],
          )
          .map((stacks, i) => (
            <span
              className={`animate-scroll ${rtl && "animate-scroll-rtl"} ${
                i % 2 === 0 ? "animate-scroll-reverse" : ""
              }`}
            >
              {stacks.map(({ slug, name, url }) => (
                <a
                  href={url}
                  aria-label={name}
                  className="inline-flex align-top"
                >
                  <span className="tag inline-flex items-center gap-2 rounded-3xl bg-gray-50 mx-2 px-4 py-2 text-lg font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20 align-bottom">
                    <Logo slug={slug} />
                    <span>{name}</span>
                  </span>
                </a>
              ))}
            </span>
          ))}
      </span>
    </>
  );
};

const speed = 300; // seconds

const styles = /* CSS */ `
  .animate-scroll {
    animation: scroll ${speed}s linear alternate infinite;
    transition: opacity 0.15s;
  }
  .animate-scroll-rtl {
    animation-name: scroll-rtl;
  }
  .animate-scroll-reverse {
    animation-direction: alternate-reverse;
  }
  .wall-of-tags {
    display: grid;
    gap: 1rem;
    max-width: 0;
  }
  .wall-of-tags:hover .animate-scroll {
    animation-play-state: paused;
    opacity: 0.4;
  }
  .wall-of-tags:hover .animate-scroll:hover .tag:not(:hover) {
    opacity: 0.6;
  }
  .wall-of-tags:hover .animate-scroll:hover {
    opacity: 1;
  }
  .tag {
    transition: scale 0.15s;
  }
  .tag:hover {
    scale: 1.1;
  }
  @keyframes scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
  @keyframes scroll-rtl {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(50%);
    }
  }
`;
