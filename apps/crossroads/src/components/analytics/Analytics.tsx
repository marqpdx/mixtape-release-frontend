"use client";

import Script from "next/script";

const UMAMI_SRC =
  process.env.NEXT_PUBLIC_UMAMI_SRC ||
  (process.env.NEXT_PUBLIC_UMAMI_HOST
    ? `${process.env.NEXT_PUBLIC_UMAMI_HOST.replace(/\/$/, "")}/script.js`
    : "");
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "";

export function Analytics() {
  if (!UMAMI_SRC || !UMAMI_WEBSITE_ID) {
    return null;
  }

  return (
    <Script
      id="umami-analytics"
      src={UMAMI_SRC}
      strategy="afterInteractive"
      data-website-id={UMAMI_WEBSITE_ID}
    />
  );
}

export default Analytics;
