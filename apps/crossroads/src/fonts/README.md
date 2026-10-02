# Crossroads fonts

Crossroads bundles its Google Fonts choices as local WOFF2 files. Do not add
`next/font/google` to this app: it downloads font CSS and binaries during
`next build`, so an intermittent upstream/network error can fail a deployment.
Use `next/font/local` instead. Next still serves the files from its own static
assets and generates the font CSS.

## Current inventory

- `src/app/layout.tsx`: nine site-wide families. Keep the existing
  `--font-*` variables because the font switcher and stored preference use them.
- `src/app/(main)/(group-landing)/groups/[slug]/fonts.ts`: ten group families.
  Keep the `tenantFontMap` keys because group presentation settings store
  those `font_id` values.
- Each family directory contains its WOFF2 files and upstream `OFL.txt`.
  `SHA256SUMS` records the exact bundled binaries.

These files are the Latin WOFF2 faces emitted by Crossroads' existing
`next/font/google` build with Next.js 15.5.7. They preserve the previously
requested weights and normal/italic styles. The licenses were retrieved from
`https://github.com/google/fonts/tree/main/ofl/<family>/OFL.txt` at migration
time. The files are not copied from an OS font installation, and Vercel does
not need to contact Google to rebuild them. Other scripts use browser fallback
fonts; add the required subset files deliberately if the site expands beyond
Latin text.

## Adding or updating a font

1. Obtain the approved WOFF2 files from the font's official distribution (or
   the WOFF2 URLs in Google Fonts' CSS response). Pin the exact files in a
   new family directory here. Include the matching upstream license and
   attribution; check its terms before committing. Prefer a variable WOFF2
   when it covers every weight used by the UI.
2. Declare it at module scope with `next/font/local` in the appropriate font
   definition file. Specify every used weight and style; a variable file can
   use a range such as `weight: "400 600"`. Keep `display: "swap"`. Preload
   defaults, but use `preload: false` for optional choices so every page does
   not preload the whole menu.
3. Add the option to the switcher or `tenantFontMap` without changing existing
   IDs or CSS variable names. Update `SHA256SUMS` with
   `shasum -a 256 <font-file>` and the path relative to this directory.
4. Run `yarn lint` and `yarn build` from this app, preferably with network
   access unavailable. Inspect the default and alternative fonts, including
   italic, heavier text, and group display titles. Check the build log for
   any `next/font/google` fetch or `fonts.googleapis.com` request.

Do not use CSS `@import` or a Google Fonts `<link>` as a workaround: that
merely moves the external dependency to each visitor's browser.
