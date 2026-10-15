import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared Dissolve primitive (decisions/dissolve-outer-rim-adr).
 * Fades out, swaps content, fades in — preserving continuous presence
 * instead of a hard navigation cut. 150ms is canon (OQ-1); respects
 * prefers-reduced-motion by collapsing to an instant (0ms) swap.
 *
 * API is keyed by `regionKey` so a later Phase 2 (persistent, route-
 * surviving shell) can address a specific Dissolve region without a
 * breaking change to this hook's shape.
 */

export const DISSOLVE_DURATION_MS = 150;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export interface UseDissolveOptions {
  /** Identifies this Dissolve region; reserved for Phase 2 (persistent shell). Not used by Phase 1. */
  regionKey?: string;
  /** Override the canonical 150ms duration. Avoid unless there's a documented reason. */
  durationMs?: number;
}

export interface UseDissolveResult {
  /** True while the fade-out is in progress; swap content/state when this flips back to false inside `dissolveTo`'s callback. */
  dissolving: boolean;
  /** CSS duration string for the consumer's own transition rule, honoring reduced motion. */
  transitionDuration: string;
  /** Fades out, runs `swap` at the midpoint, then fades back in. */
  dissolveTo: (swap: () => void) => void;
}

export function useDissolve(options: UseDissolveOptions = {}): UseDissolveResult {
  const { durationMs = DISSOLVE_DURATION_MS } = options;
  const reducedMotion = usePrefersReducedMotion();
  const [dissolving, setDissolving] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const effectiveDuration = reducedMotion ? 0 : durationMs;

  const dissolveTo = useCallback(
    (swap: () => void) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (effectiveDuration === 0) {
        swap();
        return;
      }
      setDissolving(true);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        swap();
        setDissolving(false);
      }, effectiveDuration);
    },
    [effectiveDuration]
  );

  return {
    dissolving,
    transitionDuration: `${effectiveDuration}ms`,
    dissolveTo,
  };
}
