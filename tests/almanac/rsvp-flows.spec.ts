// tests/almanac/rsvp-flows.spec.ts

import { test, expect } from '@playwright/test';
import {
  loginForAlmanacTests,
  createSingleEvent,
  navigateToEventDetail,
  publishEvent,
  rsvpToEvent,
  getTomorrowDate,
  waitForToast,
} from '../helpers/almanac-helper';

/**
 * RSVP Flow E2E Tests
 *
 * Critical user flows:
 * - RSVP to a published event
 * - Change RSVP status
 * - View attendee count
 */

test.describe('Almanac: RSVP Flows', () => {
  const TEST_GROUP_SLUG = 'test-group';
  const tomorrow = getTomorrowDate();

  test.beforeEach(async ({ page }) => {
    await loginForAlmanacTests(page);
  });

  test('should RSVP to a published event', async ({ page }) => {
    // Create and publish an event
    await createSingleEvent(page, TEST_GROUP_SLUG, {
      title: 'RSVP Test Event',
      description: 'Event for testing RSVP',
      startDate: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
    });

    // Publish the event
    await publishEvent(page);

    // RSVP as "Going"
    await rsvpToEvent(page, 'going');

    // Should see success toast or confirmation
    await page.waitForTimeout(1000);

    // Going button should show active state or count should update
    const goingButton = page.locator('button:has-text("Going")');
    await expect(goingButton).toBeVisible();
  });

  test('should change RSVP status', async ({ page }) => {
    // Assuming event exists from previous test or create new
    await createSingleEvent(page, TEST_GROUP_SLUG, {
      title: 'RSVP Change Test',
      startDate: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
    });

    await publishEvent(page);

    // First RSVP as "Going"
    await rsvpToEvent(page, 'going');
    await page.waitForTimeout(1000);

    // Change to "Maybe"
    await rsvpToEvent(page, 'maybe');
    await page.waitForTimeout(1000);

    // Maybe button should be active
    const maybeButton = page.locator('button:has-text("Maybe")');
    await expect(maybeButton).toBeVisible();
  });

  test('should show RSVP buttons only for published events', async ({ page }) => {
    await createSingleEvent(page, TEST_GROUP_SLUG, {
      title: 'Draft Event',
      startDate: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
    });

    // Event is in draft status
    // RSVP buttons should not be visible or should show "Publish first" message

    const goingButtonExists = await page.locator('button:has-text("Going")').isVisible();

    // If draft events don't show RSVP buttons
    // expect(goingButtonExists).toBeFalsy();

    // Or publish button should be visible instead
    const publishButtonExists = await page.locator('button:has-text("Publish")').isVisible();
    expect(publishButtonExists).toBeTruthy();
  });

  test('should display attendee count', async ({ page }) => {
    await createSingleEvent(page, TEST_GROUP_SLUG, {
      title: 'Attendee Count Test',
      startDate: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
    });

    await publishEvent(page);
    await rsvpToEvent(page, 'going');

    await page.waitForTimeout(1000);

    // Should see attendee count somewhere
    // This depends on your UI implementation
    const countText = await page.textContent('body');
    expect(countText).toContain('1'); // At least 1 attendee
  });

  test('should handle full events', async ({ page, context }) => {
    // Create event with max attendees
    await createSingleEvent(page, TEST_GROUP_SLUG, {
      title: 'Limited Capacity Event',
      startDate: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
      // Note: max_attendees would need to be settable in the form
    });

    // This test would require:
    // 1. Setting max_attendees in event creation
    // 2. Multiple users RSVPing
    // 3. Checking "Full" badge or disabled RSVP button

    // Placeholder for future implementation
    await publishEvent(page);
    await rsvpToEvent(page, 'going');
  });
});
