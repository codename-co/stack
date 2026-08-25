"use client";
import { useState, useEffect, type MouseEvent } from "react";
import { Button } from "performative-ui";

type Theme = "light" | "dark" | "system";

/**
 * Two consumers, one decision: Tailwind switches on the `.dark` class,
 * performative-ui switches on `[data-theme]`. Everything below writes both,
 * always, so a component can never render in the opposite palette to the page
 * it sits on.
 */
const paint = (dark: boolean) => {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.setAttribute("data-theme", dark ? "dark" : "light");
};

const systemPrefersDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const SunIcon = () => (
  <svg
    className="stroke-current w-4 h-4 inline align-middle"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke-width="2"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg
    className="stroke-current w-4 h-4 inline align-middle"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const DarkModeSwitcher: React.FC<{ children?: any }> = ({
  children,
}) => {
  const [activeTheme, setActiveTheme] = useState<Theme>("system");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as Theme) || "system";
    setActiveTheme(savedTheme);
    paint(savedTheme === "system" ? systemPrefersDark() : savedTheme === "dark");

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if ((localStorage.getItem("theme") || "system") === "system") {
        paint(systemPrefersDark());
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  const switchTheme = (e: MouseEvent) => {
    e.preventDefault();

    // "system" resolves to whatever it currently looks like, then flips: the
    // user is telling us the current rendering is wrong, not that they want to
    // start a three-way cycle.
    const isDark = document.documentElement.classList.contains("dark");
    const next: Theme = isDark ? "light" : "dark";

    setActiveTheme(next);
    localStorage.setItem("theme", next);
    paint(next === "dark");
  };

  const isDark = activeTheme === "dark" || activeTheme === "system";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchTheme}
      aria-label="Toggle dark mode"
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
      {children}
    </Button>
  );
};
