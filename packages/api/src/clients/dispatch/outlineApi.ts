// packages/api/src/clients/dispatch/outlineApi.ts

import { axiosInstance } from '../../lib/axiosInstance';

// --- Types ---

export interface OutlineNode {
  id: string;
  writing_piece: string;
  title: string;
  parent: string | null;
  order_index: number;
  anchor_target: string | null;
  children: OutlineNode[];
  created_at: string;
  updated_at: string;
}

export interface CreateOutlineNodeData {
  writing_piece: string;
  title: string;
  parent?: string | null;
  order_index?: number;
  anchor_target?: string | null;
}

export interface UpdateOutlineNodeData {
  title?: string;
  parent?: string | null;
  order_index?: number;
  anchor_target?: string | null;
}

// --- API Functions ---

export async function fetchOutline(pieceId: string): Promise<OutlineNode[]> {
  const response = await axiosInstance.get<OutlineNode[]>(
    `/api/dispatch/outline/${pieceId}`
  );
  return response.data;
}

export async function createOutlineNode(
  data: CreateOutlineNodeData
): Promise<OutlineNode> {
  const response = await axiosInstance.post<OutlineNode>(
    '/api/dispatch/outline',
    data
  );
  return response.data;
}

export async function updateOutlineNode(
  nodeId: string,
  data: UpdateOutlineNodeData
): Promise<OutlineNode> {
  const response = await axiosInstance.patch<OutlineNode>(
    `/api/dispatch/outline/node/${nodeId}`,
    data
  );
  return response.data;
}

export async function deleteOutlineNode(nodeId: string): Promise<void> {
  await axiosInstance.delete(`/api/dispatch/outline/node/${nodeId}`);
}

export async function enableOutline(pieceId: string): Promise<void> {
  await axiosInstance.patch(`/api/writing/pieces/${pieceId}`, {
    enable_outline: true,
  });
}
