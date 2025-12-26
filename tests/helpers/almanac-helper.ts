// tests/helpers/almanac-helper.ts

import { Page, expect } from '@playwright/test';

/**
 * Almanac E2E Test Helpers
 *
 * Utilities for testing event creation, RSVP, and calendar interactions.
 */

/**
 * Navigate to the almanac/events page for a group
 */
export async function navigateToGroupEvents(page: Page, groupSlug: string) {
  await page.goto(`/groups/${groupSlug}/events`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to the calendar view
 */
export async function navigateToCalendar(page: Page) {
  await page.goto('/calendar');
  await page.waitForLoadState('networkidle');
}

/**
 * Open the event creation modal
 */
export async function openEventCreateModal(page: Page) {
  // Look for "Create Event" or "New Event" button
  await page.click('button:has-text("Create Event"), button:has-text("New Event")');

  // Wait for modal to appear
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
}

/**
 * Fill out basic event creation form
 */
export async function fillEventBasicInfo(
  page: Page,
  {
    title,
    description,
    location,
    format = 'workshop',
  }: {
    title: string;
    description?: string;
    location?: string;
    format?: string;
  }
) {
  // Fill title
  await page.fill('input[name="title"]', title);

  // Fill description if provided
  if (description) {
    await page.fill('textarea[name="description"]', description);
  }

  // Fill location if provided
  if (location) {
    await page.fill('input[name="location"]', location);
  }

  // Select format if provided
  if (format) {
    const formatSelector = `select[name="event_format"], select[name="format"]`;
    if (await page.isVisible(formatSelector)) {
      await page.selectOption(formatSelector, format);
    }
  }
}

/**
 * Set event date and time
 */
export async function setEventDateTime(
  page: Page,
  {
    startDate,
    startTime,
    endDate,
    endTime,
  }: {
    startDate: string; // Format: YYYY-MM-DD
    startTime: string; // Format: HH:MM
    endDate?: string;
    endTime?: string;
  }
) {
  // Fill start date/time
  const startDateTime = `${startDate}T${startTime}`;
  await page.fill('input[name="start_time"]', startDateTime);

  // Fill end date/time
  if (endDate && endTime) {
    const endDateTime = `${endDate}T${endTime}`;
    await page.fill('input[name="end_time"]', endDateTime);
  } else if (endTime) {
    const endDateTime = `${startDate}T${endTime}`;
    await page.fill('input[name="end_time"]', endDateTime);
  }
}

/**
 * Submit the event creation form
 */
export async function submitEventForm(page: Page) {
  await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Event")');

  // Wait for modal to close or success message
  await page.waitForTimeout(1000);
}

/**
 * Create a complete single event
 */
export async function createSingleEvent(
  page: Page,
  groupSlug: string,
  eventData: {
    title: string;
    description?: string;
    location?: string;
    format?: string;
    startDate: string;
    startTime: string;
    endTime: string;
  }
) {
  await navigateToGroupEvents(page, groupSlug);
  await openEventCreateModal(page);

  await fillEventBasicInfo(page, eventData);
  await setEventDateTime(page, eventData);

  await submitEventForm(page);

  // Wait for success
  await page.waitForTimeout(2000);
}

/**
 * RSVP to an event
 */
export async function rsvpToEvent(
  page: Page,
  status: 'going' | 'maybe' | 'not_going' = 'going'
) {
  // Look for RSVP buttons
  const buttonText = status === 'going' ? 'Going' : status === 'maybe' ? 'Maybe' : "Can't Go";

  await page.click(`button:has-text("${buttonText}")`);

  // Wait for RSVP to process
  await page.waitForTimeout(1000);
}

/**
 * Publish an event (change from draft to published)
 */
export async function publishEvent(page: Page) {
  await page.click('button:has-text("Publish")');

  // Wait for status change
  await page.waitForTimeout(1000);
}

/**
 * Navigate to event detail page
 */
export async function navigateToEventDetail(
  page: Page,
  groupSlug: string,
  eventSlug: string
) {
  await page.goto(`/groups/${groupSlug}/events/${eventSlug}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, expectedText?: string) {
  const toastSelector = '[role="status"], [role="alert"], .chakra-toast';
  await page.waitForSelector(toastSelector, { timeout: 5000 });

  if (expectedText) {
    await expect(page.locator(toastSelector)).toContainText(expectedText);
  }

  await page.waitForTimeout(500);
}

/**
 * Filter calendar by decorator
 */
export async function filterCalendarByDecorator(page: Page, decoratorName: string) {
  // Look for decorator filter checkboxes
  await page.check(`input[type="checkbox"][value="${decoratorName}"]`);
  await page.waitForTimeout(500);
}

/**
 * Check if event appears in calendar
 */
export async function verifyEventInCalendar(page: Page, eventTitle: string) {
  const eventSelector = `[data-event-title="${eventTitle}"], :text("${eventTitle}")`;
  await expect(page.locator(eventSelector)).toBeVisible({ timeout: 5000 });
}

/**
 * Click on a calendar date
 */
export async function clickCalendarDate(page: Page, date: string) {
  // Look for date cell (format depends on calendar implementation)
  await page.click(`[data-date="${date}"]`);
  await page.waitForTimeout(500);
}

/**
 * View attendee list for an event
 */
export async function viewAttendees(page: Page) {
  await page.click('button:has-text("Attendees"), button:has-text("View Attendees")');

  // Wait for attendee list to load
  await page.waitForSelector('[data-testid="attendee-list"], table', { timeout: 5000 });
}

/**
 * Cancel an occurrence in a series
 */
export async function cancelOccurrence(page: Page, reason?: string) {
  await page.click('button:has-text("Cancel")');

  // If there's a prompt for reason
  if (reason) {
    await page.waitForTimeout(500);
    // Handle browser prompt or modal
  }

  await page.waitForTimeout(1000);
}

/**
 * Login as test user for almanac tests
 */
export async function loginForAlmanacTests(page: Page) {
  // Use existing login helper or implement basic login
  await page.goto('/login');
  await page.fill('input[name="identifier"]', 'admin@mixtape.com');
  await page.fill('input[name="password"]', 'testpassword123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Get date N days from now
 */
export function getFutureDate(daysAhead: number): string {
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);
  return future.toISOString().split('T')[0];
}
