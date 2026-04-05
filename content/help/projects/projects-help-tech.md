---
title: Projects — Technical Reference
subsystem: projects
area: overview-tech
excerpt: Technical reference for the Projects feature. Covers Kanban board structure, task and column models, and admin controls.
routes:
  - /projects
  - /projects/*
workAreas:
  - ProjectsWorkArea
tags:
  - projects
  - kanban
  - admin
  - technical
---

# Projects — Technical Reference

---

## For admins

### Create a project

- Go to your group's admin area → Projects.
- Create a new project with a name. The project is owned by your group.

### Manage columns and tasks

- Add, rename, or reorder columns on the Kanban board.
- Create tasks and assign them to columns.
- Drag tasks between columns to update their status.

### Archive a project

- Archived projects are no longer active but are preserved for reference.
- Use the Archive action from the project's admin menu.

### Hide / show a project

- Use the `toggle-hidden` action to hide a project from regular members without archiving it.
- Hidden projects remain accessible to admins.

---

## API reference

All endpoints require authentication. The requesting user must be a member of the sponsoring group. Non-members receive a 404, not a 403.

### Projects

| Method | Route | Description | Permission |
|--------|-------|-------------|------------|
| GET | `/api/projects/` | List projects for groups the user is a member of | Group member |
| POST | `/api/projects/` | Create a project | Group admin/owner |
| GET | `/api/projects/{project_id}/` | Project detail | Group member |
| PUT | `/api/projects/{project_id}/` | Update project | Group admin/owner |
| POST | `/api/projects/{project_id}/archive/` | Archive project | Group admin/owner |
| POST | `/api/projects/{project_id}/toggle-hidden/` | Toggle project visibility | Group admin/owner |

### Board

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/projects/{project_id}/board/` | Full Kanban board with columns and tasks |
| POST | `/api/projects/{project_id}/tasks/` | Create a task |
| PUT | `/api/projects/{project_id}/tasks/{task_id}/` | Update task (move between columns, reorder) |

**Task creation fields:** `column_id`, `title`, `position` (optional — appended to end if omitted).

---

## Known gotchas

- **Concurrent task creation:** The system uses database-level locking to prevent duplicate positions. Very high-volume concurrent creates are not optimized for.
- **Board reload on move (Q2 — open):** When a task is moved between columns, the client reloads the entire board rather than applying the column ordering payload from the API response. No user-visible impact but relevant for integrators watching network traffic.
- **Sponsor validation (Q3 — open):** Sponsor group checks in project create/list views behave slightly differently from the shared permissions helper — a missing/inactive group returns 404 in the views but `False` in the helper. Intentional, but behavior may diverge if the helper is called directly.

---

## Related features

- **Groups** — Projects are scoped to groups. Group membership is required for all access.
- **Activity** — Task updates and project creation may generate activity feed entries.
