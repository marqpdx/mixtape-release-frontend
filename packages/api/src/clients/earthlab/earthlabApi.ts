// packages/api/src/clients/earthlab/earthlabApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// ============================================================================
// Types
// ============================================================================

export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  status: string;
  difficulty_level: string;
  delivery_type: string;
  estimated_duration: number | null;
  learning_objectives: string[];
  flow_mode: string;
  created_at: string;
  updated_at: string;
}

export interface CourseItemSummary {
  id: string;
  position: number;
  section_title: string;
  content_type: string;
  content_id: string;
  content_title: string;
  content_slug: string;
  estimated_duration: number | null;
}

export interface CourseDetail extends CourseListItem {
  items: CourseItemSummary[];
}

export interface CourseFormData {
  title: string;
  summary?: string;
  body?: string;
  status?: string;
  difficulty_level?: string;
  delivery_type?: string;
  estimated_duration?: number | null;
  learning_objectives?: string[];
}

export interface LessonListItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  status: string;
  difficulty_level: string;
  estimated_duration: number | null;
  tiptap_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type LessonDetail = LessonListItem;

export interface LessonFormData {
  title: string;
  summary?: string;
  body?: string;
  status?: string;
  difficulty_level?: string;
  estimated_duration?: number | null;
  tiptap_json?: Record<string, unknown> | null;
}

// ============================================================================
// Course CRUD
// ============================================================================

export async function fetchGroupCourses(groupSlug: string): Promise<CourseListItem[]> {
  const response = await axiosInstance.get(`/api/earthlab/${groupSlug}/courses`);
  return response.data;
}

export async function createCourse(groupSlug: string, data: CourseFormData): Promise<CourseListItem> {
  const response = await axiosInstance.post(`/api/earthlab/${groupSlug}/courses`, data);
  return response.data;
}

export async function fetchCourseDetail(groupSlug: string, courseSlug: string): Promise<CourseDetail> {
  const response = await axiosInstance.get(`/api/earthlab/${groupSlug}/courses/${courseSlug}`);
  return response.data;
}

export async function updateCourse(groupSlug: string, courseSlug: string, data: Partial<CourseFormData>): Promise<CourseDetail> {
  const response = await axiosInstance.patch(`/api/earthlab/${groupSlug}/courses/${courseSlug}`, data);
  return response.data;
}

export async function deleteCourse(groupSlug: string, courseSlug: string): Promise<void> {
  await axiosInstance.delete(`/api/earthlab/${groupSlug}/courses/${courseSlug}`);
}

// ============================================================================
// Lesson CRUD
// ============================================================================

export async function fetchGroupLessons(groupSlug: string): Promise<LessonListItem[]> {
  const response = await axiosInstance.get(`/api/earthlab/${groupSlug}/lessons`);
  return response.data;
}

export async function createLesson(groupSlug: string, data: LessonFormData): Promise<LessonListItem> {
  const response = await axiosInstance.post(`/api/earthlab/${groupSlug}/lessons`, data);
  return response.data;
}

export async function fetchLessonDetail(groupSlug: string, lessonSlug: string): Promise<LessonDetail> {
  const response = await axiosInstance.get(`/api/earthlab/${groupSlug}/lessons/${lessonSlug}`);
  return response.data;
}

export async function updateLesson(groupSlug: string, lessonSlug: string, data: Partial<LessonFormData>): Promise<LessonDetail> {
  const response = await axiosInstance.patch(`/api/earthlab/${groupSlug}/lessons/${lessonSlug}`, data);
  return response.data;
}

export async function deleteLesson(groupSlug: string, lessonSlug: string): Promise<void> {
  await axiosInstance.delete(`/api/earthlab/${groupSlug}/lessons/${lessonSlug}`);
}

// ============================================================================
// Course Items (Outline)
// ============================================================================

export async function addCourseItem(
  groupSlug: string,
  courseSlug: string,
  data: { content_type: string; content_id: string; section_title?: string }
): Promise<CourseItemSummary> {
  const response = await axiosInstance.post(`/api/earthlab/${groupSlug}/courses/${courseSlug}/items`, data);
  return response.data;
}

export async function removeCourseItem(
  groupSlug: string,
  courseSlug: string,
  itemId: string
): Promise<void> {
  await axiosInstance.delete(`/api/earthlab/${groupSlug}/courses/${courseSlug}/items/${itemId}`);
}

export async function reorderCourseItems(
  groupSlug: string,
  courseSlug: string,
  items: { id: string; position: number }[]
): Promise<void> {
  await axiosInstance.post(`/api/earthlab/${groupSlug}/courses/${courseSlug}/items/reorder`, { items });
}

export async function fetchAvailableContent(
  groupSlug: string
): Promise<{ lessons: LessonListItem[]; libraries: { id: string; title: string; slug: string; scope: string }[] }> {
  const response = await axiosInstance.get(`/api/earthlab/${groupSlug}/available-content`);
  return response.data;
}
