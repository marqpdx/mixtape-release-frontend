// src/lib/earthlab/moduleApi.ts

/**
 * Module API Client
 *
 * Handles all HTTP requests related to modules.
 *
 * NEW primary backend path (group-sponsored library):
 *   /api/groups/{groupSlug}/earthlab/modules
 *
 * Modules are *sponsored* by a Group (or Member, later),
 * and then attached to Courses via separate composition endpoints:
 *   /api/earthlab/courses/{courseId}/add-module/{moduleId}
 *   /api/earthlab/courses/{courseId}/modules
 */

import {
  ModuleCreatePayload,
  ModuleResponse,
  ModuleUpdatePayload,
  ReorderPayload,
} from '@content/earthlabTypes';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';

// Sponsor-scoped base (group library)
const BASE_URL = '/api/groups';

// Course-scoped base (composition / structure)
const COURSE_BASE_URL = '/api/earthlab/courses';

// ============================================================================
// GROUP-SPONSORED MODULE LIBRARY (PRIMARY INTERFACE)
// ============================================================================

/**
 * Get all modules for a sponsoring group
 *
 * GET /api/groups/{groupSlug}/earthlab/modules
 *
 * @param groupSlug - slug of the group sponsoring the modules
 */
export async function listModules(
  groupSlug: string,
  options?: {
    status?: 'draft' | 'published' | 'archived';
    ordering?: string;
    search?: string;
  }
): Promise<ModuleResponse[]> {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.ordering) params.append('ordering', options.ordering);
  if (options?.search) params.append('search', options.search);

  const response = await axiosInstance.get<ModuleResponse[] | { results: ModuleResponse[] }>(
    `${BASE_URL}/${groupSlug}/earthlab/modules`,
    { params }
  );

  if (Array.isArray(response.data)) {
    // Direct array response
    return response.data;
  }

  if (response.data && Array.isArray((response.data as any).results)) {
    // Paginated { results: [...] } response
    return (response.data as any).results;
  }

  console.warn('Unexpected API response structure for listModules:', response.data);
  return [];
}

/**
 * Get a single module by ID within a group's library
 *
 * GET /api/groups/{groupSlug}/earthlab/modules/{moduleId}
 */
export async function getModule(
  groupSlug: string,
  moduleId: string
): Promise<ModuleResponse> {
  const response = await axiosInstance.get<ModuleResponse>(
    `${BASE_URL}/${groupSlug}/earthlab/modules/${moduleId}`
  );
  return response.data;
}

/**
 * Create a new module sponsored by a group
 *
 * POST /api/groups/{groupSlug}/earthlab/modules
 */
export async function createModule(
  groupSlug: string,
  payload: ModuleCreatePayload
): Promise<ModuleResponse> {
  const response = await axiosInstance.post<ModuleResponse>(
    `${BASE_URL}/${groupSlug}/earthlab/modules`,
    payload
  );
  return response.data;
}

/**
 * Update an existing module in a group's library
 *
 * PATCH /api/groups/{groupSlug}/earthlab/modules/{moduleId}
 */
export async function updateModule(
  groupSlug: string,
  moduleId: string,
  payload: ModuleUpdatePayload
): Promise<ModuleResponse> {
  const response = await axiosInstance.patch<ModuleResponse>(
    `${BASE_URL}/${groupSlug}/earthlab/modules/${moduleId}`,
    payload
  );
  return response.data;
}

/**
 * Delete a module from a group's library
 *
 * DELETE /api/groups/{groupSlug}/earthlab/modules/{moduleId}
 */
export async function deleteModule(
  groupSlug: string,
  moduleId: string
): Promise<void> {
  await axiosInstance.delete(`${BASE_URL}/${groupSlug}/earthlab/modules/${moduleId}`);
}

// ============================================================================
// PUBLISHING / ARCHIVING (GROUP LIBRARY)
// ============================================================================

/**
 * Publish a module in the group's library
 *
 * POST /api/groups/{groupSlug}/earthlab/modules/{moduleId}/publish
 */
export async function publishModule(
  groupSlug: string,
  moduleId: string
): Promise<ModuleResponse> {
  const response = await axiosInstance.post<ModuleResponse>(
    `${BASE_URL}/${groupSlug}/earthlab/modules/${moduleId}/publish`,
    { status: 'published' }
  );
  return response.data;
}

