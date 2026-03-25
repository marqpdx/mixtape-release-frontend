// packages/api/src/hooks/workbench/useCurationWorkbench.ts
//
// State hook for the curation workbench — WorkingItems (Lane 2) and Pieces (Lane 1).

import { useState, useCallback, useEffect } from "react";
import { curationApi } from "../../clients/workbench/curationApi";
import type {
  Piece,
  PieceTypeLabel,
  WorkingItem,
  WorkingItemMembership,
  WorkingItemSummary,
  WorkingItemStatus,
  GateFailure,
  PromoteResult,
} from "../../clients/workbench/curationApi";

export type {
  Piece,
  PieceTypeLabel,
  WorkingItem,
  WorkingItemMembership,
  WorkingItemSummary,
  WorkingItemStatus,
  GateFailure,
  PromoteResult,
};

interface UseCurationWorkbenchReturn {
  // Pieces (Lane 1)
  pieces: Piece[];
  piecesLoading: boolean;
  piecesError: string | null;
  loadPieces: (params?: { type?: PieceTypeLabel; q?: string; ungrouped?: boolean }) => Promise<void>;

  // Working Items (Lane 2)
  workingItems: WorkingItemSummary[];
  workingItemsLoading: boolean;
  workingItemsError: string | null;
  loadWorkingItems: (statusFilter?: string) => Promise<void>;

  // Active WorkingItem (full detail, for editing)
  activeItem: WorkingItem | null;
  activeItemLoading: boolean;
  openWorkingItem: (itemId: string) => Promise<void>;
  closeWorkingItem: () => void;

  // Mutations
  createWorkingItem: (title: string, pieces?: Piece[]) => Promise<WorkingItem>;
  updateWorkingItem: (itemId: string, data: Partial<{ title: string; status: WorkingItemStatus; target_writing_kind: string }>) => Promise<void>;
  deleteWorkingItem: (itemId: string) => Promise<void>;
  autosave: (itemId: string, data: {
    body_json?: Record<string, unknown>;
    title?: string;
    mark_body_editing_started?: boolean;
  }) => Promise<void>;
  addPieceToItem: (itemId: string, piece: Piece) => Promise<void>;
  removePieceFromItem: (itemId: string, membershipId: string) => Promise<void>;
  reorderMemberships: (itemId: string, membershipIds: string[]) => Promise<void>;
  promoteWorkingItem: (itemId: string, overrideSoftGates?: boolean) => Promise<PromoteResult>;

  error: string | null;
  clearError: () => void;
}

