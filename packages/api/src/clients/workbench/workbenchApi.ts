// packages/api/src/clients/workbench/workbenchApi.ts

/**
 * Workbench API Service
 * Handles Phase 4 Review Queue and MillDraft authoring
 * Uses axiosInstance for consistent headers, auth, and interceptors
 */

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { AxiosError } from 'axios';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type MillDraftStatus = 'candidate' | 'active' | 'ready_to_promote' | 'promoted' | 'archived';
export type SponsorType = 'user' | 'group';
export type SourceType = 'stackroom' | 'concord' | 'gristmill' | 'copydesk' | 'in-editor' | 'manual';
export type PublishSafetyClass = 'psc_0' | 'psc_1' | 'psc_2';
export type ValidationState = 'unvalidated' | 'valid' | 'invalid' | 'warnings';

export interface MillDraftListItem {
  id: string;
  status: MillDraftStatus;
  content_profile: string;
  title: string;
  summary: string;
  source_type: SourceType;
  source_id: string;
  source_display_name: string;
  sponsor_type: SponsorType;
  sponsor_id: string;
  author: string;
  author_name: string;
  author_display_name: string;
  is_valid: boolean;
  has_validation_errors: boolean;
  created_at: string;
  updated_at: string;
  status_changed_at: string | null;
}

export interface MillDraftDetail {
  id: string;
  status: MillDraftStatus;
  content_profile: string;
  title: string;
  summary: string;
  grist_body: string;
  ast: any | null;
  ast_generation_error: string | null;
  source_type: SourceType;
  source_id: string;
  provenance_bundle: Record<string, any>;
  sponsor_type: SponsorType;
  sponsor_id: string;
  author: string | null;
  author_name: string;
  submitted_by: string;
  canonical_content_type: number | null;
  canonical_object_id: string | null;
  canonical_object_type: string | null;
  canonical_version: number;
  validation_state: ValidationState;
  validation_last_run: string | null;
  validation_errors: any[];
  validation_warnings: any[];
  is_valid: boolean;
  created_at: string;
  updated_at: string;
  status_changed_at: string | null;
  promoted_at: string | null;
  promoted_by: string | null;
  archived_at: string | null;
  archived_by: string | null;
}

export interface MillDraftCreatePayload {
  sponsor_type: SponsorType;
  sponsor_id: string;
  content_profile: string;
  title: string;
  summary?: string;
  grist_body?: string;
  source_type?: SourceType;
  source_id?: string;
  provenance_bundle?: Record<string, any>;
  author_name?: string;
}

export interface MillDraftUpdatePayload {
  title?: string;
  summary?: string;
  grist_body?: string;
  ast?: any;
  author_name?: string;
}

export interface MillDraftActionPayload {
  action: 'discard' | 'approve' | 'open' | 'promote' | 'archive' | 'reactivate';
}

export interface MillDraftActionResponse {
  message: string;
  draft: MillDraftDetail;
}

export interface MillDraftValidationPayload {
  hard?: boolean;
}

export interface MillDraftValidationResponse {
  is_valid: boolean;
  validation_state: ValidationState;
  errors: any[];
  warnings: any[];
}

export interface ContentProfileConfig {
  id: string;
  profile_name: string;
  display_name: string;
  description: string;
  publish_safety_class: PublishSafetyClass;
  field_risk_rules: Record<string, any>;
  validation_schema: Record<string, any>;
  required_fields: string[];
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MillDraftListParams {
  sponsor_type: SponsorType;
  sponsor_id: string;
  status?: MillDraftStatus;
  content_profile?: string;
  source_type?: SourceType;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Helper to extract error message from Axios error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    // Check if backend returned a detail message
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    // Check for error message
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    // Check for non_field_errors (DRF ValidationError)
    if (error.response?.data?.non_field_errors) {
      return Array.isArray(error.response.data.non_field_errors)
        ? error.response.data.non_field_errors.join(', ')
        : error.response.data.non_field_errors;
    }
    // Check for field-level errors
    if (error.response?.data && typeof error.response.data === 'object') {
      const errors = Object.entries(error.response.data)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      if (errors) return errors;
    }
    // Fallback to status message
    return error.message || `HTTP ${error.response?.status}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

class WorkbenchApi {
  /**
   * Constructor - axiosInstance is passed in to allow for testing
   * and flexibility in different environments
   */
  constructor(private client = axiosInstance) {}

  // =========================================================================
  // MILLDRAFT MANAGEMENT
  // =========================================================================

  /**
   * List drafts for a sponsor (with optional filters)
   */
  async listDrafts(params: MillDraftListParams): Promise<MillDraftListItem[]> {
    try {
      const response = await this.client.get('/api/workbench/drafts/', { params });
      return response.data.results || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get Review Queue (candidates only)
   */
  async getReviewQueue(params: {
    sponsor_type: SponsorType;
    sponsor_id: string;
  }): Promise<MillDraftListItem[]> {
    try {
      const response = await this.client.get('/api/workbench/drafts/queue/', { params });
      return response.data.results || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Create new draft
   */
  async createDraft(payload: MillDraftCreatePayload): Promise<MillDraftDetail> {
    try {
      const response = await this.client.post('/api/workbench/drafts/', payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get draft by ID
   */
  async getDraft(draftId: string): Promise<MillDraftDetail> {
    try {
      const response = await this.client.get(`/api/workbench/drafts/${draftId}/`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update draft (editing)
   */
  async updateDraft(
    draftId: string,
    payload: MillDraftUpdatePayload
  ): Promise<MillDraftDetail> {
    try {
      const response = await this.client.patch(`/api/workbench/drafts/${draftId}/`, payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Perform action on draft
   */
  async performAction(
    draftId: string,
    payload: MillDraftActionPayload
  ): Promise<MillDraftActionResponse> {
    try {
      const response = await this.client.post(
        `/api/workbench/drafts/${draftId}/perform-action/`,
        payload
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Validate draft
   */
  async validateDraft(
    draftId: string,
    payload: MillDraftValidationPayload = {}
  ): Promise<MillDraftValidationResponse> {
    try {
      const response = await this.client.post(
        `/api/workbench/drafts/${draftId}/validate/`,
        payload
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // =========================================================================
  // CONTENT PROFILE CONFIGURATION
  // =========================================================================

  /**
   * List enabled content profiles
   */
  async listProfiles(): Promise<ContentProfileConfig[]> {
    try {
      const response = await this.client.get('/api/workbench/profiles/');
      return response.data.results || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get profile configuration by name
   */
  async getProfile(profileName: string): Promise<ContentProfileConfig> {
    try {
      const response = await this.client.get(`/api/workbench/profiles/${profileName}/`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

// Export singleton instance
export const workbenchApi = new WorkbenchApi();
