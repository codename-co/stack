import { useState } from "react";
import { Button, Popover } from "performative-ui";
import {
  type Lang,
  countryCode,
  getLangFromUrl,
  languages,
  defaultLang,
} from "~/i18n";
import "flag-icons/css/flag-icons.min.css";

interface LanguagePickerProps {
  currentUrl: URL;
}

/**
 * The locale switcher.
 *
 * Was a `<label>` + hidden `<input type=checkbox>` + `[role=menu]` dropdown
 * held open by a CSS sibling selector, painted with a dozen hard-coded
 * `gray-*` classes and a `dark:` twin for each. It is now the library's
 * Button + Popover: real focus handling, Escape and backdrop dismissal, and 16
 * locales laid out with room to read them instead of squeezed into a 24rem
 * dropdown.
 */
export function LanguagePicker({ currentUrl }: LanguagePickerProps) {
  const [open, setOpen] = useState(false);

  const currentLang = getLangFromUrl(currentUrl);
  const path = currentUrl.pathname
    .replace(new RegExp(`^\/${currentLang}$`), "/")
    .replace(new RegExp(`^\/${currentLang}\/`), "/");

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {/*<span
          className={`fi fis fi-${countryCode(currentLang)} rounded-full`}
          aria-hidden="true"
        />*/}
        <span className="truncate">{languages[currentLang]}</span>
      </Button>

      {open && (
        <Popover
          open
          onOpenChange={setOpen}
          closeLabel="Close"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {Object.entries(languages).map(([lang, label]) => (
              <a
                key={lang}
                href={`${lang === defaultLang ? "" : `/${lang}`}${path}`}
                hrefLang={lang}
                lang={lang}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-pui truncate"
                style={{
                  background:
                    lang === currentLang
                      ? "var(--pui-overlay-strong)"
                      : "transparent",
                  color:
                    lang === currentLang
                      ? "var(--pui-fg)"
                      : "var(--pui-fg-dim)",
                }}
              >
                <span
                  className={`fi fis fi-${countryCode(lang as Lang)} rounded-full shrink-0`}
                  aria-hidden="true"
                />
                <span className="truncate">{label}</span>
              </a>
            ))}
          </div>
        </Popover>
      )}
    </>
  );
}
