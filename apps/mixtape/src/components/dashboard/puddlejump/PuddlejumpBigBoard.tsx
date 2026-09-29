// apps/mixtape/src/components/dashboard/puddlejump/PuddlejumpBigBoard.tsx
//
// The Big Board knowledge surface: an ADR tote board + Spikes binder read
// live from the sibling puddlejump repo (see /api/puddlejump/big-board),
// plus a sketch of the "attend ticker" concept -- deliberately quiet by
// default, not yet wired to a real signal source (Keeper/ClioState).
// Colors come entirely from the active theme's CSS custom properties
// (--theme-*, set by ThemeProvider) so this reskins under any theme, not
// just "Big Board" -- except the lifecycle dots (item 6), which are
// semantic (blue/green/yellow/gray) and deliberately theme-independent.

"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Text } from "@chakra-ui/react";

type Lifecycle = "completed" | "in_progress" | "awaiting_input" | "draft";

interface AdrEntry {
  path: string;
  title: string;
  status: string;
  class: string;
  uuid: string | null;
  adrNumber: number | null;
  created: string | null;
  updated: string | null;
  summary: string | null;
  lifecycle: Lifecycle;
  timely: boolean;
}

interface SpikeEntry {
  path: string;
  title: string;
  status: string;
  class: string;
  uuid: string | null;
  created: string | null;
  updated: string | null;
  timely: boolean;
}

interface BigBoardData {
  available: boolean;
  puddlejumpPath: string | null;
  generatedAt: string;
  adrs: AdrEntry[];
  spikes: SpikeEntry[];
}

type SortKey = "recent" | "adrNumber" | "created" | "updated" | "name" | "status";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "recent", label: "Recent" },
  { key: "adrNumber", label: "ADR #" },
  { key: "created", label: "Created" },
  { key: "updated", label: "Updated" },
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
];

const LIFECYCLE_COLOR: Record<Lifecycle, string> = {
  completed: "#4C8DFF", // Blue
  in_progress: "#5FAE5F", // Green
  awaiting_input: "#E8C93D", // Yellow
  draft: "#8C8C8C", // Gray
};

const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  completed: "Completed",
  in_progress: "In progress",
  awaiting_input: "Awaiting your input",
  draft: "Draft",
};

function statusTone(status: string): "canon" | "draft" | "deferred" {
  const s = status.toLowerCase();
  if (s.includes("canon") || s.includes("ratified")) return "canon";
  if (s.includes("draft") || s.includes("proposed")) return "draft";
  return "deferred";
}

// The board shows a short glyph, not the full free-text status_label --
// real values range from "Ratified" to "Canon — Architecture Decision —
// Implemented 2026-04-21 (amended by CR-001, CR-002)". The full string
// still shows in the expanded row detail.
function shortStatusLabel(status: string): string {
  const tone = statusTone(status);
  if (tone === "canon") return "CANON";
  if (tone === "draft") return "DRAFT";
  return "OTHER";
}

function spikeTone(status: string): "open" | "resolved" | "info" {
  const s = status.toLowerCase();
  if (s.includes("resolved") || s.includes("graduated") || s.includes("→")) return "resolved";
  if (s.includes("open") || s.includes("spike —") || s.includes("investigation")) return "open";
  return "info";
}

// Header-parsed dates ("Created"/"Last Updated") already come through as
// plain "YYYY-MM-DD" -- shown as-is. The mtime fallback is a full ISO
// timestamp -- trimmed to a date for display.
function formatDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString().slice(0, 10);
}

function compareDatesDesc(a: string | null, b: string | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(b).getTime() - new Date(a).getTime();
}

function sortAdrs(entries: AdrEntry[], key: SortKey): AdrEntry[] {
  const copy = [...entries];
  switch (key) {
    case "adrNumber":
      return copy.sort((a, b) => {
        if (a.adrNumber == null && b.adrNumber == null) return 0;
        if (a.adrNumber == null) return 1;
        if (b.adrNumber == null) return -1;
        return a.adrNumber - b.adrNumber;
      });
    case "created":
      return copy.sort((a, b) => compareDatesDesc(a.created, b.created));
    case "updated":
    case "recent":
      return copy.sort((a, b) => compareDatesDesc(a.updated, b.updated));
    case "name":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "status":
      return copy.sort(
        (a, b) => statusTone(a.status).localeCompare(statusTone(b.status)) || a.status.localeCompare(b.status)
      );
    default:
      return copy;
  }
}

