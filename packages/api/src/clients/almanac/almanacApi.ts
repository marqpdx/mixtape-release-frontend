// src/lib/almanacApi.ts

/**
 * Almanac API Service
 * Handles all communication with the event management backend
 * Uses axiosInstance for consistent headers, auth, and interceptors
 * Updated for publishing workflow and new model structure
 */

import { axiosInstance } from '@providers/auth-provider/axiosInstance';
import { AxiosError } from 'axios';

export interface DecoratorAssignment {
  slug: string;
  name?: string;
  icon?: string;
  context_data?: Record<string, any>;
}

export interface AdHocSlot {
  start: string; // ISO datetime
  end: string;   // ISO datetime
  title_override?: string;
  location_override?: string;
}

export interface EventCreatePayload {
  event_type: 'single' | 'adhoc_series' | 'gathering' | 'recurring';
  title: string;
  description: string;
  location?: string;
  event_format: string;
  max_attendees?: number;
  registration_required?: boolean;
  registration_deadline_hours?: number;

  // For adhoc_series
  adhoc_slots?: AdHocSlot[];

  // For single events
  start_time?: string;
  end_time?: string;

  // For recurring events
  rrule?: string;
  timezone?: string;
  default_duration_minutes?: number;

  // Decorators - uses context_data (not context)
  decorators?: DecoratorAssignment[];

  // Gathering-specific
  gathering_data?: {
    accommodation_available?: boolean;
    meals_included?: boolean;
  };
}

export interface EventResponse {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  event_format: string;
  max_attendees?: number;
  registration_required: boolean;
  registration_deadline_hours: number;
  visible_to_parent: boolean;

  // Computed fields
  is_recurring: boolean;
  registration_deadline?: string;
  total_attendees: number;
  next_occurrence?: EventOccurrence;
  upcoming_occurrences?: CalendarOccurrence[];

  // Relations
  series?: EventSeriesResponse;
  decorators: EventDecoratorResponse[];
  gathering_extension?: GatheringExtensionResponse;

  // Author info
  author: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  sponsor_display: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EventSeriesResponse {
  id: string;
  title: string;
  slug: string;
  timezone: string;
  default_duration_minutes: number;
  rrule?: string;
  is_active: boolean;
  is_recurring: boolean;
  next_occurrence?: CalendarOccurrence;
  sponsor_display: string;
  created_at: string;
  updated_at: string;
}

export interface GatheringExtensionResponse {
  id: string;
  accommodation_available: boolean;
  meals_included: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventDecoratorResponse {
  id: string;
  decorator: {
    slug: string;
    name: string;
    icon: string;
    description: string;
    has_context_data: boolean;
  };
  context_data: Record<string, any>;
  assigned_at: string;
}

export interface EventOccurrence {
  id: string;
  start: string;
  end: string;
  effective_title: string;
  effective_location: string;
  title_override: string;
  location_override: string;
  is_cancelled: boolean;
  cancellation_reason: string;
  duration_hours: number;
  is_past: boolean;
  is_happening_now: boolean;
  attendee_count: number;
  is_full: boolean;
  notes: string;
  actual_attendance: number | null;
  created_at: string;
}

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  occurrences: CalendarOccurrence[];
}

export interface CalendarOccurrence {
  id: string;
  series_id: string;
  event_id: string;
  event_slug: string;
  title: string;
  kind: 'event' | 'gathering';
  start: string;
  end: string;
  location: string;
  decorators: {
    slug: string;
    icon: string;
    name: string;
    context_data: Record<string, any>;
  }[];
  event_format: string;
  event_status: 'draft' | 'published' | 'archived';
  capacity: number | null;
  attendee_count: number;
  is_full: boolean;
  sponsor_display: string;
  accommodation_available: boolean;
  meals_included: boolean;
  is_cancelled: boolean;
}

export interface EventAttendee {
  id: string;
  user: string;
  name: string;
  occurrence: string;
  occurrence_title: string;
  status: 'going' | 'maybe' | 'not_going' | 'attended';
  rsvp_date: string;
  notes: string;
  checked_in_at: string | null;
  feedback: string | null;
  rating: number | null;
}

export interface EventSummary {
  attending_count: number;
  following_count: number;
  authored_count: number;
  upcoming_events: CalendarOccurrence[];
}

export interface PublishEventPayload {
  // Empty - just a trigger to publish
}

export interface RSVPPayload {
  status: 'going' | 'maybe' | 'not_going';
  registration_notes?: string;
  limit_to?: number; // ✅ NEW: Limit RSVP to next N occurrences
}

export interface AttendanceResponse {
  attendees_created: number;
  status: 'going' | 'maybe' | 'not_going';
  limit?: number;
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

class AlmanacApi {
  /**
   * Constructor - axiosInstance is passed in to allow for testing
   * and flexibility in different environments
   */
  constructor(private client = axiosInstance) {}

  // =========================================================================
  // EVENT MANAGEMENT
  // =========================================================================

