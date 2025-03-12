const darkMode = ".dark &"; // "@media (prefers-color-scheme: dark)";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
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
          backgroundColor: theme("colors.white"),
          "&.dark": {
            backgroundColor: theme("colors.slate.950"),
          },
        },
        body: {
          // fontSize: theme("fontSize.xl"),
          // lineHeight: theme("lineHeight.6"),
          overflowX: "hidden",
          backgroundColor: "inherit",
          [darkMode]: {
            backgroundColor: "inherit",
            color: theme("colors.gray.100"),
          },
        },
        "a[href]": {
          color: theme("colors.slate.500"),
          textDecoration: "none",
          "&:hover": {
            color: theme("colors.slate.700"),
          },
          [darkMode]: {
            color: theme("colors.slate.300"),
            "&:hover": {
              color: theme("colors.slate.200"),
            },
          },
        },
        img: {
          borderRadius: theme("borderRadius.md"),
        },
        video: {
          borderRadius: theme("borderRadius.md"),
        },
        "div:not(.class) > h1": {
          marginTop: 0,
        },
        h1: {
          fontSize: theme("fontSize.3xl"),
          "@screen sm": {
            fontSize: theme("fontSize.28px"),
          },
          marginTop: theme("spacing.10"),
          marginBottom: theme("spacing.8"),
        },
        h2: {
          fontSize: theme("fontSize.2xl"),
          "@screen sm": {
            fontSize: theme("fontSize.24px"),
          },
          marginTop: theme("spacing.8"),
          marginBottom: theme("spacing.6"),
        },
        "h1, h2": {
          em: {
            background: "linear-gradient(0deg, #fce04199 50%, transparent 50%)",
            borderRadius: "0.1em",
            padding: "0 3px",
            margin: "0 -3px",
            fontStyle: "normal",
            [darkMode]: {
              background:
                "linear-gradient(0deg, #fce04155 50%, transparent 50%)",
            },
          },
        },
        h3: {
          fontWeight: theme("fontWeight.semibold"),
          fontSize: theme("fontSize.xl"),
          "@screen sm": {
            fontSize: theme("fontSize.20px"),
          },
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
        },
        dt: {
          fontSize: theme("fontSize.sm"),
          lineHeight: theme("lineHeight.6"),
          float: "left",
          clear: "left",
          width: "18em",
          margin: "0 0.5em 0.5em 0",
          padding: "2px 6px",
          borderRadius: theme("borderRadius.sm"),
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          backgroundColor: theme("colors.slate.200"),
          color: theme("colors.slate.600"),
          fontFamily: theme("fontFamily.mono"),
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
          color: theme("colors.slate.600"),
          fontFamily: theme("fontFamily.mono"),
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
          color: theme("colors.gray.400"),
          [darkMode]: {
            color: theme("colors.gray.400"),
          },
        },
        "input[type=text], input[type=search]": {
          borderWidth: theme("borderWidth.DEFAULT"),
          borderColor: theme("colors.gray.300"),
          borderRadius: theme("borderRadius.md"),
          padding: theme("spacing.3"),
          backgroundColor: theme("colors.white"),
          marginTop: 1,
          marginBottom: 1,
          "&:hover": {
            borderColor: theme("colors.slate.400"),
            backgroundColor: theme("colors.gray.100"),
          },
          "&:focus": {
            outline: "none",
            borderColor: theme("colors.slate.500"),
            borderWidth: theme("borderWidth.2"),
            backgroundColor: theme("colors.white"),
            marginTop: 0,
            marginBottom: 0,
          },
        },
        "svg[role=img]": {
          fill: "currentColor",
          marginBottom: "2px",
        },
        article: {
          padding: "1em 2em 1em",
          marginLeft: "-2em",
          marginRight: "-2em",
          borderRadius: theme("borderRadius.md"),
          borderWidth: theme("borderWidth.DEFAULT"),
          borderColor: "transparent",
        },
        "li a article": {
          [darkMode]: {
            borderBottomColor: theme("colors.slate.700"),
          },
        },
        "li a:hover article": {
          backgroundColor: theme("colors.slate.200"),
          [darkMode]: {
            backgroundColor: theme("colors.slate.800"),
          },
        },

        // article {
        //   padding: 1em 2em 1em;
        //   margin-left: -2em;
        //   margin-right: -2em;
        //   /* padding: 0 1em;
        //   border: 1.2px solid #ddd;
        //   border-radius: 0.25em; */
        // }

        // li a:hover article {
        //   background-color: #f0f0f0;
        // }
        // @media (prefers-color-scheme: dark) {
        //   li a:hover article {
        //     background-color: #33333366;
        //   }
        // }

        ".tag": {
          [darkMode]: {
            backgroundColor: theme("colors.slate.800") + "!important",
            color: theme("colors.slate.300") + "!important",
            boxShadow: `0 0 3px 0 ${theme("colors.slate.700")} inset`,
          },
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
        ".highlight::before": {
          content: "''",
          position: "absolute",
          inset: "-5px",
          // borderRadius: "inherit",
          borderRadius: theme("borderRadius.xl"),
          padding: "5px",
          background: "linear-gradient(45deg, #12c2e9, #c471ed, #f64f59)",
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
          color: theme("colors.gray.400"),
          fontSize: theme("fontSize.sm"),
          textTransform: "uppercase",
        },
        ".box": {
          // bg-slate-100 border border-slate-200 rounded-3xl
          padding: theme("spacing.8"),
          borderRadius: theme("borderRadius.3xl"),
          backgroundColor: theme("colors.slate.200"),
          borderWidth: theme("borderWidth.DEFAULT"),
          borderColor: theme("colors.slate.200"),
          position: "relative",
          boxShadow: `0 0 3px 0 ${theme("colors.slate.300")} inset`,
          [darkMode]: {
            backgroundColor: theme("colors.slate.800"),
            borderColor: theme("colors.slate.800"),
            boxShadow: `0 0 3px 0 ${theme("colors.slate.700")} inset`,
          },
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
      });
    },
  ],
};