/**
 * Unpublish a module (back to draft) in the group's library
 *
 * POST /api/groups/{groupSlug}/earthlab/modules/{moduleId}/unpublish
 */
export async function unpublishModule(
  groupSlug: string,
  moduleId: string
): Promise<ModuleResponse> {
  const response = await axiosInstance.post<ModuleResponse>(
    `${BASE_URL}/${groupSlug}/earthlab/modules/${moduleId}/unpublish`,
    { status: 'draft' }
  );
  return response.data;
}

/**
 * Archive a module in the group's library
 *
 * POST /api/groups/{groupSlug}/earthlab/modules/{moduleId}/archive
 */
export async function archiveModule(
  groupSlug: string,
  moduleId: string
): Promise<ModuleResponse> {
  const response = await axiosInstance.post<ModuleResponse>(
    `${BASE_URL}/${groupSlug}/earthlab/modules/${moduleId}/archive`,
    { status: 'archived' }
  );
  return response.data;
}

// ============================================================================
// REORDERING (WITHIN GROUP LIBRARY)
// ============================================================================

/**
 * Reorder modules within a group's library
 *
 * POST /api/groups/{groupSlug}/earthlab/modules/reorder
 *
 * payload: { items: [{ id, order }, ...] }
 */
export async function reorder(
  groupSlug: string,
  payload: ReorderPayload
): Promise<ModuleResponse[]> {
  const response = await axiosInstance.post<ModuleResponse[]>(
    `${BASE_URL}/${groupSlug}/earthlab/modules/reorder`,
    payload
  );
  return response.data;
}

// ============================================================================
// COURSE-SCOPED READ HELPERS (STRUCTURE VIEW)
// ============================================================================
// These hit the composition/listing endpoints, not the sponsor endpoints.
// They are useful for the left-hand “course structure” pane.

/**
 * List modules attached to a course
 *
 * GET /api/earthlab/courses/{courseId}/modules
 */
