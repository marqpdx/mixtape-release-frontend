import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useEffect, useState, useCallback } from "react";

export type NoticeboardItem = {
  id: string;
  piece: {
    id: string;
    title: string;
    excerpt?: string;
    body_json: ProseMirrorDoc | null;
    author: string; // UUID string
    published_at: string;
    writing_kind: string;
    view_count: number;
    comment_count: number;
  };
  visibility: "public" | "members" | "private" | "scheduled";
  is_pinned: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  author_name: string; // This comes from the serializer
};

type ProseMirrorNode = {
  type?: string;
  text?: string;
  content?: ProseMirrorNode[];
};

type ProseMirrorDoc = {
  content?: ProseMirrorNode[];
};

export async function fetchNoticeboard(groupSlug: string, page = 1, limit = 10) {
  try {
    const response = await axiosInstance.get(`/api/groups/${groupSlug}/noticeboard`, {
      params: {
        page,
        page_size: limit,
      }
    });

    return response.data as {
      results: NoticeboardItem[];
      next?: string | null;
      previous?: string | null;
      count: number;
    };
  } catch (error) {
    console.error('Failed to fetch noticeboard:', error);
    const message =
      error && typeof error === 'object'
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
    throw new Error(message || 'Failed to load noticeboard');
  }
}

export function useNoticeboard(groupSlug: string) {
  const [items, setItems] = useState<NoticeboardItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const load = useCallback(async (reset = false, pageToLoad?: number) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const targetPage = reset ? 1 : (pageToLoad || currentPage);
      const response = await fetchNoticeboard(groupSlug, targetPage);

      if (reset) {
        setItems(response.results);
        setCurrentPage(1);
      } else {
        setItems(prev => [...prev, ...response.results]);
        setCurrentPage(targetPage);
      }

      setTotalCount(response.count);
      setHasMore(Boolean(response.next));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error loading noticeboard";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [groupSlug, loading, currentPage]);

  // Initial load
  useEffect(() => {
    setItems([]);
    setCurrentPage(1);
    setHasMore(true);
    load(true);
  }, [groupSlug, load]);

  // Load more (pagination)
  const loadMore = () => {
    if (hasMore && !loading) {
      load(false, currentPage + 1);
    }
  };

  // Refresh (useful for QuickPublish success)
  const refresh = () => load(true);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount,
    currentPage
  };
}

export function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

// Helper function to extract text content from ProseMirror JSON
export function extractTextFromProseMirror(bodyJson: ProseMirrorDoc | null): string {
  if (!bodyJson?.content) return "";

  const extractText = (node: ProseMirrorNode): string => {
    if (node.type === "text") {
      return node.text || "";
    }
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join(" ");
    }
    return "";
  };

  const fullText = bodyJson.content.map(extractText).join(" ").trim();
  return fullText.length > 150 ? fullText.substring(0, 150) + "..." : fullText;
}
