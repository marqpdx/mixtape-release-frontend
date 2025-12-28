// src/hooks/lanternmail/useLanternmail.ts

import { useCallback, useState } from "react";
import type {
  GroupLanternmailMember,
  LanternmailList,
  CreateListResponse,
  ListStatsResponse,
  SendInvitationsResponse,
} from "@mixtape/core/types/lanternmailTypes";
import { lanternmailApi } from "@mixtape/api/clients/lanternmail/lanternmailApi";
// import { lanternmailApi } from "@mixtape/api/clients/lanternmail/lanternmailApi";

/**
 * React hook for LanternMail operations
 *
 * Provides state management and error handling around lanternmailApi
 * All API calls proxy through Django → ListMonk
 *
 * @returns Hook functions and loading state
 */
export function useLanternmail() {
  const [loading, setLoading] = useState(false);

  /**
   * Create a mailing list for a group
   *
   * @param groupSlug - URL slug of the group
   * @param groupTitle - Title of the group (for logging)
   * @param listName - Display name for the list
   * @param description - List description
   * @param settings - Optional list configuration
   * @returns Created or existing list
   */
  const createGroupList = useCallback(async (
    groupSlug: string,
    groupTitle: string,
    listName: string,
    description: string,
    settings?: {
      type?: 'public' | 'private';
      optin?: 'single' | 'double';
    }
  ): Promise<CreateListResponse> => {
    setLoading(true);
    try {
      const payload = {
        name: listName,
        description: description,
        type: settings?.type || 'private',
        optin: settings?.optin || 'double'
      };

      const response = await lanternmailApi.createGroupList(groupSlug, payload);

      console.log(response.message.includes('already exists') ?
        "📧 Found existing list:" : "✅ Created list:", response.data.display_name);

      return response;

    } catch (err: any) {
      console.error("❌ Error in createGroupList:", err);
      const message = err.response?.data?.error || err.message || "Failed to create list";
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get all mailing lists for groups the user belongs to
   *
   * @returns All accessible mailing lists
   */
  const getAllGroupLists = useCallback(async (): Promise<LanternmailList[]> => {
    try {
      return await lanternmailApi.getAllUserLists();
    } catch (err: any) {
      console.error("❌ Error in getAllGroupLists:", err);
      const message = err.response?.data?.error || err.message || "Failed to fetch lists";
      throw new Error(message);
    }
  }, []);

  /**
   * Get all mailing lists for a specific group
   *
   * @param groupSlug - URL slug of the group
   * @returns Mailing lists for this group
   */
  const getGroupLists = useCallback(async (groupSlug: string): Promise<LanternmailList[]> => {
    try {
      return await lanternmailApi.getGroupLists(groupSlug);
    } catch (err: any) {
      console.error("❌ Error in getGroupLists:", err);
      const message = err.response?.data?.error || err.message || "Failed to fetch group lists";
      throw new Error(message);
    }
  }, []);

  /**
   * Get detailed information for a specific list
   *
   * @param groupSlug - URL slug of the group
   * @param listId - Django list ID
   * @returns List details with ListMonk stats
   */
  const getListDetails = useCallback(async (groupSlug: string, listId: number): Promise<ListStatsResponse> => {
    try {
      return await lanternmailApi.getListDetails(groupSlug, listId);
    } catch (err: any) {
      console.error("❌ Error in getListDetails:", err);
      const message = err.response?.data?.error || err.message || "Failed to fetch list details";
      throw new Error(message);
    }
  }, []);

  /**
   * Get group members with their subscription status for a specific list
   *
   * @param groupSlug - URL slug of the group
   * @param listId - Django list ID
   * @returns Group members with subscription status
   */
  const getGroupMembers = useCallback(async (
    groupSlug: string,
    listId: number
  ): Promise<GroupLanternmailMember[]> => {
    try {
      return await lanternmailApi.getListMembers(groupSlug, listId);
    } catch (err: any) {
      console.error("❌ Error in getGroupMembers:", err);
      const message = err.response?.data?.error || err.message || "Failed to fetch group members";
      throw new Error(message);
    }
  }, []);

  /**
   * Send invitation emails to subscribe to a list
   *
   * @param groupSlug - URL slug of the group
   * @param listId - Django list ID
   * @param emails - Array of email addresses to invite
   * @returns Invitation results
   */
  const sendInvitations = useCallback(async (
    groupSlug: string,
    listId: number,
    emails: string[]
  ): Promise<SendInvitationsResponse> => {
    try {
      return await lanternmailApi.sendInvitations(groupSlug, listId, emails);
    } catch (err: any) {
      console.error("❌ Error in sendInvitations:", err);
      const message = err.response?.data?.error || err.message || "Failed to send invitations";
      throw new Error(message);
    }
  }, []);

  return {
    createGroupList,
    getAllGroupLists,
    getGroupLists,
    getListDetails,
    getGroupMembers,
    sendInvitations,
    loading,
  };
}