export async function listCourseModules(
  courseId: string
): Promise<ModuleResponse[]> {
  const response = await axiosInstance.get<ModuleResponse[] | { results: ModuleResponse[] }>(
    `${COURSE_BASE_URL}/${courseId}/modules`
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (response.data && Array.isArray((response.data as any).results)) {
    return (response.data as any).results;
  }

  console.warn('Unexpected API response structure for listCourseModules:', response.data);
  return [];
}

/**
 * Reorder modules within a course
 *
 * POST /api/earthlab/courses/{courseId}/modules/reorder
 */
export async function reorderCourseModules(
  courseId: string,
  payload: ReorderPayload
): Promise<ModuleResponse[]> {
  const response = await axiosInstance.post<ModuleResponse[]>(
    `${COURSE_BASE_URL}/${courseId}/modules/reorder`,
    payload
  );
  return response.data;
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export function parseModuleError(error: unknown): string {
  if (error instanceof Error) {
    const data = (error as any).response?.data;
    if (data?.error) return data.error;
    if (data?.detail) return data.detail;
    return error.message;
  }
  return 'Unknown error occurred';
}


// // src/lib/earthlab/moduleApi.ts

// /**
//  * Module API Client
//  *
//  * Handles all HTTP requests related to modules.
//  *
//  * NEW backend path (group-sponsored):
//  *   /api/groups/{groupSlug}/earthlab/modules
//  *
//  * Modules are *sponsored* by a Group (or Member, later),
//  * and then attached to Courses in separate endpoints.
//  */

// import {
//   ModuleCreatePayload,
//   ModuleResponse,
//   ModuleUpdatePayload,
//   ReorderPayload,
// } from '@content/earthlabTypes';
// import { axiosInstance } from '@providers/auth-provider/axiosInstance';

// // Sponsor-scoped base
// const BASE_URL = '/api/groups';

// // ============================================================================
// // CRUD OPERATIONS (GROUP-SPONSORED MODULE LIBRARY)
// // ============================================================================

// /**
//  * Get all modules for a sponsoring group
//  *
//  * GET /api/groups/{groupSlug}/earthlab/modules
//  *
//  * @param groupSlug - slug of the group sponsoring the modules
//  */
// export async function listModules(
//   groupSlug: string,
//   options?: {
//     status?: 'draft' | 'published' | 'archived';
//     ordering?: string;
//   }
// ): Promise<ModuleResponse[]> {
//   const params = new URLSearchParams();
//   if (options?.status) params.append('status', options.status);
//   if (options?.ordering) params.append('ordering', options.ordering);

//   const response = await axiosInstance.get<ModuleResponse[] | { results: ModuleResponse[] }>(
//     `${BASE_URL}/${groupSlug}/earthlab/modules`,
//     { params }
//   );

//   if (Array.isArray(response.data)) {
//     return response.data;
//   }

//   if (response.data && Array.isArray((response.data as any).results)) {
//     return (response.data as any).results;
//   }

//   console.warn('Unexpected API response structure for listModules:', response.data);
//   return [];
// }

// /**
//  * Get a single module by ID within a group's library
//  *
//  * GET /api/groups/{groupSlug}/earthlab/modules/{moduleId}
//  */
// export async function getModule(
//   groupSlug: string,
//   moduleId: string
// ): Promise<ModuleResponse> {
//   const response = await axiosInstance.get<ModuleResponse>(
//     `${BASE_URL}/${groupSlug}/earthlab/modules/${moduleId}`
//   );
//   return response.data;
// }

// /**
//  * Create a new module sponsored by a group
//  *
//  * POST /api/groups/{groupSlug}/earthlab/modules
//  */
// export async function createModule(
//   groupSlug: string,
//   payload: ModuleCreatePayload
// ): Promise<ModuleResponse> {
//   const response = await axiosInstance.post<ModuleResponse>(
//     `${BASE_URL}/${groupSlug}/earthlab/modules`,
//     payload
//   );
//   return response.data;
// }

// /**
//  * Update an existing module in a group's library
//  *
//  * PATCH /api/groups/{groupSlug}/earthlab/modules/{moduleId}
//  */
// export async function updateModule(
//   groupSlug: string,
//   moduleId: string,
//   payload: ModuleUpdatePayload
// ): Promise<ModuleResponse> {
//   const response = await axiosInstance.patch<ModuleResponse>(
//     `${BASE_URL}/${groupSlug}/earthlab/modules/${moduleId}`,
//     payload
//   );
//   return response.data;
// }

// /**
//  * Delete a module from a group's library
//  *
//  * DELETE /api/groups/{groupSlug}/earthlab/modules/{moduleId}
//  */
// export async function deleteModule(
//   groupSlug: string,
//   moduleId: string
// ): Promise<void> {
//   await axiosInstance.delete(`${BASE_URL}/${groupSlug}/earthlab/modules/${moduleId}`);
// }

// // ============================================================================
// // PUBLISHING / ARCHIVING
// // ============================================================================

// export async function publishModule(
//   groupSlug: string,
//   moduleId: string
// ): Promise<ModuleResponse> {
//   const response = await axiosInstance.post<ModuleResponse>(
//     `${BASE_URL}/${groupSlug}/earthlab/modules/${moduleId}/publish`,
//     { status: 'published' }
//   );
//   return response.data;
// }

// export async function unpublishModule(
//   groupSlug: string,
//   moduleId: string
// ): Promise<ModuleResponse> {
//   const response = await axiosInstance.post<ModuleResponse>(
//     `${BASE_URL}/${groupSlug}/earthlab/modules/${moduleId}/unpublish`,
//     { status: 'draft' }
//   );
//   return response.data;
// }

// export async function archiveModule(
//   groupSlug: string,
//   moduleId: string
// ): Promise<ModuleResponse> {
//   const response = await axiosInstance.post<ModuleResponse>(
//     `${BASE_URL}/${groupSlug}/earthlab/modules/${moduleId}/archive`,
//     { status: 'archived' }
//   );
//   return response.data;
// }

// // ============================================================================
// // REORDERING (within a group's library)
// // ============================================================================

// export async function reorder(
//   groupSlug: string,
//   payload: ReorderPayload
// ): Promise<ModuleResponse[]> {
//   const response = await axiosInstance.post<ModuleResponse[]>(
//     `${BASE_URL}/${groupSlug}/earthlab/modules/reorder`,
//     payload
//   );
//   return response.data;
// }

// // ============================================================================
// // ERROR HANDLING UTILITIES
// // ============================================================================

// export function parseModuleError(error: unknown): string {
//   if (error instanceof Error) {
//     const data = (error as any).response?.data;
//     if (data?.error) return data.error;
//     if (data?.detail) return data.detail;
//     return error.message;
//   }
//   return 'Unknown error occurred';
// }
