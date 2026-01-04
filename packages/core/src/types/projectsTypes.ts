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
