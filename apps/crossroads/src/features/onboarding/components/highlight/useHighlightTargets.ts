"use client";

export interface HighlightTarget {
  key: string;
  heading: string;
  copy: string;
}

export const HIGHLIGHT_TARGETS: HighlightTarget[] = [
  {
    key: "group-feed",
    heading: "The Feed",
    copy: "This is where group activity lives — posts, updates, and conversations.",
  },
  {
    key: "group-events",
    heading: "Events",
    copy: "Find upcoming gatherings, workshops, and sessions here.",
  },
  {
    key: "group-members",
    heading: "Members",
    copy: "See who else is in this group and explore their profiles.",
  },
  {
    key: "sidebar-nav",
    heading: "Getting around",
    copy: "Use the sidebar to move between your groups and the rest of Mixtape.",
  },
];

/**
 * Resolve a data-tour target element in the DOM.
 * Returns null if not found — callers should skip that stop gracefully.
 */
export function resolveTarget(key: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(`[data-tour="${key}"]`);
}
