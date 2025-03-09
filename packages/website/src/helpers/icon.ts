import { type SimpleIcon } from "simple-icons";
import * as SimpleIcons from "simple-icons";

let icons = Object.values(SimpleIcons as any as SimpleIcon[]).map((icon) => ({
  slug: icon.slug,
  svg: icon.svg,
  hex: icon.hex === "000000" ? "currentColor" : `#${icon.hex}`,
  // hex: `#${icon.hex}`,
}));

icons = [
  ...icons,

  // Custom icons
  {
    slug: "adobe",
    svg: /* svg */ `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 8 17.5 22"><path d="M6.27,10.22h4.39l6.2,14.94h-4.64l-3.92-9.92-2.59,6.51h3.08l1.23,3.41H0l6.27-14.94ZM22.03"/></svg>`,
    hex: "#eb1000",
  },
  {
    slug: "appflowy",
    svg: /* svg */ `<svg role="img" width="41" height="40" viewBox="0 0 41 40" xmlns="http://www.w3.org/2000/svg"><title>Appflowy</title>
<path d="M39.9564 24.0195C38.8098 30.1683 33.7828 35.5321 28.0061 38.5411C27.3005 38.9336 26.4627 39.1516 25.6689 39.1952H37.9279C39.1185 39.1952 39.9564 38.323 39.9564 37.2328V24.0195Z" />
<path d="M15.4381 12.1576C15.2617 12.2884 15.0853 12.4192 14.9089 12.55C11.9103 14.6432 2.82634 21.3589 0.753788 18.4371C-1.27467 15.6026 0.886079 7.57868 6.08952 3.69755C6.17771 3.61033 6.31 3.56672 6.3982 3.4795C12.0867 -0.48885 16.32 0.078058 18.3926 2.95621C20.3328 5.65992 18.1721 9.93353 15.4381 12.1576Z"/>
<path d="M33.8715 36.098C33.7833 36.1852 33.6951 36.2288 33.5628 36.316C27.8743 40.2844 23.641 39.7175 21.5684 36.8393C19.6282 34.1356 21.7889 29.862 24.5229 27.638C24.6993 27.5072 24.8757 27.3763 25.0521 27.2455C28.0507 25.1959 37.1347 18.4366 39.1631 21.3584C41.2357 24.1929 39.119 32.2169 33.8715 36.098Z" />
<path d="M17.9954 38.8459C15.085 40.8955 6.70658 38.6715 2.87014 33.264C2.78195 33.1768 2.69376 33.046 2.64966 32.9588C-1.09858 27.5078 -0.481224 23.4086 2.38508 21.4462C5.20728 19.4838 9.61698 21.7515 11.8218 24.586C11.91 24.7168 11.9982 24.804 12.0864 24.9349C14.159 27.8566 20.9499 36.8399 17.9954 38.8459Z" />
<path d="M15.4385 12.1576C11.3816 13.9455 2.73857 17.6086 1.45976 14.6432C0.357338 12.1576 2.3858 7.09899 6.08994 3.69755C6.17814 3.61033 6.31043 3.56672 6.39862 3.4795C12.0871 -0.48885 16.3204 0.078058 18.393 2.95621C20.3333 5.65992 18.1725 9.93353 15.4385 12.1576Z" />
<path d="M37.6624 18.3955C34.8402 20.3579 30.4305 18.0903 28.2257 15.2557C28.1375 15.1249 28.0493 15.0377 27.9611 14.9069C25.8444 11.9415 19.0535 2.95819 21.9639 0.952211C24.8743 -1.09738 33.2968 1.12664 37.1333 6.53407C37.2215 6.6649 37.3096 6.75211 37.3978 6.88294C41.102 12.334 40.5287 16.3895 37.6624 18.3955Z" />
<path d="M37.6628 18.3934C34.8406 20.3557 30.4309 18.0881 28.2261 15.2536C26.4181 11.1108 22.9344 2.95603 25.8448 1.73499C28.4906 0.601179 33.9587 2.86881 37.4423 6.88077C41.1024 12.3318 40.5291 16.3874 37.6628 18.3934Z" />
<path d="M33.8715 36.0986C33.7833 36.1858 33.6951 36.2294 33.5628 36.3166C27.8743 40.285 23.641 39.7181 21.5684 36.8399C19.6282 34.1362 21.7889 29.8626 24.5229 27.6386C28.5799 25.8506 37.2229 22.1875 38.5017 25.1529C39.6482 27.6386 37.6197 32.6971 33.8715 36.0986Z" />
<path d="M14.2031 38.061C11.5572 39.1948 6.08922 36.9708 2.64966 32.9588C-1.09858 27.5078 -0.481224 23.4086 2.38508 21.4462C5.20728 19.4838 9.61698 21.7515 11.8218 24.586C13.6298 28.6852 17.1135 36.8399 14.2031 38.061Z" />
</svg>`,
    hex: "#8427e0",
  },
  {
    slug: "huginn",
    svg: /* svg */ `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	<circle fill="#ffb74d" cx="256" cy="256" r="256"/>
	<g id="raven">
		<path fill="#212121" d="m 185.431,114.020 c -48.654,0.597 -102.751,18.734 -110.578,21.744 11.601,-0.828 22.183,1.035 24.820,5.356 -6.738,3.369 -57.367,31.758 -74.355,44.602 10.565,-1.035 16.069,2.439 16.069,2.439 -14.021,9.258 -26.772,18.770 -38.397,28.479 -1.979,12.829 -2.969,25.967 -2.969,39.352 0,123.414 87.313,226.449 203.548,250.643 32.235,-75.592 32.760,-173.290 100.289,-214.314 24.902,-13.183 101.310,-53.060 182.599,-43.011 0,0 0.205,-15.559 -22.168,-36.276 -22.373,-20.716 -61.165,-31.017 -84.750,-35.851 -23.584,-4.834 -68.278,-3.535 -72.233,-10.713 -3.955,-7.177 -5.704,-16.998 -17.130,-25.934 -11.425,-8.935 -50.218,-25.931 -100.024,-26.517 -1.556,-0.018 -3.150,-0.018 -4.720,0 z"/>
		<path fill="#fafafa" d="M 250.406 174.75 C 246.845 174.75 243.968 177.626 243.968 181.187 C 243.968 184.748 246.845 187.625 250.406 187.625 C 253.967 187.625 256.875 184.748 256.875 181.187 C 256.875 177.626 253.967 174.75 250.406 174.75 z"/>
		<path fill="#ffc107" d="m 239.970,173.055 c -7.242,2.025 -12.675,8.393 -12.675,16.281 0,9.496 7.740,17.183 17.236,17.183 9.496,0 17.183,-7.686 17.183,-17.183 0,-7.198 -4.436,-13.348 -10.713,-15.910 0.770,0.470 1.591,0.849 2.227,1.484 1.026,1.026 1.812,2.249 2.386,3.606 0.573,1.357 0.901,2.889 0.901,4.454 0,1.566 -0.327,3.044 -0.901,4.402 -0.573,1.356 -1.360,2.580 -2.386,3.606 -1.026,1.026 -2.249,1.865 -3.606,2.439 -1.357,0.573 -2.889,0.901 -4.454,0.901 -1.566,0 -3.044,-0.327 -4.402,-0.901 -1.357,-0.573 -2.580,-1.413 -3.606,-2.439 -1.026,-1.026 -1.865,-2.249 -2.439,-3.606 -0.573,-1.357 -0.848,-2.835 -0.848,-4.402 0,-1.565 0.274,-3.097 0.848,-4.454 0.573,-1.356 1.413,-2.580 2.439,-3.606 0.799,-0.799 1.802,-1.323 2.810,-1.856 z"/>
		<path fill="#bdbdbd" d="m 293.043,154.646 c 7.697,10.609 5.282,18.591 13.734,21.941 8.183,3.003 49.538,1.829 91.592,13.430 42.054,11.601 62.484,29.843 73.137,44.167 -39.433,-4.707 -121.759,1.650 -163.605,14.911 -29.490,9.344 -46.157,17.912 -47.688,11.273 -5.086,-22.044 21.377,-64.357 10.056,-82.041 13.320,5.626 22.496,-8.809 22.773,-23.682 z"/>
		<path fill="#bdbdbd" d="m 252.823,244.702 c 0,0 -6.738,14.355 -1.757,22.265 4.980,7.910 11.719,7.910 45.997,-3.808 34.278,-11.718 94.630,-23.730 155.569,-23.144 -92.872,9.375 -150.588,28.418 -175.784,37.793 -25.195,9.375 -33.692,3.222 -37.207,-6.445 -3.515,-9.668 1.464,-20.215 13.183,-26.660 z"/>
		<path fill="#424242" d="m 184.476,124.839 c -20.317,0.123 -43.704,1.957 -70.218,6.205 23.730,4.101 27.843,11.985 27.843,11.985 0,0 -46.600,8.822 -87.030,34.897 13.769,-0.585 19.039,5.568 19.039,5.568 -27.015,17.561 -52.115,35.829 -73.559,55.951 -0.350,5.479 -0.530,10.979 -0.530,16.546 0,65.129 24.328,124.584 64.384,169.765 2.945,-1.927 4.826,-2.969 4.826,-2.969 -0.567,2.249 -1.113,4.423 -1.591,6.576 12.673,13.764 26.819,26.135 42.215,36.859 6.717,-5.355 11.508,-8.432 11.508,-8.432 0,0 1.328,6.212 1.803,17.077 8.660,5.267 17.646,10.037 26.941,14.266 1.963,-7.123 2.121,-11.190 2.121,-11.190 0,0 2.601,5.138 5.038,14.319 5.417,2.267 10.894,4.307 16.493,6.205 2.389,-34.398 -11.350,-60.627 -2.704,-113.441 0,0 -17.965,39.556 -33.836,48.686 -8.563,-42.172 0.275,-138.696 109.146,-213.837 -39.543,7.683 -72.800,-29.432 -122.404,-13.682 48.683,-27.967 71.675,-40.149 105.858,-42.428 34.181,-2.278 40.860,8.601 48.686,4.932 7.446,-3.491 8.511,-13.580 5.250,-19.676 -5.216,-9.750 -38.329,-24.553 -99.281,-24.184 z"/>
		<path fill="#616161" d="m 228.230,141.068 c -41.563,-0.503 -100.410,9.013 -142.664,34.791 17.259,-0.271 20.789,6.098 20.789,6.098 0,0 -60.895,41.267 -89.841,72.498 19.887,-9.115 37.814,-6.205 37.814,-6.205 -21.826,17.027 -38.307,33.394 -50.913,49.587 3.513,21.370 9.679,41.855 18.138,61.096 12.125,-8.034 19.941,-10.395 19.941,-10.394 -4.963,9.072 -8.925,17.990 -12.039,26.729 7.970,15.109 17.393,29.295 28.108,42.428 19.909,-14.352 38.397,-21.161 38.397,-21.161 -4.648,14.157 -8.835,32.514 -10.235,50.595 5.039,4.493 10.259,8.799 15.645,12.887 4.632,-3.835 10.164,-7.791 17.660,-12.993 -19.643,-94.297 58.059,-195.871 106.176,-220.573 -28.759,2.568 -83.798,-45.836 -141.444,15.009 27.436,-40.613 71.503,-71.068 122.352,-82.999 47.876,-11.234 66.440,10.328 71.809,-1.007 4.525,-9.554 -17.367,-15.996 -49.693,-16.387 z"/>
		<path fill="#b71c1c" d="M 246.368,219.878 C 137.497,295.019 128.659,391.543 137.222,433.716 c 15.870,-9.130 33.836,-48.686 33.836,-48.686 7.177,-47.826 8.717,-102.108 75.309,-165.151 z"/>
	</g>
	<g id="headset">
		<path fill="#898989" d="M 141.843 163.937 C 107.519 163.937 79.687 191.769 79.687 226.093 C 79.687 260.417 107.519 288.25 141.843 288.25 C 176.167 288.25 204 260.417 204 226.093 C 204 191.769 176.167 163.937 141.843 163.937 z"/>
		<path fill="#4c4c4c" d="m 131.588,243.785 c 0,0 61.492,62.914 219.803,57.283 6.707,-12.387 2.003,-10.691 2.003,-10.691 0,0 -129.997,2.875 -194.658,-77.476 -31.787,3.061 -27.148,30.884 -27.148,30.884 z"/>
		<path fill="#b5b5b5" d="M 353.843 282.375 C 346.217 282.375 340.031 288.561 340.031 296.187 C 340.031 303.813 346.217 310 353.843 310 C 361.469 310 367.656 303.813 367.656 296.187 C 367.656 288.561 361.469 282.375 353.843 282.375 z"/>
		<path fill="#303030" d="m 95.155,108.301 c -14.059,0 -25.456,11.397 -25.456,25.456 0,4.140 1.004,8.000 2.757,11.455 l 0.265,0.530 c 0.025,0.047 0.027,0.112 0.052,0.159 l 46.352,91.697 45.451,-23.017 -46.670,-92.334 -0.052,0 c -4.202,-8.275 -12.782,-13.948 -22.699,-13.948 z"/>
		<path fill="#303030" d="M 141.843 192.062 C 123.053 192.062 107.812 207.303 107.812 226.093 C 107.812 244.884 123.053 260.125 141.843 260.125 C 160.634 260.125 175.875 244.884 175.875 226.093 C 175.875 207.303 160.634 192.062 141.843 192.062 z"/>
	</g>
</svg>`,
    hex: "#000000",
  },
  {
    slug: "maybe",
    svg: /* svg */ `<svg role="img" viewBox="0 0 38 26" xmlns="http://www.w3.org/2000/svg"><path d="M30.827 24h5.224a2.24 2.24 0 0 0 2.241-2.238 2.24 2.24 0 0 0-2.24-2.239h-5.225a2.24 2.24 0 0 0-2.241 2.239A2.24 2.24 0 0 0 30.826 24zM7.465 24H2.241A2.24 2.24 0 0 1 0 21.762a2.24 2.24 0 0 1 2.24-2.239h5.225a2.24 2.24 0 1 1 0 4.477zm13.792-.014h-4.253a2.24 2.24 0 1 1 0-4.477h4.253a2.24 2.24 0 1 1 0 4.477z"/><path d="M28.796 17.558h5.03a2.24 2.24 0 1 0 0-4.477h-5.03a2.24 2.24 0 1 0 0 4.477zm-19.387 0H4.38a2.24 2.24 0 1 1 0-4.477h5.03a2.24 2.24 0 1 1 0 4.477zm13.466-.014h-7.486a2.24 2.24 0 0 1-2.24-2.239 2.24 2.24 0 0 1 2.24-2.239h7.486a2.24 2.24 0 0 1 0 4.477z"/><path d="M22.657 10.92h8.94a2.24 2.24 0 1 0 0-4.477h-8.94a2.24 2.24 0 1 0 0 4.477zm-6.497 0H6.608a2.24 2.24 0 1 1 0-4.477h9.552a2.24 2.24 0 1 1 0 4.477z"/><path d="M29.448 4.477h-5.041a2.24 2.24 0 0 1-2.241-2.238A2.24 2.24 0 0 1 24.407 0h5.041a2.24 2.24 0 1 1 0 4.477zm-15.656 0H8.751A2.24 2.24 0 1 1 8.75 0h5.041a2.24 2.24 0 1 1 0 4.477z"/></svg>`,
    hex: "#141414",
  },
  {
    slug: "microsoft",
    svg: /* svg */ `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Microsoft</title><rect width="10" height="10" x="2" y="2"></rect><rect width="10" height="10" x="14" y="2"></rect><rect width="10" height="10" x="2" y="14"></rect><rect width="10" height="10" x="14" y="14"></rect></svg>`,
    hex: "#00A3EE",
  },
  {
    slug: "openwebui",
    svg: /* svg */ `<svg role="img" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.dev/svgjs" viewBox="0 0 500 500"><image width="500" height="500" xlink:href="data:image/png;base64,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"></image><style>@media (prefers-color-scheme: light) { :root { filter: none; } }
@media (prefers-color-scheme: dark) { :root { filter: none; } }
</style></svg>`,
    hex: "#000000",
  },
  {
    slug: "quay",
    svg: /* svg */ `
      <svg role="img" xmlns:svg="http://www.w3.org/2000/svg" viewBox="4 4 32 32">
        <defs>
          <mask id="logo-mask">
            <polygon points="59.608,49.99 74.668,81.859 61.838,81.859 46.789,49.99 61.838,18.14 74.668,18.14" fill="#FFFD" />
            <polygon points="74.668,81.859 89.718,49.99 74.668,18.14 68.258,31.7 76.898,49.99 68.258,68.291" fill="#FFFA" />
            <polygon points="33.239,49.99 48.299,81.859 35.469,81.859 20.419,49.99 35.469,18.14 48.299,18.14" fill="#FFFD" />
            <polygon points="48.659,46.04 55.069,32.47 48.299,18.14 41.879,31.71" fill="#FFFA" />
            <polygon points="41.879,68.291 48.299,81.859 55.069,67.529 48.659,53.961" fill="#FFFA" />
          </mask>
        </defs>
        <g transform="matrix(0.39457959,0,0,0.39457959,1.0823681,0.10489944)" mask="url(#logo-mask)">
        <circle r="50" cy="50" cx="55.069" />
        </g>
      </svg>
    `,
    hex: "#D71E00",
  },
  {
    slug: "souin",
    svg: /* svg */ `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="10 10 80 80"><path d="M34.79 77.89Q90 70 50 50T65.21 22.11" fill="none" stroke="currentcolor" stroke-width="8" stroke-miterlimit="10" pointer-events="stroke"></path><path d="M28.85 78.74 36.21 73.64l-1.42 4.25 2.55 3.67z" fill="currentcolor" stroke="currentcolor" stroke-width="8" stroke-miterlimit="10" pointer-events="all"></path><path d="M71.15 21.26 63.79 26.36 65.21 22.11l-2.55-3.67z" fill="currentcolor" stroke="currentcolor" stroke-width="8" stroke-miterlimit="10"></path></svg>`,
    hex: "#000000",
  },
  {
    slug: "spotube",
    svg: /* svg */ `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Spotube</title><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0m.006 3.7154c3.835 0 6.977 3.022 7.2155 6.8115.7108.3548 1.1927 1.1006 1.1927 1.951v3.3496c0 1.1845-.945 2.1714-2.118 2.1714h-1.2854a.4973.4966 0 0 1-.4973-.4965V11.123c-.006-.0395-.0126-.0747-.0126-.1369 0-2.504-2.0145-4.5288-4.495-4.5288-2.481 0-4.4956 2.0249-4.4956 4.5288 0 .0668-.005.088-.009.1105v6.4058a.4973.4966 0 0 1-.4972.4965H5.7186c-1.1737 0-2.1187-.9873-2.1187-2.1714v-3.349c0-.8494.4803-1.5947 1.19-1.9498.2376-3.7908 3.3802-6.8134 7.2162-6.8134zm0 .993c-3.412 0-6.187 2.7536-6.2442 6.1714a.4973.4966 0 0 1-.354.4672c-.461.1384-.8135.583-.8135 1.1315v3.349c0 .665.5067 1.1783 1.1242 1.1783h.7882v-5.9266a.4973.4966 0 0 1 .003-.0564c.006-.053.006-.064.006-.0367 0-3.0383 2.4654-5.522 5.49-5.522 3.0243 0 5.4896 2.4837 5.4896 5.522 0-.006.0004.009.007.0486a.4973.4966 0 0 1 .006.0758v5.8953h.7883c.6166 0 1.1235-.5126 1.1235-1.1783v-3.3497c0-.5484-.354-.9939-.816-1.1322a.4973.4966 0 0 1-.3543-.4672c-.0577-3.4168-2.8325-6.17-6.2434-6.17Zm-2.9961 5.9417c.4683 0 .8537.385.8537.8526v5.4101c0 .468-.3858.8526-.8537.8526-.4682 0-.8538-.3848-.8538-.8526v-5.41c0-.4676.3854-.8527.8538-.8527m6.0621 0c.4683 0 .8537.385.8537.8526v5.4101c0 .468-.3858.8526-.8537.8526-.4682 0-.8537-.3848-.8537-.8526v-5.41c0-.4676.3853-.8527.8537-.8527m-6.0621.5392c-.1772 0-.3138.1366-.3138.3134v5.4101c0 .1773.1364.3134.3138.3134.1765 0 .3137-.1364.3137-.3134v-5.41c0-.1762-.1375-.3135-.3137-.3135m6.0621 0c-.1772 0-.3139.1366-.3139.3134v5.4101c0 .1773.1365.3134.3139.3134.1766 0 .3138-.1364.3138-.3134v-5.41c0-.1762-.1376-.3135-.3138-.3135"/></svg>`,
    hex: "#3B82F6",
  },
  {
    slug: "stirling-pdf",
    svg: /* svg */ `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Stirling-PDF</title><path d="M16.849.001a1.485 1.485 0 0 0-.342.034L4.225 2.742a2.711 2.711 0 0 0-2.13 2.65v15.6a2.18 2.18 0 0 0 1.921 2.166L10.46 24l.05-.049 11.397-11.506-.101-9.221a1.474 1.474 0 0 0-1.793-1.426l-.281.062-.021.003-1.425.31.007-.678A1.475 1.475 0 0 0 16.848 0zM11.52 4.975c.783.018 1.638.154 2.367.546L13.8 9.962h-.468s-1.101-1.432-1.915-1.821c-.518-.245-1.288-.338-1.893-.036-.893.446-.986 1.699-.166 2.196.195.122.454.223.792.302 1.815.418 4.81 1.281 4.442 4.759 0 0-.209 3.26-3.643 3.635a5.445 5.445 0 0 1-1.807-.115c-.813-.18-2.253-.547-2.958-.986l-.13-3.722H6.4s.684 1.655 2.627 2.455a2.2 2.2 0 0 0 1.138.144c.482-.072 1.05-.332 1.281-1.116 0 0 .389-1.145-1.627-1.771-1.612-.504-3.131-1.022-3.758-2.721a4.472 4.472 0 0 1-.144-2.556c.267-1.116 1.03-2.685 3.19-3.362 0 0 1.107-.3 2.413-.272z"/></svg>`,
    hex: "#C02223",
  },
  {
    slug: "tooljet",
    svg: /* svg */ `<svg role="img" xmlns="http://www.w3.org/2000/svg" width="738" height="120" viewBox="0 0 150 120"><title>Tooljet</title><path d="M149.256 71.671L134.789 92.381L132.654 95.421L120.322 113.067V113.091L116.053 119.171H58.1367L62.4057 113.067L74.762 95.421H103.696L105.831 92.381L120.322 71.671L105.831 50.961L103.696 47.921H79.0073L91.3636 30.2748V30.251L95.6326 24.171H116.053L120.322 30.251V30.2748L132.654 47.921L134.789 50.961L149.256 71.671Z"/><path d="M62.4057 71.671L47.9386 92.381L45.8041 95.421L29.2025 119.171H0.244568L16.8462 95.421L33.4478 71.671L16.8462 47.921L0.244568 24.171H29.2025L45.8041 47.921L47.9386 50.961L62.4057 71.671Z"/></svg>`,
    hex: "#2563eb",
  },
  {
    slug: "wps-office",
    svg: /* svg */ `<svg role="img" viewBox="0 0 34 24" xmlns="http://www.w3.org/2000/svg"><path d="M16.6898 1.62434L16.9892 2.32936C17.0174 2.39582 17.0175 2.47088 16.9894 2.53739L15.2764 6.59147C15.185 6.80773 14.8789 6.8089 14.7859 6.59334L13.7362 4.161C13.694 4.06328 13.5977 4 13.4913 4H6.09986C5.90961 4 5.78056 4.19351 5.85368 4.36915L11.7544 18.5433C11.8454 18.762 12.1552 18.7622 12.2466 18.5436L19.3151 1.63798C19.7299 0.645877 20.7001 0 21.7754 0H32.0051C33.9067 0 35.1972 1.93328 34.4679 3.68939L26.7502 22.2739C26.3162 23.3189 25.2958 24 24.1643 24H23.9033C22.7713 24 21.7506 23.3184 21.3169 22.2727L19.0756 16.8686C19.0485 16.8033 19.0485 16.73 19.0754 16.6647L20.757 12.589C20.8472 12.3702 21.1565 12.3687 21.249 12.5865L23.7533 18.4856C23.8455 18.7026 24.1533 18.7021 24.2446 18.4847L30.1778 4.37C30.2517 4.19425 30.1226 4 29.932 4H22.5444C22.4368 4 22.3397 4.06473 22.2983 4.1641L14.7513 22.2769C14.3165 23.3203 13.297 24 12.1667 24H11.8976C10.7685 24 9.74979 23.3218 9.31427 22.28L1.54481 3.69522C0.810333 1.93834 2.1009 0 4.00513 0H14.2353C15.3052 0 16.2716 0.639506 16.6898 1.62434Z" />
</svg>`,
    hex: "#ff3313",
  },
];

/**
 * Extended icon collection
 * @param slug
 * @returns
 */
export const iconOf = (slug?: string) => {
  return icons.find((icon) => icon.slug === slug);
};
