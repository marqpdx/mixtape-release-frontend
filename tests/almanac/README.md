# Almanac E2E Tests

**Author:** Claude Code
**Created:** 2025-12-26
**Status:** Ready to Run

---

## 📋 Overview

End-to-end tests for Almanac event management UI covering critical user workflows:
- Creating events
- RSVPing to events
- Viewing calendar
- Managing event series

---

## 🏗️ Test Structure

```
tests/almanac/
├── event-creation.spec.ts        # Event creation workflows
├── rsvp-flows.spec.ts           # RSVP and attendance
├── calendar-interaction.spec.ts  # Calendar viewing and filtering
└── README.md                    # This file

tests/helpers/
└── almanac-helper.ts            # Shared test utilities
```

---

## 🚀 Running E2E Tests

### Prerequisites

**1. Backend server must be running:**
```bash
cd REDACTED-LOCAL-PATH/mixtape-release-core
source ../env/bin/activate
python manage.py runserver 127.0.0.1:8010
```

**2. Frontend server must be running:**
```bash
cd REDACTED-LOCAL-PATH/mixtape-release-frontend
yarn dev  # Runs on 127.0.0.1:3010
```

**3. Test data must exist:**
```bash
cd REDACTED-LOCAL-PATH/mixtape-release-core
python manage.py bootstrap_mixtape
```

### Run All Almanac E2E Tests

```bash
# Headless mode (recommended for CI)
yarn test tests/almanac

# Headed mode (see browser)
yarn test:headed tests/almanac

# UI mode (interactive)
yarn test:ui tests/almanac

# Debug mode (step through)
yarn test:debug tests/almanac
```

### Run Specific Test Files

```bash
# Event creation tests only
yarn test tests/almanac/event-creation.spec.ts

# RSVP tests only
yarn test tests/almanac/rsvp-flows.spec.ts

# Calendar tests only
yarn test tests/almanac/calendar-interaction.spec.ts
```

---

## 📁 Test Files Explained

### `event-creation.spec.ts` - Event Creation Workflows

**Critical Flows:**
- ✅ Create single event successfully
- ✅ Open event creation modal
- ✅ Form validation (required fields)
- ✅ Time validation (end > start)
- ✅ Cancel modal

**Example Test:**
```typescript
test('should create a single event successfully', async ({ page }) => {
  await createSingleEvent(page, 'test-group', {
    title: 'Workshop',
    startDate: getTomorrowDate(),
    startTime: '14:00',
    endTime: '16:00',
  });

  // Verify event appears
  await expect(page.locator('text=Workshop')).toBeVisible();
});
```

**Run:** `yarn test tests/almanac/event-creation.spec.ts`

---

### `rsvp-flows.spec.ts` - RSVP Workflows

**Critical Flows:**
- ✅ RSVP to published event
- ✅ Change RSVP status
- ✅ RSVP buttons only show for published events
- ✅ Display attendee count
- ✅ Handle full events

**Example Test:**
```typescript
test('should RSVP to a published event', async ({ page }) => {
  await createSingleEvent(page, 'test-group', {...});
  await publishEvent(page);
  await rsvpToEvent(page, 'going');

  // Verify RSVP registered
  await expect(page.locator('button:has-text("Going")')).toBeVisible();
});
```

**Run:** `yarn test tests/almanac/rsvp-flows.spec.ts`

---

### `calendar-interaction.spec.ts` - Calendar Workflows

**Critical Flows:**
- ✅ Load calendar page
- ✅ Display published events
- ✅ Hide draft events
- ✅ Filter calendar
- ✅ Navigate between months
- ✅ Click events for details

**Example Test:**
```typescript
test('should load calendar page', async ({ page }) => {
  await navigateToCalendar(page);
  await expect(page).toHaveURL(/\/calendar/);
});
```

**Run:** `yarn test tests/almanac/calendar-interaction.spec.ts`

---

## 🛠️ Test Helpers (`almanac-helper.ts`)

### Navigation Helpers

```typescript
// Navigate to group events page
await navigateToGroupEvents(page, 'test-group');

// Navigate to calendar
await navigateToCalendar(page);

// Navigate to specific event
await navigateToEventDetail(page, 'test-group', 'event-slug');
```

