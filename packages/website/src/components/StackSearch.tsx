import { useEffect, useRef, useState } from "react";

/**
 * Filters the catalog list in place.
 *
 * Was a bare `<input type="search">` plus a ~30 line `is:inline` script that
 * reached for the global `stacks` element by id. The filtering still works on
 * the server-rendered list — 250+ cards are not worth re-rendering through
 * React — but the input itself, the `?q=` deep link and the initial scroll are
 * now owned by this component instead of a script tag.
 */
export const StackSearch: React.FC<{
  /** Id of the <ol> whose <li> children get filtered. */
  targetId: string;
  placeholder?: string;
}> = ({ targetId, placeholder }) => {
  const [value, setValue] = useState("");
  const hostRef = useRef<HTMLDivElement>(null);

  const filter = (query: string) => {
    const list = document.getElementById(targetId);
    if (!list) return;

    const q = query.trim().toLowerCase();
    for (const li of list.querySelectorAll("li")) {
      const haystack = `${li.dataset.search ?? ""} ${li.textContent ?? ""}`;
      li.hidden = q.length > 0 && !haystack.toLowerCase().includes(q);
    }
  };

  useEffect(() => {
    // `/?q=%23monitoring` links in from the tag lists and the category index.
    const q = new URL(location.href).searchParams.get("q");
    if (!q) return;

    setValue(q);
    filter(q);

    // Deferred by two frames on purpose: filtering removes most of the list
    // and the marquees above are still mounting, so scrolling synchronously
    // aims at a layout that no longer exists by the time it lands.
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        hostRef.current?.scrollIntoView({
          behavior: "instant",
          block: "start",
        })
      )
    );
  }, []);

  return (
    <div ref={hostRef} id="search" className="relative w-full">
      <span aria-hidden="true" className="pui-prompt__icon absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">⌕</span>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          filter(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") filter(value);
        }}
        className="pui-prompt__input"
      />
    </div>
  );
};
