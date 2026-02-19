// public/publicApi.ts
//
// Lean public API client for anonymous + logged-in reader surface.
// These endpoints never require authentication.

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// --- Types ---

export interface PublicGroupAffiliation {
  title: string;
  slug: string;
  group_type: string;
}

export interface PublicMemberProfile {
  username: string;
  display_name: string;
  quick_intro: string;
  avatar_url: string;
  bio_json: Record<string, unknown> | null;
  profile_image_url: string | null;
  background_image_url: string | null;
  date_joined: string;
  groups: PublicGroupAffiliation[];
}

export interface PublicShelfItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  writing_kind: string;
  published_at: string;
}

export interface PublicShelf {
  id: string;
  title: string;
  slug: string;
  summary: string;
  visibility: string;
  item_count: number;
  items: PublicShelfItem[];
}

export interface PublicGroupEmblem {
  fg: string;
  bg: string;
  palette: string[];
  image_url: string | null;
}

export interface PublicGroup {
  id: string;
  slug: string;
  title: string;
  quick_intro: string;
  group_type: "persona" | "circle" | "community" | "coalition";
  member_count: number;
  profile_image_url: string | null;
  background_image_url: string | null;
  emblem: PublicGroupEmblem | null;
  parent_slug: string | null;
  decorators: string[];
}

export interface PublicMemberPreview {
  username: string;
  display_name: string;
  avatar_url: string;
}

export interface PublicGroupDetail extends PublicGroup {
  description: string;
  parent_title: { title: string; slug: string } | null;
  child_groups: PublicGroupAffiliation[];
  member_preview: PublicMemberPreview[];
  admission_policy: string;
}

export interface AdmissionStatus {
  policy: string;
  can_join: boolean;
  can_request: boolean;
  is_member: boolean;
  is_moderator: boolean;
  has_pending_request: boolean;
  parent_group: { title: string; slug: string } | null;
  requires_parent_membership: boolean;
  is_parent_member: boolean;
}

export interface PublicWritingPiece {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_json: Record<string, unknown>;
  writing_kind: string;
  published_at: string;
  author: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  placement_visibility: string;
}

// --- API Functions ---

export async function fetchPublicMemberProfile(
  username: string
): Promise<PublicMemberProfile> {
  const response = await axiosInstance.get<PublicMemberProfile>(
    `/api/public/members/${username}`
  );
  return response.data;
}

export async function fetchPublicMemberShelves(
  username: string
): Promise<PublicShelf[]> {
  const response = await axiosInstance.get<PublicShelf[]>(
    `/api/public/members/${username}/shelves`
  );
  return response.data;
}

export async function fetchPublicGroups(): Promise<PublicGroup[]> {
  const response = await axiosInstance.get<PublicGroup[]>(
    "/api/public/groups"
  );
  return response.data;
}

export async function fetchPublicGroup(
  slug: string
): Promise<PublicGroupDetail> {
  const response = await axiosInstance.get<PublicGroupDetail>(
    `/api/public/groups/${slug}`
  );
  return response.data;
}

export async function fetchAdmissionStatus(
  slug: string
): Promise<AdmissionStatus> {
  const response = await axiosInstance.get<AdmissionStatus>(
    `/api/public/groups/${slug}/admission-status`
  );
  return response.data;
}

export async function joinGroup(
  slug: string
): Promise<{ detail: string }> {
  const response = await axiosInstance.post(`/api/groups/${slug}/join`);
  return response.data;
}

export async function requestToJoinGroup(
  slug: string,
  message?: string
): Promise<{ detail: string; invitation_id: number }> {
  const response = await axiosInstance.post(`/api/groups/${slug}/request-join`, {
    message: message || "",
  });
  return response.data;
}

export async function fetchPublicWritingPiece(
  slug: string
): Promise<PublicWritingPiece> {
  const response = await axiosInstance.get<PublicWritingPiece>(
    `/api/public/writing/${slug}`
  );
  return response.data;
}
