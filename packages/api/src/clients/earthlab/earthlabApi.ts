// packages/api/src/clients/earthlab/earthlabApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  difficulty_level: string;
  delivery_type: string;
  estimated_duration: number | null;
  flow_mode: string;
  created_at: string;
  updated_at: string;
}

export interface LessonListItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  difficulty_level: string;
  estimated_duration: number | null;
  created_at: string;
  updated_at: string;
}

export async function fetchGroupCourses(groupSlug: string): Promise<CourseListItem[]> {
  const response = await axiosInstance.get(`/api/earthlab/${groupSlug}/courses`);
  return response.data;
}

export async function fetchGroupLessons(groupSlug: string): Promise<LessonListItem[]> {
  const response = await axiosInstance.get(`/api/earthlab/${groupSlug}/lessons`);
  return response.data;
}
