// packages/api/src/clients/admin/adminApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export interface AdminTodoItem {
  id: number;
  title: string;
  is_completed: boolean;
  completed_date: string | null;
}

export interface CompleteAdminTodoPayload {
  is_completed: boolean;
  completed_date: string;
}

export async function fetchAdminSystemStats(): Promise<Record<string, unknown>> {
  const res = await axiosInstance.get('/api/admin/system-stats');
  return res.data as Record<string, unknown>;
}

export async function fetchAdminUserMetrics(): Promise<Record<string, unknown>> {
  const res = await axiosInstance.get('/api/admin/user-metrics');
  return res.data as Record<string, unknown>;
}

export async function fetchAdminTodos(): Promise<AdminTodoItem[]> {
  const res = await axiosInstance.get('/api/content/todo');
  return res.data as AdminTodoItem[];
}

export async function completeAdminTodo(
  id: number,
  payload: CompleteAdminTodoPayload
): Promise<AdminTodoItem> {
  const res = await axiosInstance.patch(`/api/content/todo/${id}`, payload);
  return res.data as AdminTodoItem;
}
