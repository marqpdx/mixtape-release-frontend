// API client for the MindMap system

import { axiosInstance } from '../../lib/axiosInstance';
import type {
  MindMap,
  MindMapDetail,
  MindMapCreateData,
  MindMapUpdateData,
  MindMapNode,
  NodeCreateData,
  BulkUpsertNodeItem,
  BulkUpsertResponse,
  BulkDeleteResponse,
  MindMapEdge,
  EdgeCreateData,
  BulkUpsertEdgeItem,
  MindMapNodeAttachment,
} from '@mixtape/core/types/mindmapTypes';

const BASE = '/api/mindmaps';

// ---- MindMap CRUD ----

export async function fetchMindmaps(): Promise<MindMap[]> {
  const res = await axiosInstance.get(`${BASE}/`);
  return Array.isArray(res.data) ? res.data : res.data.results ?? [];
}

export async function createMindmap(data: MindMapCreateData): Promise<MindMap> {
  const res = await axiosInstance.post(`${BASE}/`, data);
  return res.data;
}

export async function fetchMindmap(id: string): Promise<MindMapDetail> {
  const res = await axiosInstance.get(`${BASE}/${id}`);
  return res.data;
}

export async function updateMindmap(
  id: string,
  data: MindMapUpdateData
): Promise<{ ok: boolean }> {
  const res = await axiosInstance.patch(`${BASE}/${id}`, data);
  return res.data;
}

// ---- Nodes ----

export async function fetchNodes(mindmapId: string): Promise<MindMapNode[]> {
  const res = await axiosInstance.get(`${BASE}/${mindmapId}/nodes`);
  return Array.isArray(res.data) ? res.data : res.data.results ?? [];
}

export async function createNode(
  mindmapId: string,
  data: NodeCreateData
): Promise<MindMapNode> {
  const res = await axiosInstance.post(`${BASE}/${mindmapId}/nodes`, data);
  return res.data;
}

export async function updateNode(
  mindmapId: string,
  nodeId: string,
  data: Partial<NodeCreateData>
): Promise<MindMapNode> {
  const res = await axiosInstance.patch(
    `${BASE}/${mindmapId}/nodes/${nodeId}`,
    data
  );
  return res.data;
}

export async function deleteNode(
  mindmapId: string,
  nodeId: string
): Promise<void> {
  await axiosInstance.delete(`${BASE}/${mindmapId}/nodes/${nodeId}`);
}

export async function bulkUpsertNodes(
  mindmapId: string,
  items: BulkUpsertNodeItem[]
): Promise<BulkUpsertResponse> {
  const res = await axiosInstance.post(
    `${BASE}/${mindmapId}/nodes/bulk_upsert`,
    { items }
  );
  return res.data;
}

export async function bulkDeleteNodes(
  mindmapId: string,
  ids: string[]
): Promise<BulkDeleteResponse> {
  const res = await axiosInstance.post(
    `${BASE}/${mindmapId}/nodes/bulk_delete`,
    { ids }
  );
  return res.data;
}

// ---- Edges ----

export async function fetchEdges(mindmapId: string): Promise<MindMapEdge[]> {
  const res = await axiosInstance.get(`${BASE}/${mindmapId}/edges`);
  return Array.isArray(res.data) ? res.data : res.data.results ?? [];
}

export async function createEdge(
  mindmapId: string,
  data: EdgeCreateData
): Promise<MindMapEdge> {
  const res = await axiosInstance.post(`${BASE}/${mindmapId}/edges`, data);
  return res.data;
}

export async function updateEdge(
  mindmapId: string,
  edgeId: string,
  data: Partial<EdgeCreateData>
): Promise<MindMapEdge> {
  const res = await axiosInstance.patch(
    `${BASE}/${mindmapId}/edges/${edgeId}`,
    data
  );
  return res.data;
}

export async function deleteEdge(
  mindmapId: string,
  edgeId: string
): Promise<void> {
  await axiosInstance.delete(`${BASE}/${mindmapId}/edges/${edgeId}`);
}

export async function bulkUpsertEdges(
  mindmapId: string,
  items: BulkUpsertEdgeItem[]
): Promise<BulkUpsertResponse> {
  const res = await axiosInstance.post(
    `${BASE}/${mindmapId}/edges/bulk_upsert`,
    { items }
  );
  return res.data;
}

export async function bulkDeleteEdges(
  mindmapId: string,
  ids: string[]
): Promise<BulkDeleteResponse> {
  const res = await axiosInstance.post(
    `${BASE}/${mindmapId}/edges/bulk_delete`,
    { ids }
  );
  return res.data;
}

// ---- Attachments ----

export async function fetchAttachments(
  mindmapId: string,
  nodeId: string
): Promise<MindMapNodeAttachment[]> {
  const res = await axiosInstance.get(
    `${BASE}/${mindmapId}/nodes/${nodeId}/attachments`
  );
  return Array.isArray(res.data) ? res.data : res.data.results ?? [];
}

export async function createAttachment(
  mindmapId: string,
  nodeId: string,
  data: Partial<MindMapNodeAttachment>
): Promise<MindMapNodeAttachment> {
  const res = await axiosInstance.post(
    `${BASE}/${mindmapId}/nodes/${nodeId}/attachments`,
    data
  );
  return res.data;
}

export async function updateAttachment(
  mindmapId: string,
  nodeId: string,
  attachmentId: string,
  data: Partial<MindMapNodeAttachment>
): Promise<MindMapNodeAttachment> {
  const res = await axiosInstance.patch(
    `${BASE}/${mindmapId}/nodes/${nodeId}/attachments/${attachmentId}`,
    data
  );
  return res.data;
}

export async function deleteAttachment(
  mindmapId: string,
  nodeId: string,
  attachmentId: string
): Promise<void> {
  await axiosInstance.delete(
    `${BASE}/${mindmapId}/nodes/${nodeId}/attachments/${attachmentId}`
  );
}
