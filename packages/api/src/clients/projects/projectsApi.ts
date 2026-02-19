// packages/api/src/clients/projects/projectsApi.ts

import { AxiosError } from 'axios';
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export type ProjectMode = 'list' | 'project';

export interface Project {
  id: string;
  title: string;
  summary: string;
  body: string;
  slug: string;
  mode: ProjectMode;
  archived_at: string | null;
}

export interface ProjectColumn {
  id: string;
  title: string;
  position: number;
  semantic_type: string | null;
  is_hidden: boolean;
}

export interface Task {
  id: string;
  project: string;
  column: string;
  title: string;
  summary: string;
  slug: string;
  position: number;
  completed_at: string | null;
}

export interface ProjectBoard {
  project: Project;
  columns: ProjectColumn[];
  tasks_by_column: Record<string, Task[]>;
}

export interface ProjectCreatePayload {
  title: string;
  summary?: string;
  body?: string;
  mode?: ProjectMode;
  sponsor_content_type: string;
  sponsor_object_id: string;
}

export interface TaskCreatePayload {
  title: string;
  summary?: string;
  column_id?: string;
}

export interface TaskMovePayload {
  to_column_id: string;
  to_index: number;
}

export interface TaskUpdatePayload {
  title?: string;
  summary?: string;
}

export interface ProjectListParams {
  sponsor_type: string;
  sponsor_object_id: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data && typeof error.response.data === 'object') {
      const errors = Object.entries(error.response.data)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      if (errors) return errors;
    }
    return error.message || `HTTP ${error.response?.status}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

class ProjectsApi {
  async createProject(payload: ProjectCreatePayload): Promise<Project> {
    try {
      const response = await axiosInstance.post('/api/projects/projects', payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async fetchBoard(projectId: string): Promise<ProjectBoard> {
    try {
      const response = await axiosInstance.get(`/api/projects/projects/${projectId}/board`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async fetchProjects(params: ProjectListParams): Promise<Project[]> {
    try {
      const response = await axiosInstance.get('/api/projects/projects/list', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async createTask(projectId: string, payload: TaskCreatePayload): Promise<Task> {
    try {
      const response = await axiosInstance.post(`/api/projects/projects/${projectId}/tasks`, payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async moveTask(taskId: string, payload: TaskMovePayload): Promise<{ task: Task }> {
    try {
      const response = await axiosInstance.post(`/api/projects/tasks/${taskId}/move`, payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async updateTask(taskId: string, payload: TaskUpdatePayload): Promise<Task> {
    try {
      const response = await axiosInstance.patch(`/api/projects/tasks/${taskId}`, payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async archiveTask(taskId: string): Promise<void> {
    try {
      await axiosInstance.post(`/api/projects/tasks/${taskId}/archive`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async toggleColumnHidden(projectId: string, columnId: string): Promise<ProjectColumn> {
    try {
      const response = await axiosInstance.patch(
        `/api/projects/projects/${projectId}/columns/${columnId}/toggle-hidden`
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export const projectsApi = new ProjectsApi();
