// packages/api/src/clients/spellbook/spellbookApi.ts

/**
 * Spellbook API Service
 * Handles operations for shared spell dictionary
 */

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { AxiosError } from 'axios';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SpellCorrection {
  id: string;
  wrong_word: string;
  correct_word: string;
  added_by_username: string | null;
  created_at: string;
  usage_count: number;
}

export interface SpellSuggestion {
  id: string;
  wrong_word: string;
  correct_word: string;
  suggested_by_username: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by_username: string | null;
  reviewed_at: string | null;
  review_note: string;
}

export interface SpellCorrectionCreatePayload {
  wrong_word: string;
  correct_word: string;
}

export interface SpellSuggestionCreatePayload {
  wrong_word: string;
  correct_word: string;
}

export interface ApprovalResult {
  suggestion: SpellSuggestion;
  correction: SpellCorrection;
}

export interface UserDictionaryEntryRecord {
  id: string;
  kind: 'ignore' | 'replace';
  token: string;
  display: string;
  replacement: string;
}

export interface UserDictionaryPayload {
  ignores: string[];
  replacements: Record<string, string>;
  entries: UserDictionaryEntryRecord[];
}

export interface UserDictionaryEntryPayload {
  kind: 'ignore' | 'replace';
  token: string;
  display?: string;
  replacement?: string;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response?.data?.wrong_word) {
      return error.response.data.wrong_word;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

// ============================================================================
// API SERVICE CLASS
// ============================================================================

class SpellbookApi {
  private client = axiosInstance;

  // ==========================================================================
  // CORRECTIONS (approved dictionary)
  // ==========================================================================

  /**
   * Get all approved spell corrections
   */
  async getCorrections(): Promise<SpellCorrection[]> {
    try {
      const response = await this.client.get<SpellCorrection[]>('/api/spellbook/');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Add a new spell correction (superadmin only)
   */
  async addCorrection(payload: SpellCorrectionCreatePayload): Promise<SpellCorrection> {
    try {
      const response = await this.client.post<SpellCorrection>('/api/spellbook/', payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Delete a spell correction (superadmin only)
   */
  async deleteCorrection(correctionId: string): Promise<void> {
    try {
      await this.client.delete(`/api/spellbook/${correctionId}/`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Record that a correction was used (increments usage count)
   */
  async recordUsage(correctionId: string): Promise<{ usage_count: number }> {
    try {
      const response = await this.client.post<{ usage_count: number }>(
        `/api/spellbook/${correctionId}/record-usage/`
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // ==========================================================================
  // SUGGESTIONS (user-submitted)
  // ==========================================================================

  /**
   * Get spell suggestions
   * - Regular users: their own suggestions
   * - Superadmins: all pending suggestions (or filter by status)
   */
  async getSuggestions(status?: 'pending' | 'approved' | 'rejected'): Promise<SpellSuggestion[]> {
    try {
      const params = status ? { status } : {};
      const response = await this.client.get<SpellSuggestion[]>('/api/spellbook/suggestions/', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Submit a new spell suggestion
   */
  async submitSuggestion(payload: SpellSuggestionCreatePayload): Promise<SpellSuggestion> {
    try {
      const response = await this.client.post<SpellSuggestion>('/api/spellbook/suggestions/', payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Approve a spell suggestion (superadmin only)
   */
  async approveSuggestion(suggestionId: string): Promise<ApprovalResult> {
    try {
      const response = await this.client.post<ApprovalResult>(
        `/api/spellbook/suggestions/${suggestionId}/approve/`
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Reject a spell suggestion (superadmin only)
   */
  async rejectSuggestion(suggestionId: string, note?: string): Promise<SpellSuggestion> {
    try {
      const response = await this.client.post<SpellSuggestion>(
        `/api/spellbook/suggestions/${suggestionId}/reject/`,
        { note }
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async getUserDictionary(): Promise<UserDictionaryPayload> {
    try {
      const response = await this.client.get<UserDictionaryPayload>('/api/spellbook/dictionary');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async upsertUserDictionaryEntry(payload: UserDictionaryEntryPayload): Promise<UserDictionaryEntryRecord> {
    try {
      const response = await this.client.post('/api/spellbook/dictionary/entries', payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async deleteUserDictionaryEntry(entryId: string): Promise<void> {
    try {
      await this.client.delete(`/api/spellbook/dictionary/entries/${entryId}/`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export const spellbookApi = new SpellbookApi();
export default spellbookApi;
