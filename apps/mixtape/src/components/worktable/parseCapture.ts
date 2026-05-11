// parseCapture.ts — parse helpers for WorkTable command field

// ---------------------------------------------------------------------------
// "We need" multi-item splitter
// ---------------------------------------------------------------------------

const STRIP_PREFIXES = [
  /^we need more\s+/i,
  /^we need\s+/i,
  /^need more\s+/i,
  /^need\s+/i,
  /^and\s+/i,
];

function stripLeadingPrefixes(s: string): string {
  let out = s.trim();
  for (const re of STRIP_PREFIXES) {
    out = out.replace(re, "").trim();
  }
  return out.replace(/\.$/, "").trim();
}

export function parseNeedMoreItems(raw: string): string[] {
  // Strip the global lead prefix once
  let text = raw.trim();
  for (const re of STRIP_PREFIXES) {
    const stripped = text.replace(re, "").trim();
    if (stripped !== text) { text = stripped; break; }
  }

  const items: string[] = [];

  // Split on newlines first
  for (const line of text.split(/\n+/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Split each line on commas
    for (const commaPart of trimmedLine.split(/,/)) {
      const trimmedComma = commaPart.trim();
      if (!trimmedComma) continue;

      // Split on " and " within the comma chunk
      for (const andPart of trimmedComma.split(/\s+and\s+/i)) {
        const item = stripLeadingPrefixes(andPart);
        if (item) items.push(item);
      }
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Reminder date parser
// ---------------------------------------------------------------------------

const WEEKDAYS = [
  "sunday","monday","tuesday","wednesday","thursday","friday","saturday",
] as const;

function nextWeekday(dayIndex: number): Date {
  const now = new Date();
  const current = now.getDay();
  let delta = dayIndex - current;
  if (delta <= 0) delta += 7;
  const result = new Date(now);
  result.setDate(now.getDate() + delta);
  result.setHours(9, 0, 0, 0);
  return result;
}

export function parseRemindAt(text: string): Date | null {
  const lower = text.toLowerCase();

  if (/\btoday\b/.test(lower)) {
    const d = new Date();
    d.setHours(17, 0, 0, 0);
    return d;
  }

  if (/\btomorrow\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  if (/\bnext\s+week\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  for (let i = 0; i < WEEKDAYS.length; i++) {
    if (new RegExp(`\\b(on\\s+)?${WEEKDAYS[i]}\\b`).test(lower)) {
      return nextWeekday(i);
    }
  }

  return null;
}

export function formatRemindPreview(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
