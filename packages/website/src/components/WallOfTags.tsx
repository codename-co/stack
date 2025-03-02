import Logo from "./Logo";

export const WallOfTags: React.FC<{
  items: { slug: string; name: string; url: string }[];
  rowCount?: number;
}> = ({ items, rowCount = 3 }) => {
  return (
    <>
      <style>{styles}</style>
      <div className="wall-of-tags whitespace-nowrap">
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
            <div
              className={`animate-scroll ${
                i % 2 === 0 ? "animate-scroll-reverse" : ""
              }`}
            >
              {stacks.map(({ slug, name, url }) => (
                <a href={url} aria-label={name} className="inline-flex">
                  <span className="tag inline-flex items-center rounded-3xl bg-gray-50 mx-2 px-5 py-3 text-xl font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20 align-bottom">
                    <Logo slug={slug} />
                    <span className="subtle ml-3">{name}</span>
                  </span>
                </a>
              ))}
            </div>
          ))}
      </div>
    </>
  );
};

const speed = 300; // seconds

const styles = /* CSS */ `
  .animate-scroll {
    animation: scroll ${speed}s linear alternate infinite;
    transition: opacity 0.15s;
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
    scale: 1.05;
  }
  @keyframes scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
`;
