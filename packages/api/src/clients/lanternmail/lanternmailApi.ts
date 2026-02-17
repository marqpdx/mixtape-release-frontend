// src/lib/lanternmail/lanternmailApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import type {
  LanternmailList,
  GroupLanternmailMember,
  CreateListResponse,
  ListStatsResponse,
  SendInvitationsResponse,
  AllSubscribersResponse,
  LanternmailCampaign,
  CampaignsResponse,
} from "@mixtape/core/types/lanternmailTypes";

/**
 * LanternMail API Client
 *
 * All calls proxy through Django → ListMonk
 * Backend endpoints: /api/lantern/*
 *
 * Architecture:
 * - Frontend → Django (auth, permissions, business logic)
 * - Django → ListMonk (email list management)
 * - Never call ListMonk directly from frontend
 */

// ============================================================================
// Lists Management
// ============================================================================

export const lanternmailApi = {

  /**
   * Create a mailing list for a group
   *
   * POST /api/groups/{groupSlug}/lanternmail/mailing-lists/create
   *
   * @param groupSlug - URL slug of the group
   * @param data - List configuration
   * @returns Created list or existing list if duplicate
   */
  async createGroupList(
    groupSlug: string,
    data: {
      name: string;
      description: string;
      type?: 'public' | 'private';
      optin?: 'single' | 'double';
    }
  ): Promise<CreateListResponse> {
    const res = await axiosInstance.post(
      `/api/groups/${groupSlug}/lanternmail/mailing-lists/create`,
      data
    );
    return res.data;
  },

  /**
   * Get all mailing lists for a specific group
   *
   * GET /api/groups/{groupSlug}/lanternmail/mailing-lists
   *
   * @param groupSlug - URL slug of the group
   * @returns Array of mailing lists for this group
   */
  async getGroupLists(groupSlug: string): Promise<LanternmailList[]> {
    const res = await axiosInstance.get(
      `/api/groups/${groupSlug}/lanternmail/mailing-lists`
    );
    return res.data?.data || [];
  },

  /**
   * Get all mailing lists for groups the current user belongs to
   *
   * GET /api/lanternmail/my-lists
   *
   * @returns Array of all accessible mailing lists
   */
  async getAllUserLists(): Promise<LanternmailList[]> {
    const res = await axiosInstance.get(`/api/lanternmail/my-lists`);
    return res.data?.data || [];
  },

  /**
   * Get detailed information for a specific list
   * Includes ListMonk stats (subscriber count, campaign count)
   *
   * GET /api/groups/{groupSlug}/lanternmail/mailing-lists/{list_id}
   *
   * @param groupSlug - URL slug of the group
   * @param listId - Django list ID (not ListMonk ID)
   * @returns List details with stats
   */
  async getListDetails(groupSlug: string, listId: number): Promise<ListStatsResponse> {
    const res = await axiosInstance.get(
      `/api/groups/${groupSlug}/lanternmail/mailing-lists/${listId}`
    );
    return res.data.data;
  },

  /**
   * Toggle a list's active status
   *
   * PATCH /api/groups/{groupSlug}/lanternmail/mailing-lists/{list_id}/toggle
   *
   * @param groupSlug - URL slug of the group
   * @param listId - Django list ID
   * @returns Updated active status
   */
  async toggleList(groupSlug: string, listId: number): Promise<{ id: number; is_active: boolean }> {
    const res = await axiosInstance.patch(
      `/api/groups/${groupSlug}/lanternmail/mailing-lists/${listId}/toggle`
    );
    return res.data.data;
  },

  // ============================================================================
  // Subscribers Management
  // ============================================================================

  /**
   * Get group members with their subscription status for a specific list
   *
   * GET /api/groups/{groupSlug}/lanternmail/mailing-lists/{list_id}/subscribers
   *
   * Shows which group members are:
   * - subscribed (confirmed)
   * - pending (invitation sent, not confirmed)
   * - unsubscribed
   * - never_invited
   *
   * @param groupSlug - URL slug of the group
   * @param listId - Django list ID
   * @returns Group members with subscription status for this list
   */
  async getListMembers(
    groupSlug: string,
    listId: number
  ): Promise<GroupLanternmailMember[]> {
    const res = await axiosInstance.get(
      `/api/groups/${groupSlug}/lanternmail/mailing-lists/${listId}/subscribers`
    );
    return res.data.data || [];
  },

  /**
   * Get all subscribers across all group lists
   * Optionally filter by specific list
   *
   * GET /api/groups/{groupSlug}/lanternmail/subscribers
   *
   * Returns aggregated subscriber data:
   * - overall_subscription_status across all lists
   * - subscribed_lists_count
   * - pending_lists_count
   * - total_lists
   *
   * @param groupSlug - URL slug of the group
   * @param params - Optional filter parameters
   * @returns All subscribers with aggregated stats
   */
  async getAllGroupSubscribers(
    groupSlug: string,
    params?: { list_id?: number | null }
  ): Promise<AllSubscribersResponse> {
    const res = await axiosInstance.get(
      `/api/groups/${groupSlug}/lanternmail/subscribers`,
      {
        params: params?.list_id ? { list_id: params.list_id } : undefined
      }
    );
    return res.data;
  },

  /**
   * Send invitation emails to subscribe to a list
   *
   * POST /api/groups/{groupSlug}/lanternmail/mailing-lists/{list_id}/invitations
   *
   * Handles:
   * - New subscribers (creates in ListMonk with double opt-in)
   * - Existing subscribers (adds to list, sends opt-in email)
   * - Previously unsubscribed (re-invites)
   * - Already subscribed (skips, returns in response)
   *
   * @param groupSlug - URL slug of the group
   * @param listId - Django list ID
   * @param emails - Array of email addresses to invite
   * @returns Success count and details
   */
  async sendInvitations(
    groupSlug: string,
    listId: number,
    emails: string[]
  ): Promise<SendInvitationsResponse> {
    const res = await axiosInstance.post(
      `/api/groups/${groupSlug}/lanternmail/mailing-lists/${listId}/invitations`,
      { emails }
    );
    return res.data;
  },

  /**
   * Remove a subscriber from a specific list
   *
   * POST /api/groups/{groupSlug}/lanternmail/mailing-lists/{list_id}/subscribers/remove
   *
   * @param groupSlug - URL slug of the group
   * @param listId - Django list ID
   * @param email - Email address to remove from list
   */
  async removeListSubscriber(
    groupSlug: string,
    listId: number,
    email: string
  ): Promise<{ message: string }> {
    const res = await axiosInstance.post(
      `/api/groups/${groupSlug}/lanternmail/mailing-lists/${listId}/subscribers/remove`,
      { email }
    );
    return res.data;
  },

  /**
   * List campaigns for a group (optionally filtered by list)
   */
  async listCampaigns(
    groupSlug: string,
    listId?: number | null
  ): Promise<LanternmailCampaign[]> {
    const res = await axiosInstance.get(
      `/api/groups/${groupSlug}/lanternmail/campaigns`,
      { params: listId ? { list_id: listId } : undefined }
    );
    const payload = res.data as CampaignsResponse;
    return payload.data || [];
  },

  /**
   * Create a draft campaign for a list
   */
  async createCampaign(
    groupSlug: string,
    data: {
      list_id: number;
      name: string;
      subject: string;
      body: string;
      content_type?: string;
    }
  ): Promise<LanternmailCampaign> {
    const res = await axiosInstance.post(
      `/api/groups/${groupSlug}/lanternmail/campaigns/create`,
      data
    );
    return res.data?.data;
  },

  /**
   * Send a test campaign to specific emails
   */
  async testCampaign(
    groupSlug: string,
    campaignId: number,
    emails: string[]
  ): Promise<void> {
    await axiosInstance.post(
      `/api/groups/${groupSlug}/lanternmail/campaigns/${campaignId}/test`,
      { emails }
    );
  },

  /**
   * Send a campaign now (set status to running)
   */
  async sendCampaign(
    groupSlug: string,
    campaignId: number
  ): Promise<void> {
    await axiosInstance.post(
      `/api/groups/${groupSlug}/lanternmail/campaigns/${campaignId}/send`
    );
  },
};
