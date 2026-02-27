// packages/api/src/hooks/useMindmap.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as mindmapApi from '../clients/mindmap/mindmapApi';
import type {
  MindMapCreateData,
  MindMapUpdateData,
  NodeCreateData,
  BulkUpsertNodeItem,
  EdgeCreateData,
  BulkUpsertEdgeItem,
} from '@mixtape/core/types/mindmapTypes';

const mindmapKeys = {
  all: ['mindmaps'] as const,
  list: () => [...mindmapKeys.all, 'list'] as const,
  detail: (id: string) => [...mindmapKeys.all, 'detail', id] as const,
  nodes: (id: string) => [...mindmapKeys.all, 'nodes', id] as const,
  edges: (id: string) => [...mindmapKeys.all, 'edges', id] as const,
};

// ---- MindMap queries ----

export function useMindmaps() {
  return useQuery({
    queryKey: mindmapKeys.list(),
    queryFn: () => mindmapApi.fetchMindmaps(),
    staleTime: 30_000,
  });
}

export function useMindmap(id: string | null) {
  return useQuery({
    queryKey: mindmapKeys.detail(id ?? ''),
    queryFn: () => mindmapApi.fetchMindmap(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateMindmap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MindMapCreateData) => mindmapApi.createMindmap(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mindmapKeys.list() });
    },
  });
}

export function useUpdateMindmap(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MindMapUpdateData) => mindmapApi.updateMindmap(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mindmapKeys.detail(id) });
    },
  });
}

// ---- Node queries ----

export function useMindmapNodes(mindmapId: string | null) {
  return useQuery({
    queryKey: mindmapKeys.nodes(mindmapId ?? ''),
    queryFn: () => mindmapApi.fetchNodes(mindmapId!),
    enabled: !!mindmapId,
    staleTime: 30_000,
  });
}

export function useCreateNode(mindmapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NodeCreateData) => mindmapApi.createNode(mindmapId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mindmapKeys.nodes(mindmapId) });
      qc.invalidateQueries({ queryKey: mindmapKeys.detail(mindmapId) });
    },
  });
}

export function useBulkUpsertNodes(mindmapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: BulkUpsertNodeItem[]) =>
      mindmapApi.bulkUpsertNodes(mindmapId, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mindmapKeys.nodes(mindmapId) });
      qc.invalidateQueries({ queryKey: mindmapKeys.detail(mindmapId) });
    },
  });
}

export function useBulkDeleteNodes(mindmapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => mindmapApi.bulkDeleteNodes(mindmapId, ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mindmapKeys.nodes(mindmapId) });
      qc.invalidateQueries({ queryKey: mindmapKeys.edges(mindmapId) });
      qc.invalidateQueries({ queryKey: mindmapKeys.detail(mindmapId) });
    },
  });
}

// ---- Edge queries ----

export function useMindmapEdges(mindmapId: string | null) {
  return useQuery({
    queryKey: mindmapKeys.edges(mindmapId ?? ''),
    queryFn: () => mindmapApi.fetchEdges(mindmapId!),
    enabled: !!mindmapId,
    staleTime: 30_000,
  });
}

export function useCreateEdge(mindmapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EdgeCreateData) => mindmapApi.createEdge(mindmapId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mindmapKeys.edges(mindmapId) });
      qc.invalidateQueries({ queryKey: mindmapKeys.detail(mindmapId) });
    },
  });
}

export function useBulkUpsertEdges(mindmapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: BulkUpsertEdgeItem[]) =>
      mindmapApi.bulkUpsertEdges(mindmapId, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mindmapKeys.edges(mindmapId) });
      qc.invalidateQueries({ queryKey: mindmapKeys.detail(mindmapId) });
    },
  });
}

export function useBulkDeleteEdges(mindmapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => mindmapApi.bulkDeleteEdges(mindmapId, ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mindmapKeys.edges(mindmapId) });
      qc.invalidateQueries({ queryKey: mindmapKeys.detail(mindmapId) });
    },
  });
}