### Event Creation Helpers

```typescript
// Create a complete single event
await createSingleEvent(page, 'test-group', {
  title: 'Workshop',
  description: 'Learn testing',
  location: 'Room A',
  startDate: getTomorrowDate(),
  startTime: '14:00',
  endTime: '16:00',
});

// Open event creation modal
await openEventCreateModal(page);

// Fill event form fields
await fillEventBasicInfo(page, { title: 'Workshop' });
await setEventDateTime(page, { startDate, startTime, endTime });
await submitEventForm(page);
```

### RSVP Helpers

```typescript
// RSVP to current event
await rsvpToEvent(page, 'going');
await rsvpToEvent(page, 'maybe');
await rsvpToEvent(page, 'not_going');

// Publish event
await publishEvent(page);
```

### Utility Helpers

```typescript
// Get dates
const tomorrow = getTomorrowDate(); // YYYY-MM-DD
const nextWeek = getFutureDate(7);

// Wait for toast
await waitForToast(page, 'Event created');

// Login
await loginForAlmanacTests(page);
```

---

## 📊 Test Coverage

**Current E2E Tests:** ~18 test cases

**Covered Workflows:**
- ✅ Event creation (basic, validation)
- ✅ RSVP flows (going, maybe, not_going)
- ✅ Calendar viewing
- ✅ Event publishing

**Not Yet Covered:**
- ⏳ Recurring event creation (complex)
- ⏳ Series management (edit/cancel occurrences)
- ⏳ Attendee check-in
- ⏳ Event editing
- ⏳ Organizer management

---

## 🐛 Troubleshooting

### "Frontend server not responding"

```bash
# Check if dev server is running
ps aux | grep "next dev"

# Start dev server
yarn dev
```

### "Backend server not responding"

```bash
# Check Django is running
curl http://127.0.0.1:8010/health/

# Start backend
cd ../mixtape-release-core
source ../env/bin/activate
python manage.py runserver 127.0.0.1:8010
```

### "Test data not found"

```bash
cd ../mixtape-release-core
python manage.py bootstrap_mixtape
```

### "Selectors not found"

E2E tests depend on UI structure. If UI changes break tests:

1. **Update selectors** in test files or helpers
2. **Use data-testid** attributes for stable selectors
3. **Check component changes** in Almanac components

### "Tests are flaky"

```bash
# Run tests serially
yarn test tests/almanac --workers=1

# Increase timeouts in playwright.config.ts
timeout: 60 * 1000
```

---

## 🔧 Writing New E2E Tests

### Quick Template

```typescript
import { test, expect } from '@playwright/test';
import { loginForAlmanacTests } from '../helpers/almanac-helper';

test.describe('Feature: My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginForAlmanacTests(page);
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/path');

    // Act
    await page.click('button:has-text("Action")');

    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Best Practices

1. **Use helpers** - Don't repeat navigation/login code
2. **Stable selectors** - Use `data-testid` or semantic selectors
3. **Wait for state** - Use `waitForLoadState('networkidle')`
4. **Clear test names** - Describe user behavior, not implementation
5. **Test user flows** - Not individual buttons/fields
6. **Clean up** - Each test should be independent

---

## 📈 Next Steps

1. **Add recurring event tests** - Complex UI interactions
2. **Add series management tests** - Edit/cancel occurrences
3. **Add multi-user tests** - RSVP limits, capacity
4. **Add mobile tests** - Responsive design
5. **Add accessibility tests** - Screen reader, keyboard nav

---

## 🎯 Quick Commands

```bash
# Run all Almanac E2E tests
yarn test tests/almanac

# Run with UI (easiest for debugging)
yarn test:ui tests/almanac

# Run specific test
yarn test tests/almanac/event-creation.spec.ts

# View test report
yarn test:report

# Run in headed mode (see browser)
yarn test:headed tests/almanac
```

---

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Test README](../../tests/README-tests.md)
- [Writing Tests Guide](https://playwright.dev/docs/writing-tests)

---

**Ready to test?** Run `yarn test tests/almanac`

**Debugging?** Run `yarn test:ui tests/almanac`
