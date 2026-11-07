// apps/crossroads/src/components/reading-views/readingViews.ts
//
// Reader-selectable reading views for a long-form section (Working Papers
// first; built for reuse). A view is an attribute on <html>; the section's
// CSS keys its layout and type off it, so the choice applies before first
// paint on static pages, with no cookie and no per-request render.
//
//   bootstrap (in <head>)  ?<param>= for this visit only, else the saved choice
//   setReadingView()       on a switch: set the attribute, save the choice
//
// Spec: Puddlejump zz/spec-working-papers-reading-views.md (and its Headnote).

/** Elements a switch keeps in place: headings and entries carry this attribute. */
export const READING_ANCHOR = "data-reading-anchor";

export type ReadingView = {
  id: string;
  /** Visible label in the switcher. */
  label: string;
  /** One line, shown as a hover tip and in the phone menu. */
  description: string;
};

export type ReadingViewConfig = {
  /** Attribute set on <html>, e.g. "data-wp-view". */
  attribute: string;
  /** localStorage key for the reader's saved choice. */
  storageKey: string;
  /** URL parameter that overrides the saved choice for one visit. */
  param: string;
  views: readonly ReadingView[];
  defaultView: string;
};

/** Inline script for <head>: sets the attribute before the body paints. */
export function getReadingViewBootstrapScript(config: ReadingViewConfig): string {
  const ids = JSON.stringify(config.views.map((view) => view.id));
  return `
    (function () {
      try {
        var ids = ${ids};
        var fromUrl = new URLSearchParams(window.location.search).get(${JSON.stringify(config.param)});
        var saved = null;
        try { saved = window.localStorage.getItem(${JSON.stringify(config.storageKey)}); } catch (_) {}
        var view = ids.indexOf(fromUrl) >= 0 ? fromUrl : ids.indexOf(saved) >= 0 ? saved : ${JSON.stringify(config.defaultView)};
        document.documentElement.setAttribute(${JSON.stringify(config.attribute)}, view);
      } catch (_) {}
    })();
  `;
}

export function readReadingView(config: ReadingViewConfig): string {
  if (typeof document === "undefined") return config.defaultView;
  const current = document.documentElement.getAttribute(config.attribute);
  return config.views.some((view) => view.id === current) ? (current as string) : config.defaultView;
}

/** Apply a reader's choice and save it. The URL parameter is never saved. */
export function setReadingView(config: ReadingViewConfig, id: string): void {
  document.documentElement.setAttribute(config.attribute, id);
  try {
    window.localStorage.setItem(config.storageKey, id);
  } catch {
    // Private windows and blocked storage: the view still applies for this page.
  }
}
