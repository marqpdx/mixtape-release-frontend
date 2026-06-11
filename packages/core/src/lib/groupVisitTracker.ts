const STORAGE_KEY = "mx:group-visits";

export function recordGroupVisit(slug: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const visits: Record<string, number> = raw ? JSON.parse(raw) : {};
    visits[slug] = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
  } catch {
    // ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

export function getGroupVisitTimes(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
