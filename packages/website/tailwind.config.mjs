const darkMode = ".dark &"; // "@media (prefers-color-scheme: dark)";

/**
 * The palette is no longer owned by Tailwind: every color below resolves to a
 * `--pui-*` custom property shipped by `performative-ui/styles.css`. Light and
 * dark are switched by `data-theme` on <html> (see Layout.astro), so these
 * rules need no `dark:` variant of their own — the variables change instead.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        pui: {
          bg: "var(--pui-bg)",
          elev: "var(--pui-bg-elev)",
          soft: "var(--pui-bg-soft)",
          border: "var(--pui-border)",
          fg: "var(--pui-fg)",
          dim: "var(--pui-fg-dim)",
          mute: "var(--pui-fg-mute)",
          from: "var(--pui-grad-from)",
          mid: "var(--pui-grad-mid)",
          to: "var(--pui-grad-to)",
        },
      },
      fontFamily: {
        sans: "var(--pui-font-sans)",
        mono: "var(--pui-font-mono)",
        serif: "var(--pui-font-serif)",
      },
      borderRadius: {
        pui: "var(--pui-radius)",
        "pui-lg": "var(--pui-radius-lg)",
        "pui-xl": "var(--pui-radius-xl)",
      },
      boxShadow: {
        pui: "var(--pui-shadow-card)",
        "pui-deep": "var(--pui-shadow-deep)",
        glow: "var(--pui-glow)",
        "glow-strong": "var(--pui-glow-strong)",
      },
      backgroundImage: {
        pui: "var(--pui-grad)",
      },
      keyframes: {
        highlightMove: {
          "0%": {
            backgroundPosition: "0% 50%",
          },
          "100%": {
            backgroundPosition: "100% 50%",
          },
        },
      },
      animation: {
        highlight: "highlightMove .4s ease forwards",
      },
    },
  },
  darkMode: "class",
  plugins: [
    function ({ addComponents, theme }) {
      addComponents({
        ":root": {
          backgroundColor: "var(--pui-bg)",
          colorScheme: "dark",
          "&[data-theme=light]": {
            colorScheme: "light",
          },
        },
        body: {
          overflowX: "hidden",
          backgroundColor: "inherit",
          color: "var(--pui-fg)",
          fontFamily: "var(--pui-font-sans)",
        },
        "[hidden]": {
          display: "none !important",
        },
        "a[href]": {
          color: "var(--pui-fg-dim)",
          textDecoration: "none",
          transition: "color .15s var(--pui-ease)",
          "&:hover": {
            color: "var(--pui-fg)",
          },
        },
        img: {
          borderRadius: "var(--pui-radius)",
        },
        video: {
          borderRadius: "var(--pui-radius)",
        },
        "div:not(.class) > h1": {
          marginTop: 0,
        },
        h1: {
          fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
          fontWeight: theme("fontWeight.extrabold"),
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          marginTop: theme("spacing.10"),
          marginBottom: theme("spacing.8"),
        },
        h2: {
          fontWeight: theme("fontWeight.bold"),
          fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
          letterSpacing: "-0.015em",
          lineHeight: 1.15,
          marginTop: theme("spacing.8"),
          marginBottom: theme("spacing.6"),
        },
        // `*emphasis*` in translated strings is where the brand gradient lives.
        "h1, h2, h3": {
          em: {
            background: "var(--pui-grad)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            fontStyle: "normal",
            // animation: "pui-grad-shift 8s linear infinite",
          },
        },
        h3: {
          fontWeight: theme("fontWeight.semibold"),
          fontSize: theme("fontSize.xl"),
          marginTop: theme("spacing.6"),
          marginBottom: theme("spacing.4"),
        },
        h4: {
          fontWeight: theme("fontWeight.semibold"),
        },
        p: {
          marginTop: theme("spacing.2"),
          marginBottom: theme("spacing.2"),
        },
        hr: {
          marginTop: theme("spacing.6"),
          marginBottom: theme("spacing.6"),
          borderColor: "var(--pui-border)",
        },
        dt: {
          fontSize: theme("fontSize.sm"),
          lineHeight: theme("lineHeight.6"),
          float: "left",
          clear: "left",
          width: "18em",
          margin: "0 0.5em 0.5em 0",
          padding: "2px 6px",
          borderRadius: "var(--pui-radius-sm)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          backgroundColor: "var(--pui-overlay-strong)",
          color: "var(--pui-fg-dim)",
          fontFamily: "var(--pui-font-mono)",
        },
        dd: {
          fontSize: theme("fontSize.sm"),
          lineHeight: theme("lineHeight.6"),
          margin: "0 0 0.5em 0.5em",
          padding: "2px 6px",
          minWidth: "20em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "var(--pui-fg-mute)",
          fontFamily: "var(--pui-font-mono)",
        },
        ul: {
          listStyleType: "disc",
          paddingLeft: theme("spacing.6"),
        },
        "ol:not(.light)": {
          listStyleType: "decimal",
          paddingLeft: theme("spacing.12"),
        },
        ".subtle": {
          color: "var(--pui-fg-mute)",
        },
        "input[type=text], input[type=search]": {
          borderWidth: theme("borderWidth.DEFAULT"),
          borderColor: "var(--pui-border)",
          borderRadius: "var(--pui-radius-lg)",
          padding: theme("spacing.3"),
          color: "var(--pui-fg)",
          backgroundColor: "var(--pui-glass)",
          backdropFilter: "blur(12px)",
          marginTop: 1,
          marginBottom: 1,
          transition: "border-color .15s var(--pui-ease), box-shadow .2s",
          "&::placeholder": {
            color: "var(--pui-fg-mute)",
          },
          "&:hover": {
            borderColor: "var(--pui-border-bright)",
          },
          "&:focus": {
            outline: "none",
            borderColor: "var(--pui-grad-from)",
            borderWidth: theme("borderWidth.2"),
            boxShadow: "var(--pui-glow)",
            marginTop: 0,
            marginBottom: 0,
          },
        },
        // Same exclusion as the sizing rule in Layout.astro: forcing
        // `currentColor` would flatten the gradient fill on pui's wordmark.
        "svg[role=img]:not([class^=pui-])": {
          fill: "currentColor",
          marginBottom: "2px",
        },
        article: {
          // padding: "1em 2em 1em",
          // marginLeft: "-2em",
          // marginRight: "-2em",
          // borderRadius: "var(--pui-radius)",
          // borderWidth: theme("borderWidth.DEFAULT"),
          // borderColor: "transparent",
        },
        "li a:hover article": {
          backgroundColor: "var(--pui-overlay)",
        },

        ".section": {
          marginTop: "80px",
          marginBottom: "80px",
          "@screen lg": {
            marginTop: "110px",
            marginBottom: "110px",
          },
        },
        ".section > .container": {
          justifySelf: "center",
        },
        ".section + .section": {
          marginTop: "-40px",
        },
        ".content img": {
          width: "100%",
          marginBottom: 8,
        },
        "* hr": {
          marginLeft: 64,
          marginRight: 64,
        },
        ".scrollbar-subtle": {
          scrollbarWidth: "thin",
          scrollbarColor: `transparent transparent`,
        },
        ".highlight::before": {
          content: "''",
          position: "absolute",
          inset: "-5px",
          borderRadius: theme("borderRadius.xl"),
          padding: "5px",
          background: "var(--pui-grad)",
          backgroundSize: "200% 200%",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          transition: "padding 0.5s ease, inset 0.5s ease",
          pointerEvents: "none",
        },
        ".highlight[href]:hover::before": {
          animation: "highlightMove .4s ease forwards",
        },
        ".suptitle": {
          color: "var(--pui-fg-mute)",
          fontSize: theme("fontSize.sm"),
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        },
        ".suptitle + h2": {
          marginTop: 0,
        },
        // The generic content panel, aligned on GlassCard's chrome so a `.box`
        // and a <GlassCard> can sit side by side without a seam.
        ".box": {
          padding: theme("spacing.8"),
          borderRadius: "var(--pui-radius-xl)",
          backgroundColor: "var(--pui-glass-soft)",
          backdropFilter: "blur(14px)",
          borderWidth: theme("borderWidth.DEFAULT"),
          borderColor: "var(--pui-border)",
          position: "relative",
          boxShadow: "var(--pui-shadow-card)",
        },
        ".box + .box": {
          marginTop: 32,
        },
        ".box a": {
          fontWeight: theme("fontWeight.semibold"),
        },
        ".box p": {
          marginTop: 8,
          marginBottom: 8,
        },
        ".box h2": {
          marginTop: 0,
          marginBottom: 32,
        },
        ".box h3": {
          marginTop: 0,
          marginBottom: 8,
        },
        ".box ul": {
          listStyleType: "disc",
          paddingLeft: 16,
        },
        ".box ol": {
          listStyleType: "none",
          paddingLeft: 0,
        },
        ".columns": {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))",
          gap: theme("spacing.8"),
        },
        // Makes a link cover its nearest positioned ancestor, so a whole card
        // can be clickable without nesting an <a> inside another <a> — which
        // the HTML parser un-nests, wrecking any grid the cards sit in.
        ".stretched-link::after": {
          content: "''",
          position: "absolute",
          inset: 0,
          zIndex: 1,
        },
        // Section grid used by the revamped pages.
        ".pui-grid": {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: theme("spacing.6"),
        },
      });
    },
  ],
};
