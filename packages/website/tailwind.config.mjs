/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      keyframes: {
        borderMove: {
          "0%, 100%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
        },
      },
      animation: {
        border: "borderMove 4s ease infinite",
      },
    },
  },
  plugins: [
    function ({ addComponents, theme }) {
      addComponents({
        body: {
          // fontSize: theme("fontSize.xl"),
          // lineHeight: theme("lineHeight.6"),
          overflowX: "hidden",
        },
        "a[href]": {
          color: theme("colors.slate.500"),
          textDecoration: "none",
          "&:hover": {
            color: theme("colors.slate.700"),
          },
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
        ".section": {
          marginTop: "110px",
          marginBottom: "110px",
          // marginLeft: "1em",
          // marginRight: "1em",
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
          borderRadius: "inherit",
          padding: "5px",
          background: "linear-gradient(45deg, #12c2e9, #c471ed, #f64f59)",
          backgroundSize: "200% 200%",
          animation: "borderMove 4s ease infinite",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        },
        ".box": {
          // bg-slate-100 border border-slate-200 rounded-3xl
          padding: theme("spacing.8"),
          borderRadius: theme("borderRadius.3xl"),
          backgroundColor: theme("colors.slate.200"),
          borderWidth: theme("borderWidth.DEFAULT"),
          borderColor: theme("colors.slate.200"),
          position: "relative",
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
          listStyleType: "decimal",
          paddingLeft: 16,
        },
        ".box ol:not(.light)": {
          listStyleType: "decimal",
          paddingLeft: 32,
        },
      });
    },
  ],
};
