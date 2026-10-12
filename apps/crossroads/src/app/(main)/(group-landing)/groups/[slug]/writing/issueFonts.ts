import localFont from "next/font/local";

export const heading = localFont({
  src: "./fonts/dm-serif-display-latin-400-normal.woff2",
  weight: "400",
  variable: "--issue-font-heading",
  display: "swap",
});
export const body = localFont({
  src: [
    { path: "./fonts/inter-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/inter-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/inter-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--issue-font-body",
  display: "swap",
});
export const mono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/ibm-plex-mono-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--issue-font-mono",
  display: "swap",
});

