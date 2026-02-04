// packages/api/src/clients/lists/listsApi.ts

/**
 * Lists API Service
 * Handles CRUD operations for Lists (lightweight capture surface)
 */

import { axiosInstance } from '../../lib/axiosInstance';
import { AxiosError } from 'axios';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ItemType = 'action_open' | 'action_done' | 'note';

export interface DueInfo {
  raw: string;
  parsed: string | null;  // ISO datetime string
  needs_review: boolean;
}

export interface ListItem {
  type: ItemType;
  text: string;           // Display text (without /due directive)
  text_raw: string;       // Original text (with /due directive)
  index: number;
  parent_index: number | null;
  children: ListItem[];
  is_completed: boolean;
  is_action: boolean;
  due: DueInfo | null;
}

export interface ListStats {
  total: number;
  open: number;
  done: number;
  notes: number;
}

export interface ListDetail {
  id: string;
  title: string;
  summary: string;
  slug: string;
  body_text: string;
  items: ListItem[];
  stats: ListStats;
  sponsor_content_type: string;
  sponsor_object_id: string;
  sponsor_type: string;
  created_at: string;
  updated_at: string;
}

export interface ListCreatePayload {
  title: string;
  body_text?: string;
  sponsor_content_type?: string;
  sponsor_object_id?: string;
}

export interface ListUpdatePayload {
  title?: string;
  body_text?: string;
  summary?: string;
}

export interface ListReorderPayload {
  from_index: number;
  to_index: number;
}

/**
 * Helper to extract error message from Axios error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.non_field_errors) {
      return Array.isArray(error.response.data.non_field_errors)
        ? error.response.data.non_field_errors.join(', ')
        : error.response.data.non_field_errors;
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

class ListsApi {
  constructor(private client = axiosInstance) {}

  // =========================================================================
  // LIST CRUD
  // =========================================================================

  /**
   * Get lists for current user or specified sponsor
   */
  async getLists(params?: {
    sponsor_type?: string;
    sponsor_object_id?: string;
  }): Promise<ListDetail[]> {
    try {
      const response = await this.client.get('/api/lists/', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Create a new list
   */
  async createList(payload: ListCreatePayload): Promise<ListDetail> {
    try {
      const response = await this.client.post('/api/lists/', payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get a list by ID
   */
  async getList(listId: string): Promise<ListDetail> {
    try {
      const response = await this.client.get(`/api/lists/${listId}/`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get a list by slug (for current user)
   */
  async getListBySlug(slug: string): Promise<ListDetail> {
    try {
      const response = await this.client.get(`/api/lists/by-slug/${slug}/`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Search lists by title/slug
   */
  async searchLists(query: string): Promise<ListDetail[]> {
    try {
      const response = await this.client.get('/api/lists/search/', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update a list
   */
  async updateList(listId: string, payload: ListUpdatePayload): Promise<ListDetail> {
    try {
      const response = await this.client.patch(`/api/lists/${listId}/`, payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Delete a list (soft delete)
   */
  async deleteList(listId: string): Promise<void> {
    try {
      await this.client.delete(`/api/lists/${listId}/`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // =========================================================================
  // ITEM OPERATIONS
  // =========================================================================

  /**
   * Toggle item completion status (- <-> x)
   */
  async toggleItem(listId: string, itemIndex: number): Promise<ListDetail> {
    try {
      const response = await this.client.post(
        `/api/lists/${listId}/items/${itemIndex}/toggle`
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Reorder a top-level item
   */
  async reorderItems(listId: string, payload: ListReorderPayload): Promise<ListDetail> {
    try {
      const response = await this.client.post(
        `/api/lists/${listId}/reorder`,
        payload
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

// Export singleton instance
export const listsApi = new ListsApi();
