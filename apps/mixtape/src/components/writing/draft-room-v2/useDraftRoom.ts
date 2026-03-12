// components/writing/draft-room-v2/useDraftRoom.ts
//
// Shared state hook for Draft Room V2.
// Manages selected piece, piece detail loading, working copy init,
// and coordination between the three panes.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useWriting, useWritingMutations } from "@mixtape/api/hooks/useWriting";
import type { WritingWorkingCopy } from "@mixtape/core/types/writingTypes";

// ── Types ──

interface SponsorConfig {
  type: "member";
  id: string;
  slug: string;
  displayName: string;
}

type DocumentJSON = Record<string, unknown>;

interface PieceState {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyJson: DocumentJSON;
  status: string;
  addressedTo: string;
  isEmpty: boolean;
}

interface UseDraftRoomReturn {
  // Draft list
  drafts: WritingWorkingCopy[];
  draftsLoading: boolean;
  refetchDrafts: () => void;

  // Selected piece
  selectedPieceId: string | null;
  piece: PieceState | null;
  pieceLoading: boolean;
  selectPiece: (id: string) => void;

  // Editor state
  title: string;
  setTitle: (t: string) => void;
  docJSON: DocumentJSON | null;
  setDocJSON: (d: DocumentJSON | null) => void;
  excerpt: string;
  setExcerpt: (e: string) => void;

  // Actions
  createDraft: () => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;

  // Mutations hook
  mutations: ReturnType<typeof useWritingMutations>;
}

const EMPTY_DOC: DocumentJSON = { type: "doc", content: [] };

// ── Hook ──

export function useDraftRoom(sponsor: SponsorConfig): UseDraftRoomReturn {
  const { drafts, draftsLoading, refetch } = useWriting(sponsor.type, sponsor.slug);
  const mutations = useWritingMutations(sponsor.type, sponsor.slug);

  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [piece, setPiece] = useState<PieceState | null>(null);
  const [pieceLoading, setPieceLoading] = useState(false);

  // Editor state
  const [title, setTitle] = useState("");
  const [docJSON, setDocJSON] = useState<DocumentJSON | null>(EMPTY_DOC);
  const [excerpt, setExcerpt] = useState("");

  // Guard against concurrent loads
  const loadIdRef = useRef(0);

  // Auto-select first draft on initial load
  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (hasAutoSelected.current) return;
    if (draftsLoading) return;
    if (drafts.length > 0 && !selectedPieceId) {
      hasAutoSelected.current = true;
      setSelectedPieceId(drafts[0].piece.id);
    }
  }, [drafts, draftsLoading, selectedPieceId]);

  // Load piece detail + working copy when selection changes
  useEffect(() => {
    if (!selectedPieceId) {
      setPiece(null);
      setTitle("");
      setDocJSON(EMPTY_DOC);
      setExcerpt("");
      return;
    }

    const loadId = ++loadIdRef.current;
    setPieceLoading(true);

    const load = async () => {
      try {
        // Fetch working copy and piece detail in parallel
        const [wcRes, pieceRes] = await Promise.all([
          axiosInstance.get(`/api/writing/pieces/${selectedPieceId}/working-copy`),
          axiosInstance.get(`/api/writing/pieces/${selectedPieceId}`).catch(() => null),
        ]);
        const wc = wcRes.data;
        const pieceDetail = pieceRes?.data;

        // Stale check
        if (loadId !== loadIdRef.current) return;

        const pieceState: PieceState = {
          id: wc.piece.id,
          slug: wc.piece.slug,
          title: wc.title || "",
          excerpt: wc.excerpt || "",
          bodyJson: wc.body_json || EMPTY_DOC,
          status: wc.piece.status,
          addressedTo: pieceDetail?.addressed_to || "public",
          isEmpty: wc.piece.is_empty ?? false,
        };

        setPiece(pieceState);
        setTitle(pieceState.title);
        setDocJSON(pieceState.bodyJson);
        setExcerpt(pieceState.excerpt);
      } catch (err) {
        if (loadId !== loadIdRef.current) return;
        console.error("Failed to load piece:", err);
        setPiece(null);
      } finally {
        if (loadId === loadIdRef.current) {
          setPieceLoading(false);
        }
      }
    };

    load();
  }, [selectedPieceId]);

  const selectPiece = useCallback((id: string) => {
    setSelectedPieceId(id);
  }, []);

  const createDraft = useCallback(async () => {
    try {
      const res = await axiosInstance.post(`/api/writing/pieces`, {
        title: "",
        writing_kind: "post",
        body_json: EMPTY_DOC,
        excerpt: "",
        sponsor_content_type: sponsor.type,
        sponsor_object_id: sponsor.id,
        is_empty: true,
        create_working_copy: true,
      });

      const newPiece = res.data;
      refetch();
      setSelectedPieceId(newPiece.id);
    } catch (err) {
      console.error("Failed to create draft:", err);
    }
  }, [sponsor, refetch]);

  const deleteDraft = useCallback(
    async (id: string) => {
      await mutations.deleteDraft.mutateAsync(id);
      if (selectedPieceId === id) {
        setSelectedPieceId(null);
        hasAutoSelected.current = false;
      }
    },
    [mutations.deleteDraft, selectedPieceId]
  );

  return {
    drafts,
    draftsLoading,
    refetchDrafts: refetch,
    selectedPieceId,
    piece,
    pieceLoading,
    selectPiece,
    title,
    setTitle,
    docJSON,
    setDocJSON,
    excerpt,
    setExcerpt,
    createDraft,
    deleteDraft,
    mutations,
  };
}
