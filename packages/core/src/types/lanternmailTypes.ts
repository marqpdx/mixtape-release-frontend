// src/types/lanternmailTypes.ts

/**
 * Core mailing list data from Django
 */
export interface LanternmailList {
  id: number;                    // Django primary key
  listmonk_id: number;           // ListMonk's ID
  display_name: string;          // User-entered name (not 'name')
  listmonk_name: string;         // group-slug--display-name
  description: string;
  group_id: string;              // UUID string
  group_slug: string;            // URL slug for the group
  group_title: string;
  listmonk_uuid: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
}

/**
 * Response when creating a list
 * Message indicates if new or already existed
 */
export interface CreateListResponse {
  message: string;               // "Mailing list created successfully" or "already exists"
  data: LanternmailList;
}

/**
 * Response for list queries
 */
export interface ListsResponse {
  data: LanternmailList[];
}

/**
 * Detailed list stats including ListMonk data
 * Returned by getListDetails()
 */
export interface ListStatsResponse {
  id: number;
  listmonk_id: number;
  display_name: string;
  listmonk_name: string;
  description: string;
  group_id: string;
  group_slug: string;
  group_title: string;
  listmonk_uuid: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;

  // Stats from ListMonk
  subscriber_count: number;
  campaign_count: number;
  status: 'enabled' | 'disabled';
  last_campaign_date?: string;
}

/**
 * Group member with subscription status for a specific list
 * Used by getListMembers()
 */
export interface GroupLanternmailMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscription_status: 'subscribed' | 'unsubscribed' | 'pending' | 'never_invited';
  invited_at?: string;
  role?: string;
}

/**
 * Subscriber with aggregated status across all group lists
 * Used by getAllGroupSubscribers()
 */
export interface GroupSubscriberAggregated {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  overall_subscription_status: 'has_subscriptions' | 'pending' | 'unsubscribed' | 'never_invited';
  latest_invited_at?: string;
  subscribed_lists_count: number;
  pending_lists_count: number;
  total_lists: number;
  role?: string;
  list_subscriptions?: Record<number, {
    list_name: string;
    list_id: number;
    listmonk_id: number;
    status: string;
    invited_at?: string;
  }>;
}

/**
 * Response from getAllGroupSubscribers()
 */
export interface AllSubscribersResponse {
  data: GroupSubscriberAggregated[];
  total?: number;
}

/**
 * Response when sending invitations
 */
export interface SendInvitationsResponse {
  message: string;
  data: {
    invited_count: number;
    emails: string[];
    failed?: Array<{
      email: string;
      error: string;
    }>;
  };
}

/**
 * Basic campaign representation from ListMonk
 */
export interface LanternmailCampaign {
  id: number;
  name: string;
  subject?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  lists?: Array<{ id: number; name: string }>;
}

export interface CampaignsResponse {
  data: LanternmailCampaign[];
}

/**
 * A subscriber on a Listmonk list — sourced directly from Listmonk, not group membership.
 * Covers anyone pushed to the list: recruiters, external contacts, group members alike.
 */
export interface ListmonkSubscriber {
  id: number;
  email: string;
  name: string;
  status: string;
  subscription_status: 'confirmed' | 'unconfirmed' | 'unsubscribed' | 'unknown';
  subscribed_at?: string;
}

export interface ListSubscribersResponse {
  data: ListmonkSubscriber[];
  total: number;
}
