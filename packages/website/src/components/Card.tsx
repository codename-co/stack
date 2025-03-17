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
  children?: React.ReactNode;
};

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
}) => {
  const logo = logoFromIcon({
    slug,
    icon,
  });

  return (
    <div
      className={`relative w-full min-w-56 md:min-w-72 lg:min-w-96 hover:scale-105 transition-transform ${
        className ?? ""
      }`}
      style={style}
    >
      <div>
        {children}
        <a
          href={url}
          className={`flex flex-col relative rounded-3xl ${
            small ? (logo ? "pt-10" : "pt-4") : "pt-20"
          } pb-4 px-8 gap-4 shadow-md`}
        >
          <div className="overflow-hidden absolute w-full h-full top-0 left-0 -z-50 rounded-3xl">
            {/* subtle gradient effect */}
            <div
              className="absolute w-full h-full"
              style={{
                background:
                  "repeating-linear-gradient(3deg, transparent 70%, #3331)",
              }}
            />
            {/* background */}
            {logo && (
              <span
                className={`absolute object-cover pointer-events-none w-[200%] h-[200%] max-w-[200%] blur-[100px] saturate-150 dark:saturate-0`}
                style={{ background: `${logo.hex}33` }}
              />
            )}
          </div>
          {/* Icon */}
          {logo && (
            <span
              className={`icon ${
                small ? "small" : ""
              } border dark:border-white ${small ? "w-12 h-12" : "w-24 h-24"} ${
                small ? "p-2" : "p-4"
              } pointer-events-none absolute -top-4 text-center rounded-2xl object-cover shadow-xl bg-white/30 dark:!text-white`}
              style={{
                color: `${logo.hex}99`,
                borderColor: `${logo.hex}33`,
              }}
              title={`Icon of ${name}`}
              dangerouslySetInnerHTML={{ __html: logo.svg }}
            />
          )}
          <div className="mt-3">
            <span className="block text-xl font-medium line-clamp-1 mb-1">
              {name}
            </span>
            <span className="block h-11 line-clamp-2">{description}</span>
            {(stars || updated_at) && (
              <p className="flex gap-3 subtle">
                {stars && (
                  <span className="text-sm">
                    ★&nbsp;{formatStars(stars, lang)}
                  </span>
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
          </div>
        </a>
      </div>
    </div>
  );
};

export default Card;
