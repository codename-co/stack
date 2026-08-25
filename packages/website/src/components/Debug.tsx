import { useEffect, useState } from "react";
import { StatusDot, StickyBanner } from "performative-ui";
import { isApiAccessible } from "~/helpers/stackApi";
import { useTranslations, type Lang } from "~/i18n";

/**
 * "The desktop app is reachable" indicator.
 *
 * Was a hand-built fixed bar with its own `@keyframes gradientShift` and a
 * hazard-stripe background. StickyBanner is the library's announcement bar and
 * StatusDot is its live indicator, so the only thing left to own is the
 * slide-in/out transform — the banner is absent, not just invisible, when the
 * app is not running.
 */
export const Debug: React.FC<{ children?: any; lang: Lang }> = ({
  children,
  lang,
}) => {
  const [connected, setConnected] = useState(false);

  const t = useTranslations(lang);

  useEffect(() => {
    const check = async () => {
      const reachable = await isApiAccessible();
      setConnected(reachable);
      // Several pages hide or reveal CTAs off this attribute.
      document.body.setAttribute("data-connected", reachable.toString());
    };

    check();
    const timer = setInterval(check, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {children}
      <div
        id="debug"
        className="fixed top-0 inset-x-0 z-50 select-none"
        style={{
          transform: `translateY(${connected ? "0" : "-100%"})`,
          transition: "transform 0.3s var(--pui-ease)",
        }}
      >
        <StickyBanner hideSparkle>
          {/* StickyBanner wraps its children in one span, so the dot and the
              label need their own row. */}
          <span className="inline-flex items-center gap-2">
            <StatusDot />
            <span
              dangerouslySetInnerHTML={{ __html: t("Service is running…") }}
            />
          </span>
        </StickyBanner>
      </div>
    </>
  );
};
