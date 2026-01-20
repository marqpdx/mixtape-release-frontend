// packages/api/src/hooks/admin/useAdmin.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminSystemStats,
  fetchAdminUserMetrics,
  fetchAdminTodos,
  completeAdminTodo,
  AdminTodoItem,
} from '../../clients/admin/adminApi';

export const adminQueryKeys = {
  all: ['admin'] as const,
  systemStats: () => [adminQueryKeys.all, 'system-stats'] as const,
  userMetrics: () => [adminQueryKeys.all, 'user-metrics'] as const,
  todos: () => [adminQueryKeys.all, 'todos'] as const,
};

interface AdminQueryOptions {
  enabled?: boolean;
}

export const useAdminSystemStats = ({ enabled = true }: AdminQueryOptions = {}) => {
  return useQuery({
    queryKey: adminQueryKeys.systemStats(),
    queryFn: fetchAdminSystemStats,
    enabled,
    refetchOnWindowFocus: false,
  });
};

export const useAdminUserMetrics = ({ enabled = true }: AdminQueryOptions = {}) => {
  return useQuery({
    queryKey: adminQueryKeys.userMetrics(),
    queryFn: fetchAdminUserMetrics,
    enabled,
    refetchOnWindowFocus: false,
  });
};

export const useAdminTodos = ({ enabled = true }: AdminQueryOptions = {}) => {
  return useQuery<AdminTodoItem[]>({
    queryKey: adminQueryKeys.todos(),
    queryFn: fetchAdminTodos,
    enabled,
    refetchOnWindowFocus: false,
  });
};

export const useCompleteAdminTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      completeAdminTodo(id, {
        is_completed: true,
        completed_date: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.todos() });
    },
  });
};
