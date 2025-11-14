# Mixtape E2E Testing with Playwright

**Author:** Emily Chen, CTO
**Last Updated:** 2025-11-13
**Status:** Production Ready

---

## 🎯 Overview

Mixtape uses **Playwright** for end-to-end (E2E) testing. These tests run against real browsers and verify that the entire system works together: frontend (Next.js), backend (Django), database (PostgreSQL), and authentication flow.

### Why Playwright?

- **Cross-browser testing** - Chromium, Firefox, WebKit
- **Real user simulation** - Tests what users actually experience
- **Network interception** - Test email flows, API responses
- **Debugging tools** - UI mode, trace viewer, screenshots
- **CI/CD integration** - Runs in GitHub Actions before deployment

---

## 📁 Test Structure

```
tests/
├── auth/                          # Authentication tests
│   ├── login.spec.ts             # Login flow
│   ├── register.spec.ts          # Registration flow
│   ├── logout.spec.ts            # Logout and session cleanup
│   └── token-refresh.spec.ts     # Token refresh mechanics
├── invite-flows/                  # Group invitation tests
│   ├── group-member.spec.ts      # Existing member invite
│   ├── non-member-email.spec.ts  # New user via email
│   └── site-member-username.spec.ts # Existing user via @username
├── helpers/                       # Shared test utilities
│   ├── email-helper.ts           # Email testing utilities
│   ├── navigation-helper.ts      # Navigation helpers
│   └── test-data.ts              # Test data creation
├── global-setup.ts               # Pre-test environment checks
└── README-tests.md               # This file
```

---

## 🚀 Running Tests Locally

### Prerequisites

1. **Backend server must be running**:
   ```bash
   cd ../mixtape-release-core
   source ../env/bin/activate
   python manage.py runserver 127.0.0.1:8010
   ```

2. **Frontend server must be running**:
   ```bash
   yarn dev  # Runs on 127.0.0.1:3010
   ```

3. **Test data must exist** (admin user, test group, etc.):
   ```bash
   cd ../mixtape-release-core
   python manage.py bootstrap_mixtape
   ```

### Quick Start

```bash
# Run all tests (recommended before git push)
yarn test:local

# Run specific test suites
yarn test:local auth       # Auth tests only
yarn test:local invite     # Invite tests only
```

### Test Modes

#### 1. Headless Mode (Default - CI/CD)
```bash
yarn test
```
- Browsers run in the background
- No visual output, just terminal logs
- Fastest execution
- **Use this before pushing to GitHub**

#### 2. Headed Mode (See Browser)
```bash
yarn test:headed
# OR
yarn test:local headed
```
- Opens actual browser windows
- Watch tests run like a robot using your app
- Great for understanding test flow
- Slower but visual

#### 3. UI Mode (Best for Development)
```bash
yarn test:ui
# OR
yarn test:local ui
```
- Opens Playwright's test runner UI
- Click tests to run them
- Watch execution step-by-step
- See DOM, network calls, screenshots
- **Most interactive debugging experience**

#### 4. Debug Mode (Step Through)
```bash
yarn test:debug
# OR
yarn test:local debug
```
- Opens browser AND Playwright Inspector
- Pauses at each step
- Click "next" to advance
- **Best for finding exactly where a test breaks**

---

## 🧪 Test Categories

### Authentication Tests (`tests/auth/`)

**Critical for security** - These tests verify our JWT + httpOnly cookie authentication:

1. **login.spec.ts** - Login with email/username, invalid credentials, session persistence
2. **register.spec.ts** - User registration, validation, duplicate handling
3. **logout.spec.ts** - Logout, session cleanup, cookie removal
4. **token-refresh.spec.ts** - Automatic token refresh (15 min access, 7 day refresh)

**Why these matter**: Authentication bugs can lock users out or expose security vulnerabilities.

### Invite Flow Tests (`tests/invite-flows/`)

**Business logic verification** - Group invitations are a core feature:

1. **group-member.spec.ts** - Prevent duplicate invites to existing members
2. **non-member-email.spec.ts** - Full flow: invite → email → account activation → group membership
3. **site-member-username.spec.ts** - Autocomplete and invite existing users via @username

**Why these matter**: Invitations are how groups grow. Broken invites = broken growth.

---

## 🔧 Writing New Tests

### Test File Template

```typescript
// tests/feature/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature: My Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.fill('input[name="username"]', 'testuser');

    // Act
    await page.click('[data-testid="submit-button"]');

    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** - `[data-testid="login-button"]` is more stable than CSS classes
2. **Test user flows, not implementation** - Test what users do, not how code works
3. **One assertion per test when possible** - Makes failures easier to diagnose
4. **Clean up after tests** - Clear cookies, emails, test data
5. **Make tests independent** - Tests shouldn't depend on each other
6. **Use helpers** - Share common logic in `tests/helpers/`

---

## 🚨 Troubleshooting

### "Frontend server not responding"
```bash
# Check if dev server is running
ps aux | grep "next dev"

# Start dev server
yarn dev
```

### "Backend server not responding"
```bash
# Check if Django is running on correct port
curl http://127.0.0.1:8010/health/

# Start backend
cd ../mixtape-release-core
source ../env/bin/activate
python manage.py runserver 127.0.0.1:8010
```

### "Test data not found (admin user, etc.)"
```bash
cd ../mixtape-release-core
python manage.py bootstrap_mixtape
```

### "Tests are flaky / sometimes pass, sometimes fail"
- Check for race conditions (parallel test execution)
- Increase timeouts in playwright.config.ts
- Use `await page.waitForLoadState('networkidle')` before assertions
- Run tests serially: `npx playwright test --workers=1`

### "Can't see what's happening in tests"
```bash
# Use UI mode to watch tests visually
yarn test:ui

# Or headed mode to see browser
yarn test:headed
```

---

## 📊 Test Reports

After running tests, view detailed reports:

```bash
yarn test:report
```

This opens an HTML report showing:
- Which tests passed/failed
- Screenshots of failures
- Network requests
- Console logs
- Video recordings (on failure)

---

## 🔗 Integration with CI/CD

These tests run automatically in the deployment workflow:

1. **Developer pushes to `main`**
2. **GitHub Actions runs**:
   - Django tests (80% coverage required)
   - **Playwright E2E tests** ← These tests!
   - Migration safety checks
   - Security scans
3. **If tests pass**: Manual approval gate
4. **If approved**: Auto-deploy to VPS
5. **If tests fail**: Deployment blocked, developer notified

See `.github/workflows/deploy-backend.yml` for full workflow.

---

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing E2E Tests](https://playwright.dev/docs/writing-tests)
- [Debugging Tests](https://playwright.dev/docs/debug)

---

**Questions?** Review this README or contact Emily (CTO)

**Ready to test?** Run `yarn test:local` before pushing to GitHub!