# Interactive pages in writing — PNG preview and Dissolve

## Reusable authoring tool

Use **Insert interactive page** in the TipTap toolbar. Choose System/Loom as a preset, or **Another interactive page** and supply:

- A published HTML URL under `https://www.crossroads.place/artifacts/` (a relative `/artifacts/...html` path works too).
- Its public HTTPS PNG preview URL. The matching sibling `.png` URL is suggested automatically; it can be edited.
- A descriptive page title.

Insertion occurs at the end of a selection, preserving selected manuscript text. Normal editor autosave persists an ordinary `image` node with `src`, `alt`, `interactivePageUrl`, and `interactivePageTitle`. Existing `topologyId` previews remain supported. The solo and collaborative image extension preserves these attributes through JSON and HTML. Other readers/exports retain the image fallback. Ordinary images stay ordinary images.

Only published artifact HTML can become a frame source; arbitrary third-party websites, local `file:` URLs, and private app routes are rejected. This is a general writing tool, not a map-specific renderer. No backend models, migrations, uploads, or runtime screenshot service.

## Reader Dissolve

Public individual articles and the continuous Issue reader wrap their manuscript in `TopologyReadingSurface`:

- Preview width is 60% on desktop and 100% on small screens.
- Clicking it fades the reading area into a wider interactive page; group navigation and the Issue strip stay outside the changed area.
- The original back-link locale becomes **Return to article** (or **Return to Issue**), with a separate standalone-page link.
- The manuscript remains mounted but hidden/inert. Return, Escape, or browser Back restores its recorded scroll position and focused preview.
- History gets an `interactivePage` query parameter; Forward and direct shared reading URLs work. Unrelated query parameters and fragments are preserved.
- The iframe uses the same-origin `/artifacts/` URL and fills the available viewport below the reader controls. Native Escape handling works for ordinary HTML without adding special JavaScript. The topology kit's existing close signal is also checked against the expected frame/window origin.
- Reduced motion skips the fade delay. There is no floating dialog or overlay. Outside these public reading surfaces, a preview opens its standalone HTML in a new tab. No iframe-policy configuration change was made.

## Static PNG workflow

When an artifact is stable, render the PNG and commit/deploy it alongside the HTML and any shared kit changes. From `release/`:

```bash
puddlejump/zz/html-to-png.sh \
  mixtape-release-frontend/apps/crossroads/public/artifacts/system/system-topology.html \
  --topology --force
```

The sibling PNG is generated once as a reviewed publishing asset; it is not generated or cached on a reader's first request. Regenerate it when the source HTML/data/styles change. The PNG URL and HTML URL stay usable independently of the article. `--topology` now expands the capture viewport for taller maps to avoid clipping their bottom layers. The System PNG was regenerated with that fix and visually checked.

## Verification — 2026-10-14

- Scoped frontend ESLint and Mixtape/Crossroads TypeScript (`--noEmit --incremental false`): passed. Shared-package ESLint reports the config's generic missing-pages-directory notice, with no source errors.
- Browser fixtures import actual authoring controls, image extension, shared reader/Dissolve components, and the actual continuous Issue reader. Static artifact requests are fulfilled locally, not fetched from Live.
- `/tmp/gp10-issue-check/dissolve-check.cjs`: passed retaining chrome; hiding without unmounting; readable frame width/height; iframe Escape and Return; exact URL/scroll/focus restoration; Back/Forward; direct links; ignored unrelated close messages; mobile/reduced-motion Issue reading; no runtime errors.
- `/tmp/gp10-issue-check/interactive-page-check.cjs`: passed a custom non-topology HTML lesson with its own styles and interaction; suggested PNG/title authoring; JSON/HTML round trip; CSS isolation; Escape without kit JS; reading-position restoration; invalid URLs rejected; custom deep link return; no runtime errors.
- Earlier topology checks also covered preset insertion, selected text preservation, ordinary-image fallback, image widths, and map interaction. The floating modal has since been replaced by Dissolve.
- `puddlejump/zz/html-to-png.sh`: shell syntax and full System topology capture passed after the tall-map fix.
- These fixtures do not verify authenticated autosave, Yjs synchronization, or production headers. No backend test suite was needed.

## Live check

Deploy the editor/reader code, HTML/PNG assets, and any changed topology kit together; no migration. Insert a page in a real WritingPiece, save/reload, then check its public article and Read Issue. Verify Return/Escape/Back restore the reading position and the standalone link opens the same interactive page. Confirm deployed headers allow the same-origin artifact frame.
