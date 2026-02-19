// packages/api/src/hooks/projects/useProjects.ts

import { useCallback, useEffect, useState } from 'react';
import {
  Project,
  ProjectBoard,
  ProjectColumn,
  ProjectCreatePayload,
  ProjectListParams,
  Task,
  TaskCreatePayload,
  TaskMovePayload,
  TaskUpdatePayload,
  projectsApi,
} from '../../clients/projects/projectsApi';

interface UseProjectCreateReturn {
  createProject: (payload: ProjectCreatePayload) => Promise<Project>;
  isCreating: boolean;
  error: string | null;
  clearError: () => void;
}

export function useProjectCreate(): UseProjectCreateReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = useCallback(async (payload: ProjectCreatePayload): Promise<Project> => {
    setIsCreating(true);
    setError(null);
    try {
      return await projectsApi.createProject(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setError(message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { createProject, isCreating, error, clearError };
}

interface UseProjectsListReturn {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  loadProjects: (overrideParams?: ProjectListParams) => Promise<void>;
  addProject: (project: Project) => void;
  clearError: () => void;
}

export function useProjectsList(params: ProjectListParams | null): UseProjectsListReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(
    async (overrideParams?: ProjectListParams) => {
      const queryParams = overrideParams ?? params;
      if (!queryParams) {
        setProjects([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await projectsApi.fetchProjects(queryParams);
        setProjects(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load projects';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [params]
  );

  const addProject = useCallback((project: Project) => {
    setProjects(prev => [project, ...prev]);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (params) {
      void loadProjects(params);
    } else {
      setProjects([]);
    }
  }, [params, loadProjects]);

  return {
    projects,
    isLoading,
    error,
    loadProjects,
    addProject,
    clearError,
  };
}

interface UseProjectBoardReturn {
  board: ProjectBoard | null;
  isLoading: boolean;
  error: string | null;
  loadBoard: (overrideId?: string) => Promise<void>;
  createTask: (payload: TaskCreatePayload) => Promise<Task>;
  moveTask: (taskId: string, payload: TaskMovePayload) => Promise<void>;
  updateTask: (taskId: string, payload: TaskUpdatePayload) => Promise<Task>;
  archiveTask: (taskId: string) => Promise<void>;
  toggleColumnHidden: (columnId: string) => Promise<ProjectColumn>;
  setBoard: React.Dispatch<React.SetStateAction<ProjectBoard | null>>;
  clearError: () => void;
}

export function useProjectBoard(projectId: string | null): UseProjectBoardReturn {
  const [board, setBoard] = useState<ProjectBoard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(
    async (overrideId?: string) => {
      const id = overrideId ?? projectId;
      if (!id) {
        setBoard(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await projectsApi.fetchBoard(id);
        setBoard(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load project board';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (projectId) {
      void loadBoard(projectId);
    } else {
      setBoard(null);
    }
  }, [projectId, loadBoard]);

  const createTask = useCallback(
    async (payload: TaskCreatePayload): Promise<Task> => {
      if (!projectId) {
        throw new Error('Project id is required to create tasks.');
      }
      setError(null);
      try {
        const task = await projectsApi.createTask(projectId, payload);
        setBoard(prev => {
          if (!prev) return prev;
          const columnId = task.column;
          const existing = prev.tasks_by_column[columnId] || [];
          const nextTasks = [...existing, task].sort((a, b) => a.position - b.position);
          return {
            ...prev,
            tasks_by_column: {
              ...prev.tasks_by_column,
              [columnId]: nextTasks,
            },
          };
        });
        return task;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create task';
        setError(message);
        throw err;
      }
    },
    [projectId]
  );

  const moveTask = useCallback(
    async (taskId: string, payload: TaskMovePayload): Promise<void> => {
      if (!projectId) {
        throw new Error('Project id is required to move tasks.');
      }
      setError(null);
      try {
        await projectsApi.moveTask(taskId, payload);
        await loadBoard(projectId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to move task';
        setError(message);
        throw err;
      }
    },
    [projectId, loadBoard]
  );

  const updateTask = useCallback(
    async (taskId: string, payload: TaskUpdatePayload): Promise<Task> => {
      setError(null);
      try {
        const updated = await projectsApi.updateTask(taskId, payload);
        setBoard(prev => {
          if (!prev) return prev;
          const newTasks: Record<string, Task[]> = {};
          for (const [colId, tasks] of Object.entries(prev.tasks_by_column)) {
            newTasks[colId] = tasks.map(t => (t.id === taskId ? updated : t));
          }
          return { ...prev, tasks_by_column: newTasks };
        });
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update task';
        setError(message);
        throw err;
      }
    },
    []
  );

  const archiveTask = useCallback(
    async (taskId: string): Promise<void> => {
      setError(null);
      try {
        await projectsApi.archiveTask(taskId);
        setBoard(prev => {
          if (!prev) return prev;
          const newTasks: Record<string, Task[]> = {};
          for (const [colId, tasks] of Object.entries(prev.tasks_by_column)) {
            newTasks[colId] = tasks.filter(t => t.id !== taskId);
          }
          return { ...prev, tasks_by_column: newTasks };
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to archive task';
        setError(message);
        throw err;
      }
    },
    []
  );

  const toggleColumnHidden = useCallback(
    async (columnId: string): Promise<ProjectColumn> => {
      if (!projectId) throw new Error('Project id is required.');
      setError(null);
      try {
        const updated = await projectsApi.toggleColumnHidden(projectId, columnId);
        setBoard(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            columns: prev.columns.map(c => (c.id === columnId ? updated : c)),
          };
        });
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to toggle column';
        setError(message);
        throw err;
      }
    },
    [projectId]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    board,
    isLoading,
    error,
    loadBoard,
    createTask,
    moveTask,
    updateTask,
    archiveTask,
    toggleColumnHidden,
    setBoard,
    clearError,
  };
}
