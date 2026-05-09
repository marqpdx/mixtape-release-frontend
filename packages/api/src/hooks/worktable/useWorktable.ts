import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWorktableStream, StreamEntry, StreamScope } from "@mixtape/api/clients/worktable/worktableApi";

export type { StreamEntry };

export function useWorktableStream(params: {
  scope: StreamScope;
  group_slug?: string;
  initiative_id?: string;
}) {
  const [entries, setEntries] = useState<StreamEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (reset = false) => {
    if (reset) setIsLoading(true);
    try {
      const data = await fetchWorktableStream({ ...params, limit: 50 });
      setEntries(data.entries);
      setHasMore(data.has_more);
      setCursor(data.cursor);
    } finally {
      if (reset) setIsLoading(false);
    }
  }, [params.scope, params.group_slug, params.initiative_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load more (scroll up — older entries)
  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchWorktableStream({ ...params, before: cursor, limit: 50 });
      setEntries((prev) => [...data.entries, ...prev]);
      setHasMore(data.has_more);
      setCursor(data.cursor);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, cursor, isLoadingMore, params]); // eslint-disable-line react-hooks/exhaustive-deps

  // Optimistically prepend a new entry (from command field)
  const appendEntry = useCallback((entry: StreamEntry) => {
    setEntries((prev) => [...prev, entry]);
  }, []);

  useEffect(() => {
    void load(true);
    // Poll every 10s for new entries (W1 — WebSocket in future)
    pollRef.current = setInterval(() => void load(false), 10_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  return { entries, isLoading, hasMore, isLoadingMore, loadMore, appendEntry, reload: () => void load(true) };
}
