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
  user_id: string;
  username: string;
  display_name: string;
  quick_intro: string;
  right_now: string;
  skills: string;
  work_areas: string;
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

export interface PublicLibraryPiece {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  writing_kind: string;
  published_at: string | null;
  reading_time: number | null;
  author: {
    username: string;
    display_name: string;
  };
  sponsor_group: {
    slug: string;
    title: string;
  } | null;
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

export interface PublicCourseListItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: string;
  difficulty_level: string;
  delivery_type: string;
  estimated_duration: number | null;
  learning_objectives: string[];
}

export interface PublicCourseOutlineItem {
  id: string;
  position: number;
  section_title: string;
  content_type: string;
  content_title: string;
  estimated_duration: number | null;
}

export interface PublicCourseDetail extends PublicCourseListItem {
  body: string;
  flow_mode: string;
  items: PublicCourseOutlineItem[];
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

export async function fetchPublicMemberWriting(
  username: string
): Promise<PublicLibraryPiece[]> {
  const response = await axiosInstance.get<PublicLibraryPiece[]>(
    `/api/public/members/${username}/writing`
  );
  return response.data;
}

export async function fetchPublicGroupWriting(
  slug: string
): Promise<PublicLibraryPiece[]> {
  const response = await axiosInstance.get<PublicLibraryPiece[]>(
    `/api/public/groups/${slug}/writing`
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

export async function fetchPublicGroupCourses(
  groupSlug: string
): Promise<PublicCourseListItem[]> {
  const response = await axiosInstance.get<PublicCourseListItem[]>(
    `/api/public/groups/${groupSlug}/courses`
  );
  return response.data;
}

export async function fetchPublicCourseDetail(
  groupSlug: string,
  courseSlug: string
): Promise<PublicCourseDetail> {
  const response = await axiosInstance.get<PublicCourseDetail>(
    `/api/public/groups/${groupSlug}/courses/${courseSlug}`
  );
  return response.data;
}

// --- Commons ---

export interface PublicCommonsItem {
  id: string;
  title: string;
  slug: string;
  item_type: string;
  summary: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  website: string;
  why_recommended: string;
  recommended_by_name: string | null;
  published_at: string;
}

export interface PublicCommonsFilament {
  direction: "in" | "out";
  relation_type: string;
  related_id: string;
  related_title: string;
  related_slug: string;
  note: string;
}

export interface PublicCommonsDetail extends PublicCommonsItem {
  body: string;
  contact_email: string;
  contact_links: Record<string, string>;
  instagram: string;
  youtube: string;
  rss: string;
  founder: string;
  filaments: PublicCommonsFilament[];
}

export async function fetchPublicCommons(params?: {
  type?: string;
  search?: string;
}): Promise<PublicCommonsItem[]> {
  const response = await axiosInstance.get<PublicCommonsItem[]>(
    "/api/public/commons",
    { params }
  );
  return response.data;
}

export async function fetchPublicCommonsDetail(
  slug: string
): Promise<PublicCommonsDetail> {
  const response = await axiosInstance.get<PublicCommonsDetail>(
    `/api/public/commons/${slug}`
  );
  return response.data;
}
