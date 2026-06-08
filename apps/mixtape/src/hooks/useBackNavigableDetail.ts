// apps/mixtape/src/hooks/useBackNavigableDetail.ts

"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseBackNavigableDetailOptions {
  /** True while the detail view is showing (vs. the list it was opened from). */
  isOpen: boolean;
  /** Return to the list. Called on browser-back, Escape, and programmatic exit. */
  onClose: () => void;
  /** Unique key tagging this panel's synthetic history entry, e.g. "memberPanel". */
  tagKey: string;
}

interface UseBackNavigableDetailResult {
  /** Wrap the action that opens a detail view: pushes a synthetic history entry first. */
  enter: (openAction: () => void) => void;
  /** Return to the list — goes through history.back() when we own a pushed entry. */
  exit: () => void;
}

/**
 * Makes a list → detail transition within a work area respond to the browser's
 * back button (and Escape) by returning to the list, instead of leaving the page.
 *
 * Pushes a tagged, same-URL history entry on `enter`; a popstate without that
 * tag collapses the detail view via `onClose`. The `pushedHistoryRef` guard
 * distinguishes "our" synthetic entry from real navigation so back/exit never loop.
 */
export function useBackNavigableDetail({
  isOpen,
  onClose,
  tagKey,
}: UseBackNavigableDetailOptions): UseBackNavigableDetailResult {
  const pushedHistoryRef = useRef(false);

  const enter = useCallback(
    (openAction: () => void) => {
      history.pushState({ [tagKey]: true }, "");
      pushedHistoryRef.current = true;
      openAction();
    },
    [tagKey]
  );

  const exit = useCallback(() => {
    if (pushedHistoryRef.current) {
      // Leave the ref set — the popstate handler below clears it and calls
      // onClose once the synthetic entry actually pops. Clearing it here first
      // makes the handler's guard fail, so the resulting popstate is ignored
      // and onClose only fires on a *second* exit() call.
      history.back();
    } else {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (!(e.state as Record<string, unknown> | null)?.[tagKey] && pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        onClose();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [tagKey, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, exit]);

  return { enter, exit };
}
