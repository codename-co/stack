import Logo from "./Logo";

const keyframes = `
  @keyframes scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
`;

const styles = `
  ${keyframes}

  .animate-scroll {
    animation: scroll 90s linear alternate infinite;
  }
  .animate-scroll:hover {
    animation-play-state: paused;
  }
  .animate-scroll-reverse {
    animation-direction: alternate-reverse;
  }
`;

export const WallOfTags: React.FC<{
  items: { slug: string; name: string; url: string }[];
}> = ({ items }) => {
  return (
    <>
      <style>{styles}</style>
      <div className="wall-of-tags whitespace-nowrap">
        {/* Rest of your component code remains the same */}
        {items
          .sort(() => Math.random() - 0.5)
          .reduce(
            (acc, stack, i) => {
              const row = i % 4;
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
              className={`animate-scroll mt-4 ${
                i % 2 === 0 ? "animate-scroll-reverse" : ""
              }`}
            >
              {stacks.map(({ slug, name, url }) => (
                <a href={url} aria-label={name} className="inline-block">
                  <span className="inline-flex items-center rounded-3xl bg-gray-50 mx-2 px-5 py-3 text-xl font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20 align-bottom">
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
