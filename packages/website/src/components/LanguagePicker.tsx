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

export function LanguagePicker({ currentUrl }: LanguagePickerProps) {
  const currentLang = getLangFromUrl(currentUrl);
  const path = currentUrl.pathname
    .replace(new RegExp(`^\/${currentLang}$`), "/")
    .replace(new RegExp(`^\/${currentLang}\/`), "/");

  const LANGUAGE_SELECTOR_ID = "language-selector";

  return (
    <div className="relative text-base font-medium select-none">
      <label
        htmlFor={LANGUAGE_SELECTOR_ID}
        className="inline-flex items-center justify-center w-full rounded-md border border-transparent hover:border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer gap-2 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
      >
        <span className="truncate">{languages[currentLang]}</span>

        <svg
          className="-me-1 ms-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10.293 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L10 12.586l3.293-3.293a1 1 0 011.414 1.414l-4 4z"
            clipRule="evenodd"
          ></path>
        </svg>
      </label>
      <input type="checkbox" id={LANGUAGE_SELECTOR_ID} className="hidden" />

      <div
        className="origin-top-right absolute end-0 mt-2 w-48 sm:w-96 rounded-md shadow-md bg-white ring-1 ring-black ring-opacity-5 z-10 dark:bg-gray-800 dark:ring-gray-700"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby={LANGUAGE_SELECTOR_ID}
      >
        <div className="py-1 grid sm:grid-cols-2 sm:gap-1">
          {Object.entries(languages).map(([lang, label], index) => (
            <a
              key={lang}
              href={`${lang === defaultLang ? "" : `/${lang}`}${path}`}
              className={`${
                lang === currentLang
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300"
                  : "text-gray-700"
              } px-4 py-2 text-start items-center inline-flex hover:bg-gray-100 gap-2 ${
                index % 2 === 0 ? "rounded-r" : "rounded-l"
              } dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-100`}
              role="menuitem"
            >
              <span
                className={`fi fis fi-${countryCode(
                  lang as Lang
                )} rounded-full`}
              />
              <span className="truncate">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
