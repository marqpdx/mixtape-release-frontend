// commons/commonsApi.ts
//
// Authenticated (superuser-only) API client for the Curation Station.

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export type CurationStatus =
  | "captured"
  | "in_curation"
  | "ready"
  | "approved"
  | "published"
  | "rejected";

export type ItemType =
  | "person"
  | "organization"
  | "group"
  | "project"
  | "place"
  | "event"
  | "";

export interface CommonsQueueItem {
  id: string;
  title: string;
  slug: string;
  item_type: ItemType;
  curation_status: CurationStatus;
  summary: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  website: string;
  source_url: string;
  recommended_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommonsItemDetail extends CommonsQueueItem {
  body: string;
  why_recommended: string;
  contact_email: string;
  contact_links: Record<string, string>;
  instagram: string;
  youtube: string;
  rss: string;
  founder: string;
  extracted_data: Record<string, unknown>;
  additional_data: Record<string, unknown>;
  curated_by_name: string | null;
  approved_by_name: string | null;
  published_at: string | null;
}

export interface CommonsItemUpdatePayload {
  title?: string;
  summary?: string;
  body?: string;
  item_type?: ItemType;
  why_recommended?: string;
  website?: string;
  contact_email?: string;
  instagram?: string;
  youtube?: string;
  rss?: string;
  location_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  founder?: string;
}

export async function listCommonsQueue(
  status?: CurationStatus
): Promise<CommonsQueueItem[]> {
  const params = status ? { status } : {};
  const response = await axiosInstance.get<CommonsQueueItem[]>(
    "/api/commons/items",
    { params }
  );
  return response.data;
}

export async function getCommonsItem(id: string): Promise<CommonsItemDetail> {
  const response = await axiosInstance.get<CommonsItemDetail>(
    `/api/commons/items/${id}`
  );
  return response.data;
}

export async function updateCommonsItem(
  id: string,
  payload: CommonsItemUpdatePayload
): Promise<CommonsItemDetail> {
  const response = await axiosInstance.patch<CommonsItemDetail>(
    `/api/commons/items/${id}`,
    payload
  );
  return response.data;
}

export async function advanceCommonsItem(
  id: string,
  targetStatus: CurationStatus
): Promise<CommonsItemDetail> {
  const response = await axiosInstance.post<CommonsItemDetail>(
    `/api/commons/items/${id}/advance`,
    { target_status: targetStatus }
  );
  return response.data;
}

export async function rejectCommonsItem(
  id: string
): Promise<CommonsItemDetail> {
  const response = await axiosInstance.post<CommonsItemDetail>(
    `/api/commons/items/${id}/reject`
  );
  return response.data;
}