// A human-set "get back to this directly" flag overrides whatever sort is
// active -- it doesn't participate in the sort, it wins regardless of it.
// Array.prototype.filter is stable, so each group keeps the order the
// caller already sorted it into.
function floatTimely<T extends { timely: boolean }>(entries: T[]): T[] {
  return [...entries.filter((e) => e.timely), ...entries.filter((e) => !e.timely)];
}

export default function PuddlejumpBigBoard() {
  const [data, setData] = useState<BigBoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simmed, setSimmed] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // apps/mixtape has basePath "/app" -- Next.js prefixes router
      // navigation with it automatically but not raw fetch() calls, so try
      // the basePath-prefixed URL first (matches HelpProvider.tsx's
      // convention) and fall back for direct/unproxied access.
      const urls = ["/app/api/puddlejump/big-board", "/api/puddlejump/big-board"];
      for (const url of urls) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) continue;
          const json = (await res.json()) as BigBoardData;
          if (!cancelled) setData(json);
          return;
        } catch {
          // try the next location
        }
      }
      if (!cancelled) setError("Could not reach the Big Board data source.");
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedAdrs = useMemo(
    () => (data ? floatTimely(sortAdrs(data.adrs, sortKey)) : []),
    [data, sortKey]
  );
  const sortedSpikes = useMemo(() => (data ? floatTimely(data.spikes) : []), [data]);

  return (
    <Box className="pjbb-root">
      <style>{`
        .pjbb-root {
          font-family: "Space Mono", ui-monospace, monospace;
          color: var(--theme-text);
        }
        .pjbb-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 18px;
          align-items: start;
        }
        @media (max-width: 760px) {
          .pjbb-grid { grid-template-columns: 1fr; }
          .pjbb-binder { order: -1; }
        }
        .pjbb-panel {
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          border-radius: 3px;
        }
        .pjbb-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--theme-border);
          background: var(--theme-bg-secondary);
          border-radius: 3px 3px 0 0;
        }
        .pjbb-panel-title {
          font-family: "Oswald", sans-serif;
          font-size: 0.9rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--theme-accent);
        }
        .pjbb-panel-count {
          font-size: 0.72rem;
          color: var(--theme-text-secondary);
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .pjbb-sortbar {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .pjbb-sortbtn {
          font-family: "Space Mono", monospace;
          font-size: 0.66rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--theme-text-secondary);
          background: transparent;
          border: 1px solid var(--theme-border);
          border-radius: 2px;
          padding: 3px 8px;
          cursor: pointer;
        }
        .pjbb-sortbtn:hover { color: var(--theme-text); border-color: var(--theme-text-secondary); }
        .pjbb-sortbtn.active {
          color: var(--theme-accent-text);
          background: var(--theme-accent);
          border-color: var(--theme-accent);
        }
        .pjbb-row { border-bottom: 1px solid var(--theme-border); }
        .pjbb-row:last-child { border-bottom: none; }
        .pjbb-row summary {
          list-style: none;
          display: grid;
          grid-template-columns: 14px minmax(0, 1fr) auto 72px 18px;
          gap: 10px;
          align-items: center;
          padding: 11px 16px;
          cursor: pointer;
          font-size: 0.86rem;
        }
        .pjbb-row summary::-webkit-details-marker { display: none; }
        .pjbb-row summary:hover { background: var(--theme-accent-soft); }
        .pjbb-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pjbb-name {
          min-width: 0;
          color: var(--theme-text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pjbb-status {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-align: right;
          white-space: nowrap;
          color: var(--theme-text-secondary);
        }
        .pjbb-chev { color: var(--theme-text-muted); transition: transform 160ms ease; text-align: right; }
        .pjbb-row[open] .pjbb-chev { transform: rotate(90deg); }
        .pjbb-detail {
          padding: 4px 16px 18px 40px;
          font-size: 0.82rem;
          line-height: 1.55;
          color: var(--theme-text);
        }
        .pjbb-detail-summary {
          margin: 0 0 12px;
          color: var(--theme-text);
        }
        .pjbb-detail-meta {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 4px 12px;
          font-size: 0.78rem;
          margin: 0;
        }
        .pjbb-detail-meta dt {
          color: var(--theme-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.68rem;
          align-self: start;
          padding-top: 1px;
        }
        .pjbb-detail-meta dd {
          margin: 0;
          color: var(--theme-text);
          word-break: break-word;
        }
        .pjbb-detail .path {
          display: block;
          margin-top: 10px;
          font-size: 0.72rem;
          color: var(--theme-text-secondary);
        }
        .pjbb-binder-tab summary {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: baseline;
          padding: 12px 16px;
          cursor: pointer;
          list-style: none;
        }
        .pjbb-binder-tab summary::-webkit-details-marker { display: none; }
        .pjbb-flag {
          flex-shrink: 0;
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          padding: 2px 6px;
          border-radius: 2px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .pjbb-flag.tone-open { background: var(--theme-accent-soft); color: var(--theme-accent); }
        .pjbb-flag.tone-resolved { background: rgba(127,174,126,0.16); color: #7fae7e; }
        .pjbb-flag.tone-info { background: transparent; color: var(--theme-text-muted); border: 1px solid var(--theme-border); }
        .pjbb-row.timely summary { background: var(--theme-accent-soft); }
        .pjbb-timely-badge {
          flex-shrink: 0;
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          color: var(--theme-accent);
        }
        .pjbb-ticker {
          margin-top: 20px;
          background: var(--theme-bg-subtle);
          border: 1px solid var(--theme-border);
          border-radius: 3px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .pjbb-ticker-label {
          font-family: "Oswald", sans-serif;
          font-size: 0.68rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--theme-text-muted);
        }
        .pjbb-ticker-feed { flex: 1; min-width: 200px; font-size: 0.86rem; }
        .pjbb-ticker-feed.quiet { color: var(--theme-text-muted); }
        .pjbb-ticker-feed .item { color: var(--theme-accent); }
        .pjbb-ticker-feed .item + .item { margin-left: 22px; }
        .pjbb-ticker-meta { font-size: 0.7rem; color: var(--theme-text-muted); text-align: right; flex-shrink: 0; }
        .pjbb-sim {
          font-family: "Space Mono", monospace;
          font-size: 0.7rem;
          color: var(--theme-text-muted);
          background: transparent;
          border: 1px solid var(--theme-border);
          border-radius: 2px;
          padding: 5px 10px;
          cursor: pointer;
        }
        .pjbb-sim:hover { color: var(--theme-accent); }
        .pjbb-empty { padding: 24px 16px; color: var(--theme-text-muted); font-size: 0.85rem; }
        .pjbb-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 8px 16px;
          font-size: 0.7rem;
          color: var(--theme-text-secondary);
          border-bottom: 1px solid var(--theme-border);
        }
        .pjbb-legend span { display: inline-flex; align-items: center; gap: 5px; }
      `}</style>

      {error && (
        <Text color="red.400" mb={4}>
          {error}
        </Text>
      )}

      {!data && !error && (
        <Text color="theme.textSecondary" mb={4}>
          Reading the board...
        </Text>
      )}

      {data && !data.available && (
        <Box className="pjbb-panel" p={4} mb={4}>
          <Text fontWeight="semibold" mb={1}>
            Puddlejump repo not found at this environment&apos;s co-location path.
          </Text>
          <Text fontSize="sm" color="theme.textSecondary">
            Expected: <code>{data.puddlejumpPath}</code>. This works on a local dev
            machine where release/puddlejump sits next to this repo. It will work
            on the VPS once puddlejump is checked out there too.
          </Text>
        </Box>
      )}

      {data && data.available && (
        <div className="pjbb-grid">
          <div className="pjbb-panel">
            <div className="pjbb-panel-head">
              <div className="pjbb-panel-title">ADR Tote Board</div>
              <div className="pjbb-sortbar">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`pjbb-sortbtn${sortKey === opt.key ? " active" : ""}`}
                    onClick={() => setSortKey(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="pjbb-panel-count">{sortedAdrs.length} found</div>
            </div>
            <div className="pjbb-legend">
              {(Object.keys(LIFECYCLE_LABEL) as Lifecycle[]).map((lc) => (
                <span key={lc}>
                  <span className="pjbb-dot" style={{ background: LIFECYCLE_COLOR[lc] }} />
                  {LIFECYCLE_LABEL[lc]}
                </span>
              ))}
            </div>
            {sortedAdrs.length === 0 && <div className="pjbb-empty">No ADR-shaped documents found.</div>}
            {sortedAdrs.map((adr) => (
              <details className={`pjbb-row${adr.timely ? " timely" : ""}`} key={adr.path}>
                <summary title={adr.summary ?? "No summary available yet."}>
                  <span className="pjbb-dot" style={{ background: LIFECYCLE_COLOR[adr.lifecycle] }} />
                  <span className="pjbb-name">{adr.title}</span>
                  <span className="pjbb-timely-badge">{adr.timely ? "★ TIMELY" : ""}</span>
                  <span className="pjbb-status">{shortStatusLabel(adr.status)}</span>
                  <span className="pjbb-chev">&#8250;</span>
                </summary>
                <div className="pjbb-detail">
                  {adr.summary && <p className="pjbb-detail-summary">{adr.summary}</p>}
                  <dl className="pjbb-detail-meta">
                    <dt>Status</dt>
                    <dd>{adr.status}</dd>
                    <dt>Lifecycle</dt>
                    <dd>{LIFECYCLE_LABEL[adr.lifecycle]}</dd>
                    <dt>Class</dt>
                    <dd>{adr.class}</dd>
                    {adr.adrNumber != null && (
                      <>
                        <dt>ADR #</dt>
                        <dd>{adr.adrNumber}</dd>
                      </>
                    )}
                    {adr.created && (
                      <>
                        <dt>Created</dt>
                        <dd>{formatDate(adr.created)}</dd>
                      </>
                    )}
                    {adr.updated && (
                      <>
                        <dt>Updated</dt>
                        <dd>{formatDate(adr.updated)}</dd>
                      </>
                    )}
                    {adr.uuid && (
                      <>
                        <dt>UUID</dt>
                        <dd>{adr.uuid}</dd>
                      </>
                    )}
                  </dl>
                  <span className="path">{adr.path}</span>
                </div>
              </details>
            ))}
          </div>

          <div className="pjbb-panel pjbb-binder">
            <div className="pjbb-panel-head">
              <div className="pjbb-panel-title">Spikes Binder</div>
              <div className="pjbb-panel-count">{sortedSpikes.length} found</div>
            </div>
            {sortedSpikes.length === 0 && <div className="pjbb-empty">No spikes found.</div>}
            {sortedSpikes.map((spike) => (
              <details className={`pjbb-row pjbb-binder-tab${spike.timely ? " timely" : ""}`} key={spike.path}>
                <summary>
                  <span className="pjbb-name">
                    {spike.timely && <span className="pjbb-timely-badge">★ </span>}
                    {spike.title}
                  </span>
                  <span className={`pjbb-flag tone-${spikeTone(spike.status)}`}>
                    {spikeTone(spike.status).toUpperCase()}
                  </span>
                </summary>
                <div className="pjbb-detail">
                  {spike.status}
                  <span className="path">{spike.path}</span>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      <div className="pjbb-ticker">
        <div className="pjbb-ticker-label">Attend Ticker</div>
        <div className={`pjbb-ticker-feed${simmed ? "" : " quiet"}`}>
          {simmed ? (
            <span className="item">Sketch only — this ticker isn&apos;t wired to a real signal source yet</span>
          ) : (
            "— ALL CLEAR — nothing needs you right now —"
          )}
        </div>
        <div className="pjbb-ticker-meta">
          Next check {simmed ? "14:00 (now)" : "06:00"}
          <br />
          Prevention mode: <span style={{ color: "#7fae7e" }}>ON</span>
        </div>
        <button className="pjbb-sim" type="button" onClick={() => setSimmed((s) => !s)}>
          {simmed ? "RESTORE QUIET" : "SIMULATE 14:00 CHECK"}
        </button>
      </div>
    </Box>
  );
}
