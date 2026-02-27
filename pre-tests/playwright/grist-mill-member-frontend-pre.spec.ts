import { test, expect, type Page } from '@playwright/test';
import { requireEnv } from './helpers/session';

// Source of truth: pre-tests/grist-mill-member-frontend-pre.md
// Scenario IDs: A1, A2, B1

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

test.describe('Pre-test: Grist Mill (Member) frontend', () => {
  test.beforeEach(async ({ page }) => {
    await loginToDashboard(page);
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('A1 - Writing menu exposes Grist Mill', async ({ page }) => {
    const writingMenuToggle = page.getByRole('button', { name: /Writing/i }).first();
    if (await writingMenuToggle.isVisible().catch(() => false)) {
      await writingMenuToggle.click();
    }

    await expect(page.getByText('Grist Mill', { exact: true })).toBeVisible();
  });

  test('A2/B1 - Grist Mill work area loads with member sponsor context', async ({ page }) => {
    await page.goto('/app/dashboard?section=mill');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Grist Mill' })).toBeVisible();
    await expect(page.getByText(/Creating for: Member/i)).toBeVisible();
    await expect(page.getByText('No Sponsor Context')).toHaveCount(0);
  });
});