export function useCurationWorkbench(groupSlug: string): UseCurationWorkbenchReturn {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [piecesLoading, setPiecesLoading] = useState(false);
  const [piecesError, setPiecesError] = useState<string | null>(null);

  const [workingItems, setWorkingItems] = useState<WorkingItemSummary[]>([]);
  const [workingItemsLoading, setWorkingItemsLoading] = useState(false);
  const [workingItemsError, setWorkingItemsError] = useState<string | null>(null);

  const [activeItem, setActiveItem] = useState<WorkingItem | null>(null);
  const [activeItemLoading, setActiveItemLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setPiecesLoading(true);
      setWorkingItemsLoading(true);
      try {
        const [pRes, wRes] = await Promise.all([
          curationApi.listPieces(groupSlug),
          curationApi.listWorkingItems(groupSlug),
        ]);
        if (!cancelled) {
          setPieces(pRes.data);
          setWorkingItems(wRes.data);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load workbench";
          setPiecesError(msg);
          setWorkingItemsError(msg);
        }
      } finally {
        if (!cancelled) {
          setPiecesLoading(false);
          setWorkingItemsLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [groupSlug]);

  const loadPieces = useCallback(async (params?: { type?: PieceTypeLabel; q?: string; ungrouped?: boolean }) => {
    setPiecesLoading(true);
    setPiecesError(null);
    try {
      const res = await curationApi.listPieces(groupSlug, params);
      setPieces(res.data);
    } catch (err) {
      setPiecesError(err instanceof Error ? err.message : "Failed to load pieces");
    } finally {
      setPiecesLoading(false);
    }
  }, [groupSlug]);

  const loadWorkingItems = useCallback(async (statusFilter?: string) => {
    setWorkingItemsLoading(true);
    setWorkingItemsError(null);
    try {
      const res = await curationApi.listWorkingItems(groupSlug, statusFilter ? { status: statusFilter } : undefined);
      setWorkingItems(res.data);
    } catch (err) {
      setWorkingItemsError(err instanceof Error ? err.message : "Failed to load working items");
    } finally {
      setWorkingItemsLoading(false);
    }
  }, [groupSlug]);

  const openWorkingItem = useCallback(async (itemId: string) => {
    setActiveItemLoading(true);
    try {
      const res = await curationApi.getWorkingItem(groupSlug, itemId);
      setActiveItem(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load working item");
    } finally {
      setActiveItemLoading(false);
    }
  }, [groupSlug]);

  const closeWorkingItem = useCallback(() => setActiveItem(null), []);

  const createWorkingItem = useCallback(async (title: string, selectedPieces?: Piece[]): Promise<WorkingItem> => {
    setError(null);
    const piecesPayload = selectedPieces?.map((p, i) => ({
      content_type_id: p.content_type_id,
      object_id: p.id,
      position: i,
    }));
    const res = await curationApi.createWorkingItem(groupSlug, { title, pieces: piecesPayload });
    const summary: WorkingItemSummary = {
      id: res.data.id,
      slug: res.data.slug,
      title: res.data.title,
      status: res.data.status,
      target_writing_kind: res.data.target_writing_kind,
      spellcheck_passed: res.data.spellcheck_passed,
      author_username: res.data.author_username,
      membership_count: res.data.memberships.length,
      last_saved_at: res.data.last_saved_at,
      created_at: res.data.created_at,
      updated_at: res.data.updated_at,
    };
    setWorkingItems(prev => [summary, ...prev]);
    return res.data;
  }, [groupSlug]);

  const updateWorkingItem = useCallback(async (itemId: string, data: Partial<{ title: string; status: WorkingItemStatus; target_writing_kind: string }>) => {
    setError(null);
    const res = await curationApi.updateWorkingItem(groupSlug, itemId, data);
    setWorkingItems(prev => prev.map(w => w.id === itemId ? { ...w, ...data, updated_at: res.data.updated_at } : w));
    if (activeItem?.id === itemId) setActiveItem(res.data);
  }, [groupSlug, activeItem]);

  const deleteWorkingItem = useCallback(async (itemId: string) => {
    setError(null);
    await curationApi.deleteWorkingItem(groupSlug, itemId);
    setWorkingItems(prev => prev.filter(w => w.id !== itemId));
    if (activeItem?.id === itemId) setActiveItem(null);
  }, [groupSlug, activeItem]);

  const autosave = useCallback(async (itemId: string, data: {
    body_json?: Record<string, unknown>;
    title?: string;
    mark_body_editing_started?: boolean;
  }) => {
    const res = await curationApi.autosave(groupSlug, itemId, data);
    if (activeItem?.id === itemId) {
      setActiveItem(prev => prev ? {
        ...prev,
        ...(data.title ? { title: data.title } : {}),
        ...(data.body_json ? { body_json: data.body_json } : {}),
        last_saved_at: res.data.last_saved_at,
        auto_save_count: res.data.auto_save_count,
        body_editing_started: res.data.body_editing_started,
        spellcheck_passed: res.data.spellcheck_passed,
      } : prev);
    }
    setWorkingItems(prev => prev.map(w => w.id === itemId ? {
      ...w,
      ...(data.title ? { title: data.title } : {}),
      last_saved_at: res.data.last_saved_at,
    } : w));
  }, [groupSlug, activeItem]);

  const addPieceToItem = useCallback(async (itemId: string, piece: Piece) => {
    setError(null);
    await curationApi.addPiece(groupSlug, itemId, {
      content_type_id: piece.content_type_id,
      object_id: piece.id,
    });
    setWorkingItems(prev => prev.map(w => w.id === itemId ? { ...w, membership_count: w.membership_count + 1 } : w));
    if (activeItem?.id === itemId) {
      const res = await curationApi.getWorkingItem(groupSlug, itemId);
      setActiveItem(res.data);
    }
  }, [groupSlug, activeItem]);

  const removePieceFromItem = useCallback(async (itemId: string, membershipId: string) => {
    setError(null);
    await curationApi.removePiece(groupSlug, itemId, membershipId);
    setWorkingItems(prev => prev.map(w => w.id === itemId ? { ...w, membership_count: Math.max(0, w.membership_count - 1) } : w));
    if (activeItem?.id === itemId) {
      setActiveItem(prev => prev ? {
        ...prev,
        memberships: prev.memberships.filter(m => m.id !== membershipId),
      } : prev);
    }
  }, [groupSlug, activeItem]);

  const reorderMemberships = useCallback(async (itemId: string, membershipIds: string[]) => {
    setError(null);
    const res = await curationApi.reorderPieces(groupSlug, itemId, membershipIds);
    if (activeItem?.id === itemId) {
      setActiveItem(prev => prev ? { ...prev, memberships: res.data.memberships } : prev);
    }
  }, [groupSlug, activeItem]);

  const promoteWorkingItem = useCallback(async (itemId: string, overrideSoftGates = false): Promise<PromoteResult> => {
    setError(null);
    const res = await curationApi.promote(groupSlug, itemId, overrideSoftGates);
    setWorkingItems(prev => prev.map(w => w.id === itemId ? { ...w, status: "promoted" } : w));
    if (activeItem?.id === itemId) setActiveItem(prev => prev ? { ...prev, status: "promoted" } : prev);
    return res.data;
  }, [groupSlug, activeItem]);

  const clearError = useCallback(() => setError(null), []);

  return {
    pieces, piecesLoading, piecesError, loadPieces,
    workingItems, workingItemsLoading, workingItemsError, loadWorkingItems,
    activeItem, activeItemLoading, openWorkingItem, closeWorkingItem,
    createWorkingItem, updateWorkingItem, deleteWorkingItem,
    autosave, addPieceToItem, removePieceFromItem, reorderMemberships, promoteWorkingItem,
    error, clearError,
  };
}
