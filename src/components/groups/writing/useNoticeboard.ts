import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { useEffect, useState } from "react";

export type NoticeboardItem = {
  id: string;
  piece: {
    id: string;
    title: string;
    excerpt?: string;
    body_json: any;
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
  } catch (error: any) {
    console.error('Failed to fetch noticeboard:', error);
    throw new Error(error?.response?.data?.message || 'Failed to load noticeboard');
  }
}

export function useNoticeboard(groupSlug: string) {
  const [items, setItems] = useState<NoticeboardItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const load = async (reset = false, pageToLoad?: number) => {
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
    } catch (e: any) {
      setError(e.message ?? "Error loading noticeboard");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    setItems([]);
    setCurrentPage(1);
    setHasMore(true);
    load(true);
  }, [groupSlug]);

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
export function extractTextFromProseMirror(bodyJson: any): string {
  if (!bodyJson?.content) return "";

  const extractText = (node: any): string => {
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

