// Types for the MindMap spatial graph system

export interface MindMap {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  viewport: { x: number; y: number; zoom: number };
  version: number;
  share_mode: 'private' | 'group_read' | 'explicit_grants' | 'link_read';
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface MindMapDetail extends MindMap {
  node_count: number;
  edge_count: number;
}

export interface MindMapNodeAttachment {
  id: string;
  kind: 'url' | 'image' | 'file' | 'embed' | 'reference';
  title: string | null;
  url: string | null;
  asset: string | null;
  mime_type: string | null;
  sort_order: number;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface MindMapNode {
  id: string;
  node_type: string;
  pos_x: number;
  pos_y: number;
  width: number | null;
  height: number | null;
  z_index: number | null;
  collapsed: boolean;
  style: Record<string, unknown> | null;
  backing_kind: 'inline' | 'leaf';
  leaf: string | null;
  title: string | null;
  text: string | null;
  primary_url: string | null;
  meta: Record<string, unknown>;
  attachments: MindMapNodeAttachment[];
  created_at: string;
  updated_at: string;
}

export interface MindMapEdge {
  id: string;
  source_node: string;
  target_node: string;
  edge_type: string;
  label: string | null;
  directed: boolean;
  style: Record<string, unknown> | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---- Request payload types ----

export interface MindMapCreateData {
  title?: string;
  sponsor_content_type?: string;
  sponsor_object_id?: string;
}

export interface MindMapUpdateData {
  title?: string;
  viewport?: { x: number; y: number; zoom: number };
  status?: MindMap['status'];
  share_mode?: MindMap['share_mode'];
  summary?: string;
}

export interface NodeCreateData {
  node_type: string;
  pos_x: number;
  pos_y: number;
  width?: number | null;
  height?: number | null;
  z_index?: number | null;
  collapsed?: boolean;
  style?: Record<string, unknown> | null;
  backing_kind?: 'inline' | 'leaf';
  leaf?: string | null;
  title?: string | null;
  text?: string | null;
  primary_url?: string | null;
  meta?: Record<string, unknown>;
}

export interface BulkUpsertNodeItem {
  id?: string;
  node_type?: string;
  pos_x?: number;
  pos_y?: number;
  width?: number | null;
  height?: number | null;
  z_index?: number | null;
  collapsed?: boolean;
  style?: Record<string, unknown> | null;
  backing_kind?: 'inline' | 'leaf';
  leaf?: string | null;
  title?: string | null;
  text?: string | null;
  primary_url?: string | null;
  meta?: Record<string, unknown>;
}

export interface EdgeCreateData {
  source_node: string;
  target_node: string;
  edge_type: string;
  label?: string | null;
  directed?: boolean;
  style?: Record<string, unknown> | null;
  meta?: Record<string, unknown>;
}

export interface BulkUpsertEdgeItem {
  id?: string;
  source_node?: string;
  target_node?: string;
  edge_type?: string;
  label?: string | null;
  directed?: boolean;
  style?: Record<string, unknown> | null;
  meta?: Record<string, unknown>;
}

export interface BulkItemResult {
  id: string;
  ok: boolean;
  errors: string[];
}

export interface BulkUpsertResponse {
  ok: boolean;
  mindmap_id: string;
  version: number;
  results: BulkItemResult[];
}

export interface BulkDeleteResponse {
  ok: boolean;
  deleted: number;
  version: number;
}
