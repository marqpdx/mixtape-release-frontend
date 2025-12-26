// tests/almanac/event-creation.spec.ts

import { test, expect } from '@playwright/test';
import {
  loginForAlmanacTests,
  navigateToGroupEvents,
  openEventCreateModal,
  fillEventBasicInfo,
  setEventDateTime,
  submitEventForm,
  createSingleEvent,
  getTomorrowDate,
  waitForToast,
} from '../helpers/almanac-helper';

/**
 * Event Creation E2E Tests
 *
 * Critical user flows:
 * - Create a single event
 * - Event appears in list
 * - Event validation works
 */

test.describe('Almanac: Event Creation', () => {
  const TEST_GROUP_SLUG = 'test-group';

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginForAlmanacTests(page);
  });

  test('should create a single event successfully', async ({ page }) => {
    const tomorrow = getTomorrowDate();

    await createSingleEvent(page, TEST_GROUP_SLUG, {
      title: 'E2E Test Workshop',
      description: 'A workshop created by E2E tests',
      location: 'Test Room',
      format: 'workshop',
      startDate: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
    });

    // Verify success toast or navigation
    await page.waitForTimeout(2000);

    // Should see the event in the list or be redirected to event detail
    const eventVisible =
      (await page.locator('text=E2E Test Workshop').isVisible()) ||
      (await page.url().includes('/events/'));

    expect(eventVisible).toBeTruthy();
  });

  test('should open event creation modal', async ({ page }) => {
    await navigateToGroupEvents(page, TEST_GROUP_SLUG);
    await openEventCreateModal(page);

    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Should have title field
    await expect(page.locator('input[name="title"]')).toBeVisible();
  });

  test('should require title field', async ({ page }) => {
    await navigateToGroupEvents(page, TEST_GROUP_SLUG);
    await openEventCreateModal(page);

    const tomorrow = getTomorrowDate();

    // Try to submit without title
    await setEventDateTime(page, {
      startDate: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
    });

    await submitEventForm(page);

    // Should still be on modal (form validation prevents submit)
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should validate end time is after start time', async ({ page }) => {
    await navigateToGroupEvents(page, TEST_GROUP_SLUG);
    await openEventCreateModal(page);

    const tomorrow = getTomorrowDate();

    await fillEventBasicInfo(page, {
      title: 'Invalid Time Event',
    });

    // Set end time before start time
    await setEventDateTime(page, {
      startDate: tomorrow,
      startTime: '16:00',
      endTime: '14:00', // Before start time
    });

    await submitEventForm(page);

    // Should show error or prevent submission
    await page.waitForTimeout(1000);

    // Modal should still be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should allow optional fields to be empty', async ({ page }) => {
    const tomorrow = getTomorrowDate();

    await navigateToGroupEvents(page, TEST_GROUP_SLUG);
    await openEventCreateModal(page);

    // Only fill required fields
    await page.fill('input[name="title"]', 'Minimal Event');
    await setEventDateTime(page, {
      startDate: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
    });

    await submitEventForm(page);

    // Should succeed
    await page.waitForTimeout(2000);

    // Event should be created
    const eventExists =
      (await page.locator('text=Minimal Event').isVisible()) ||
      (await page.url().includes('/events/'));

    expect(eventExists).toBeTruthy();
  });

  test('should close modal when cancelled', async ({ page }) => {
    await navigateToGroupEvents(page, TEST_GROUP_SLUG);
    await openEventCreateModal(page);

    // Modal is open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click cancel or close
    await page.click('button:has-text("Cancel"), [data-testid="dialog-close"]');

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 2000 });
  });
});
