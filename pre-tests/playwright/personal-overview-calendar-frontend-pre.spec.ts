import { test, expect, type Page } from '@playwright/test';
import { requireEnv } from './helpers/session';

// Source of truth: pre-tests/personal-overview-calendar-frontend-pre.md
// Scenario IDs: A1, B1

const BASE_URL = requireEnv('E2E_BASE_URL');
const AUTHOR_EMAIL = requireEnv('E2E_AUTHOR_EMAIL');
const AUTHOR_PASSWORD = requireEnv('E2E_AUTHOR_PASSWORD');

test.use({ baseURL: BASE_URL });

async function loginToDashboard(page: Page): Promise<void> {
  await page.context().clearCookies();
  const loginResponse = await page.goto('/app/login');
  test.skip(loginResponse?.status() === 404, 'Login route is unavailable on this host; dashboard pre-tests skipped.');

  const loginField = page.locator('input[name="identifier"]');
  const hasLogin = await loginField.isVisible({ timeout: 5000 }).catch(() => false);
  test.skip(!hasLogin, 'Login form unavailable on this host; dashboard pre-tests skipped.');

  await loginField.fill(AUTHOR_EMAIL);
  await page.locator('input[name="password"]').fill(AUTHOR_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/app\/dashboard|\/dashboard|\/app\//, { timeout: 20000 });
}

test.describe('Pre-test: Personal Overview + Calendar frontend', () => {
  test.beforeEach(async ({ page }) => {
    await loginToDashboard(page);
    await page.goto('/app/dashboard?section=overview');
    await page.waitForLoadState('networkidle');
  });

  test('A1 - Personal overview renders', async ({ page }) => {
    await expect(page.getByText(/Good (morning|afternoon|evening),/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible();
  });

  test('B1 - My Calendar card appears with expected copy and action', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'My Calendar' })).toBeVisible();
    await expect(page.getByText(/personal events.*Crossroads gatherings/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open calendar' })).toBeVisible();
  });
});
