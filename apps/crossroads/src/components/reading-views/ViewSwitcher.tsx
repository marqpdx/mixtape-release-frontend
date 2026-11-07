// apps/crossroads/src/components/reading-views/ViewSwitcher.tsx
//
// A quiet text line, "View: Editorial · Index · Cards", that changes the
// reading view at once, remembers it, and keeps the reader's place. Below
// 640px it folds into one button ("View: Editorial ▾") over a short menu.
// A radiogroup: arrow keys move and select; each change is announced.
// No crossfade: a dissolve between layouts reads as a stutter.
//
// Colours come from the host section: --rv-ink, --rv-muted, --rv-raised, --rv-rule.

"use client";

import { Fragment, useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { READING_ANCHOR, readReadingView, setReadingView, type ReadingViewConfig } from "./readingViews";
import styles from "./ViewSwitcher.module.css";

function nearestAnchor(): { el: Element; top: number } | null {
  let best: { el: Element; top: number } | null = null;
  // Marked entries, plus every heading in the page's main content (rendered prose included).
  for (const el of Array.from(document.querySelectorAll(`[${READING_ANCHOR}], main :is(h1, h2, h3, h4)`))) {
    if (el.getClientRects().length === 0) continue;
    const top = el.getBoundingClientRect().top;
    if (!best || Math.abs(top) < Math.abs(best.top)) best = { el, top };
  }
  return best;
}

export function ViewSwitcher({ config, label = "Reading view" }: { config: ReadingViewConfig; label?: string }) {
  const [current, setCurrent] = useState(config.defaultView);
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const groupId = useId();

  // The <head> bootstrap has already set the view; mirror it.
  useEffect(() => setCurrent(readReadingView(config)), [config]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const choose = useCallback(
    (id: string) => {
      const view = config.views.find((v) => v.id === id);
      if (!view) return;
      if (id !== readReadingView(config)) {
        // Keep the reader's place: the heading or entry nearest the top of the
        // viewport sits at the same offset after the new layout renders.
        const anchor = window.scrollY > 0 ? nearestAnchor() : null;
        setReadingView(config, id);
        if (anchor) {
          const delta = anchor.el.getBoundingClientRect().top - anchor.top;
          if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: "instant" });
        }
        setAnnouncement(`${label}: ${view.label}`);
      }
      setCurrent(id);
    },
    [config, label]
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const n = config.views.length;
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (event.key === "Escape" && open) {
      setOpen(false);
      toggleRef.current?.focus();
      return;
    }
    if (event.key === "Home" || event.key === "End" || step !== 0) {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? n - 1 : (index + step + n) % n;
      choose(config.views[next].id);
      optionRefs.current[next]?.focus();
    }
  };

  // The current option and the phone label follow the <html> attribute in
  // CSS, so they are right on first paint, before hydration sets aria-checked.
  const firstPaint = config.views
    .map((view) => {
      const scope = `html[${config.attribute}="${view.id}"] [data-rv-for="${config.attribute}"]`;
      return (
        `${scope} [data-rv-option="${view.id}"]{color:var(--rv-ink,currentColor);font-weight:600;cursor:default}` +
        `${scope} [data-rv-option="${view.id}"]:hover>span:first-child{text-decoration:none}` +
        `${scope} [data-rv-label="${view.id}"]{display:inline}`
      );
    })
    .join("");

  return (
    <div ref={rootRef} className={styles.switcher} data-open={open || undefined} data-rv-for={config.attribute}>
      <style>{firstPaint}</style>
      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={groupId}
        onClick={() => setOpen((value) => !value)}
      >
        View:{" "}
        {config.views.map((view) => (
          <span key={view.id} className={styles.current} data-rv-label={view.id}>
            {view.label}
          </span>
        ))}
        <span aria-hidden="true" className={styles.caret}>
          ▾
        </span>
      </button>
      <div id={groupId} role="radiogroup" aria-label={label} className={styles.group}>
        <span className={styles.prefix} aria-hidden="true">
          View:
        </span>
        {config.views.map((view, i) => {
          const checked = view.id === current;
          return (
            <Fragment key={view.id}>
              {i > 0 && (
                <span className={styles.sep} aria-hidden="true">
                  ·
                </span>
              )}
              <button
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-describedby={`${groupId}-${view.id}`}
                tabIndex={checked ? 0 : -1}
                className={styles.option}
                data-rv-option={view.id}
                onClick={() => {
                  choose(view.id);
                  if (open) {
                    setOpen(false);
                    toggleRef.current?.focus();
                  }
                }}
                onKeyDown={(event) => onKeyDown(event, i)}
              >
                <span className={styles.label}>{view.label}</span>
                <span id={`${groupId}-${view.id}`} className={styles.desc}>
                  {view.description}
                </span>
              </button>
            </Fragment>
          );
        })}
      </div>
      <span role="status" aria-live="polite" className={styles.srOnly}>
        {announcement}
      </span>
    </div>
  );
}
