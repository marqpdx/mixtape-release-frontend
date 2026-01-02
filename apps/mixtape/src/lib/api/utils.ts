// src/lib/api/utils.ts

/**
 * Shared API utility functions
 */

/**
 * Unwrap paginated list responses from Django REST Framework
 *
 * Django often returns paginated data as:
 * { results: [...], count: 10, next: null, previous: null }
 *
 * This helper normalizes the response to always return an array,
 * whether the endpoint is paginated or returns a plain array.
 *
 * @param data - Response data from axios (response.data)
 * @returns Array of items
 *
 * @example
 * ```typescript
 * const response = await axiosInstance.get<GroupsListResponse>('/api/groups');
 * const groups = unwrapListResponse<Group>(response.data);
 * ```
 */
export function unwrapListResponse<T>(data: unknown): T[] {
  // If data has a 'results' property, it's paginated
  if (data && typeof data === 'object' && 'results' in data) {
    const results = (data as { results?: unknown }).results;
    return Array.isArray(results) ? (results as T[]) : [];
  }

  // If data is already an array, return it
  if (Array.isArray(data)) {
    return data;
  }

  // Fallback: empty array
  return [];
}
