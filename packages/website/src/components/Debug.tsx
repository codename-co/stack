import { useEffect, useState, type CSSProperties } from "react";
import { isApiAccessible } from "~/helpers/stackApi";
import { useTranslations, type Lang } from "~/i18n";

export const Debug: React.FC<{ children?: any; lang: Lang }> = ({
  children,
  lang,
}) => {
  const [connected, setConnected] = useState(false);

  const t = useTranslations(lang);

  const check = async () => {
    const connected = await isApiAccessible();
    console.log("API is accessible:", connected);
    setConnected(connected);

    globalThis.document.body.setAttribute(
      "data-connected",
      connected.toString(),
    );
  };

  useEffect(() => {
    check();
    setInterval(check, 2000);
  }, []);

  const debugStyle: CSSProperties = {
    transform: `translateY(${connected ? "0" : "-100%"})`,
    transition: "all 0.3s ease-in-out",
    background:
      "repeating-linear-gradient(45deg, #333, #333 10px, #555 10px, #555 20px)",
    backgroundSize: "160% 100%",
    animation: "gradientShift 20s linear infinite",
  };

  return (
    <>
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
          }
        `}
      </style>
      {children}
      <div
        id="debug"
        style={debugStyle}
        className="fixed top-0 left-0 right-0 w-full z-50 user-select-none text-white max-w-96 mx-auto my-0 px-6 py-1 text-sm font-semibold rounded-bl-lg rounded-br-lg"
      >
        <span>
          ▶{" "}
          <span
            dangerouslySetInnerHTML={{ __html: t("Service is running…") }}
          />
        </span>
        <nav className="float-end">
          <a
            className="!text-white"
            href="https://stack.localhost"
            data-title="Dashboard"
          >
            dash
          </a>
        </nav>
      </div>
    </>
  );
};