  async createEvent(
    payload: EventCreatePayload,
    groupSlug?: string
  ): Promise<EventResponse> {
    try {
      // If groupSlug provided, use group-scoped URL
      const url = groupSlug
        ? `/api/groups/${groupSlug}/almanac/`
        : `/api/almanac/events/`;

      const response = await this.client.post(url, payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async getEvent(eventId: string, groupSlug?: string): Promise<EventResponse> {
    try {
      const url = groupSlug
        ? `/api/groups/${groupSlug}/almanac/${eventId}`
        : `/api/almanac/events/${eventId}`;

      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async listEvents(
    params?: {
      status?: 'draft' | 'published' | 'archived';
      kind?: 'event' | 'gathering';
      decorator?: string;
    },
    groupSlug?: string
  ): Promise<EventResponse[]> {
    try {
      const url = groupSlug
        ? `/api/groups/${groupSlug}/almanac/`
        : `/api/almanac/`;

      const response = await this.client.get(url, { params });
      return response.data.results || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async updateEvent(
    eventId: string,
    payload: Partial<EventCreatePayload>,
    groupSlug?: string
  ): Promise<EventResponse> {
    try {
      const url = groupSlug
        ? `/api/groups/${groupSlug}/almanac/${eventId}`
        : `/api/almanac/${eventId}`;

      const response = await this.client.put(url, payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async deleteEvent(eventId: string, groupSlug?: string): Promise<void> {
    try {
      const url = groupSlug
        ? `/api/groups/${groupSlug}/almanac/${eventId}`
        : `/api/almanac/${eventId}`;

      await this.client.delete(url);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // =========================================================================
  // PUBLISHING WORKFLOW - ✅ NEW
  // =========================================================================

  async publishEvent(eventId: string, groupSlug?: string): Promise<EventResponse> {
    try {
      const url = groupSlug
        ? `/api/groups/${groupSlug}/almanac/${eventId}/publish`
        : `/api/almanac/${eventId}/publish`;

      const response = await this.client.post(url);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async unpublishEvent(eventId: string, groupSlug?: string): Promise<EventResponse> {
    try {
      const url = groupSlug
        ? `/api/groups/${groupSlug}/almanac/${eventId}/unpublish`
        : `/api/almanac/${eventId}/unpublish`;

      const response = await this.client.post(url);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // =========================================================================
  // CALENDAR & OCCURRENCES
  // =========================================================================

  async getCalendarOccurrences(
    startDate: Date,
    endDate: Date,
    filters?: { decorator?: string; kind?: 'event' | 'gathering' }
  ): Promise<CalendarOccurrence[]> {
    try {
      const params = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        ...filters,
      };
      const response = await this.client.get('/api/almanac/calendar', { params });
      return response.data || [];
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async getMyCalendarOccurrences(
    startDate: Date,
    endDate: Date,
    filters?: { decorator?: string; kind?: 'event' | 'gathering' }
  ): Promise<CalendarOccurrence[]> {
    try {
      const params = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        ...filters,
      };
      const response = await this.client.get('/api/almanac/calendar/my', { params });
      return response.data || [];
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async getGroupCalendar(
    groupSlug: string,
    startDate: Date,
    endDate: Date,
    filters?: { decorator?: string; kind?: 'event' | 'gathering' }
  ): Promise<CalendarOccurrence[]> {
    try {
      const params = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        ...filters,
      };
      const response = await this.client.get(
        `/api/groups/${groupSlug}/almanac/calendar`,
        { params }
      );
      return response.data || [];
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // =========================================================================
  // RSVP & ATTENDANCE
  // =========================================================================

  /**
   * RSVP to entire event series
   * Can optionally limit to N future occurrences
   */
  async rsvpToEvent(
    eventId: string,
    payload: RSVPPayload,
    groupSlug?: string
  ): Promise<AttendanceResponse> {
    try {
      const url = groupSlug
        ? `/api/groups/${groupSlug}/almanac/${eventId}/rsvp`
        : `/api/almanac/events/${eventId}/rsvp`;

      const response = await this.client.post(url, payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * RSVP to specific occurrence
   */
  async rsvpToOccurrence(
    occurrenceId: string,
    status: 'going' | 'maybe' | 'not_going',
    notes?: string
  ): Promise<any> {
    try {
      const response = await this.client.post(`/api/almanac/occurrences/${occurrenceId}/rsvp`, {
        status,
        registration_notes: notes,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Cancel RSVP to specific occurrence
   */
  async cancelRsvp(occurrenceId: string): Promise<void> {
    try {
      await this.client.delete(`/api/almanac/occurrences/${occurrenceId}/cancel_rsvp`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // =========================================================================
  // DECORATORS & UTILITIES
  // =========================================================================

  async getDecorators(): Promise<DecoratorAssignment[]> {
    try {
      const response = await this.client.get('/api/almanac/decorators');
      return response.data.results || response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async getMyEventsSummary(): Promise<EventSummary> {
    try {
      const response = await this.client.get('/api/almanac/my-events-summary');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // =========================================================================
  // FOLLOW / UNFOLLOW
  // =========================================================================

  async followEvent(
    eventId: string,
    followType?: 'following' | 'interested' | 'organizer',
    groupSlug?: string
  ): Promise<any> {
    try {
      const url = groupSlug
        ? `/api/groups/${groupSlug}/almanac/${eventId}/follow`
        : `/api/almanac/${eventId}/follow`;

      const response = await this.client.post(url, {
        follow_type: followType || 'following',
        notify_new_occurrences: true,
        notify_changes: true,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async unfollowEvent(eventId: string, groupSlug?: string): Promise<void> {
    try {
      const url = groupSlug
        ? `/api/groups/${groupSlug}/almanac/${eventId}/follow`
        : `/api/almanac/${eventId}/follow`;

      await this.client.delete(url);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // =========================================================================
  // ANALYTICS & MANAGEMENT
  // =========================================================================

  async getEventAnalytics(eventId: string, groupSlug?: string): Promise<any> {
    try {
      const url = groupSlug
        ? `/api/groups/${groupSlug}/almanac/${eventId}/analytics`
        : `/api/almanac/${eventId}/analytics`;

      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async syncEventRsvps(eventId: string, groupSlug?: string): Promise<any> {
    try {
      const url = groupSlug
        ? `/api/groups/${groupSlug}/almanac/${eventId}/sync-rsvps`
        : `/api/almanac/${eventId}/sync-rsvps`;

      const response = await this.client.post(url);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async getEventAttendees(eventId: string, groupSlug?: string): Promise<any[]> {
    try {
      const url = groupSlug
        ? `/api/groups/${groupSlug}/almanac/${eventId}/attendees`
        : `/api/almanac/${eventId}/attendees`;

      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

// Export singleton instance
export const almanacApi = new AlmanacApi();

// ============================================================================
// GROUP-SCOPED EVENT FUNCTIONS
// ============================================================================

/**
 * Fetch events for a specific group
 */
export async function fetchGroupEvents(
  groupSlug: string,
  params?: { status?: 'draft' | 'published' | 'archived'; kind?: 'event' | 'gathering'; decorator?: string }
): Promise<EventResponse[]> {
  const response = await axiosInstance.get(`/api/groups/${groupSlug}/almanac/`, { params });
  return Array.isArray(response.data) ? response.data : response.data.results || [];
}

/**
 * Fetch a single event within a group context
 */
export async function fetchGroupEvent(groupSlug: string, eventId: string): Promise<EventResponse> {
  const response = await axiosInstance.get(`/api/groups/${groupSlug}/almanac/${eventId}`);
  return response.data;
}

/**
 * Create event within a group
 */
export async function createGroupEvent(
  groupSlug: string,
  payload: EventCreatePayload
): Promise<EventResponse> {
  const response = await axiosInstance.post(`/api/groups/${groupSlug}/almanac/`, payload);
  return response.data;
}

/**
 * Update event within a group
 */
export async function updateGroupEvent(
  groupSlug: string,
  eventId: string,
  payload: Partial<EventCreatePayload>
): Promise<EventResponse> {
  const response = await axiosInstance.put(`/api/groups/${groupSlug}/almanac/${eventId}`, payload);
  return response.data;
}

/**
 * Delete event within a group
 */
export async function deleteGroupEvent(groupSlug: string, eventId: string): Promise<void> {
  await axiosInstance.delete(`/api/groups/${groupSlug}/almanac/${eventId}`);
}

/**
 * Publish event within a group
 */
export async function publishGroupEvent(groupSlug: string, eventId: string): Promise<EventResponse> {
  const response = await axiosInstance.post(`/api/groups/${groupSlug}/almanac/${eventId}/publish`);
  return response.data;
}

/**
 * Unpublish event within a group
 */
export async function unpublishGroupEvent(groupSlug: string, eventId: string): Promise<EventResponse> {
  const response = await axiosInstance.post(`/api/groups/${groupSlug}/almanac/${eventId}/unpublish`);
  return response.data;
}

/**
 * RSVP to event within a group
 */
export async function rsvpToGroupEvent(
  groupSlug: string,
  eventId: string,
  payload: { status: 'going' | 'maybe' | 'not_going'; registration_notes?: string }
) {
  const response = await axiosInstance.post(
    `/api/groups/${groupSlug}/almanac/${eventId}/rsvp`,
    payload
  );
  return response.data;
}

/**
 * Get event attendees within a group
 */
export async function fetchGroupEventAttendees(groupSlug: string, eventSlug: string): Promise<EventAttendee[]> {
  const response = await axiosInstance.get(`/api/groups/${groupSlug}/events/${eventSlug}/attendees`);
  return response.data;
}

/**
 * Check in an attendee (organizer only)
 */
export async function checkInAttendee(groupSlug: string, eventSlug: string, attendeeId: string): Promise<EventAttendee> {
  const response = await axiosInstance.patch(
    `/api/groups/${groupSlug}/events/${eventSlug}/attendees/${attendeeId}/check-in`
  );
  return response.data;
}

/**
 * Get RSVP breakdown for event within a group
 */
export async function fetchGroupEventRSVPBreakdown(groupSlug: string, eventId: string) {
  const response = await axiosInstance.get(`/api/groups/${groupSlug}/almanac/${eventId}/rsvp-breakdown`);
  return response.data;
}
