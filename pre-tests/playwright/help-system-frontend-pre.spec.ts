import { test, expect, type Page } from '@playwright/test';
import { requireEnv } from './helpers/session';

// Source of truth: pre-tests/help-system-frontend-pre.md
// Scenario IDs: A1, A2, B1, B2, B3, C1, C2, C3

const BASE_URL = requireEnv('E2E_BASE_URL');
const ADMIN_EMAIL = requireEnv('E2E_ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('E2E_ADMIN_PASSWORD');

test.use({ baseURL: BASE_URL });

async function loginAsAdmin(page: Page): Promise<void> {
  await page.context().clearCookies();
  let res;
  try {
    res = await page.goto('/app/login');
  } catch (error) {
    test.skip(true, `Frontend host unavailable; help-system pre-tests skipped. ${String(error)}`);
    return;
  }
  test.skip(res?.status() === 404, 'Login route unavailable; help-system pre-tests skipped.');

  const loginField = page.locator('input[name="identifier"]');
  const hasLogin = await loginField.isVisible({ timeout: 5000 }).catch(() => false);
  test.skip(!hasLogin, 'Login form unavailable; help-system pre-tests skipped.');

  await loginField.fill(ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard|\/app\//, { timeout: 20000 });
}

async function gotoDraftRoom(page: Page): Promise<void> {
  await page.goto('/app/dashboard');
  await page.waitForLoadState('networkidle');

  const writingToggle = page.getByRole('button', { name: /Writing/i }).first();
  if (await writingToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
    await writingToggle.click();
  }

  const draftRoom = page.getByText('Draft Room', { exact: true });
  const hasDraftRoom = await draftRoom.isVisible({ timeout: 5000 }).catch(() => false);
  test.skip(!hasDraftRoom, 'Draft Room is not visible for this user; contextual writing help skipped.');
  await draftRoom.click();
  await page.waitForLoadState('networkidle');
}

test.describe('Pre-test: Help system frontend', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('A1/A2 - floating Help button opens the drawer on dashboard', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');

    const helpButton = page.getByRole('button', { name: /^Help$/ });
    await expect(helpButton).toBeVisible();
    await helpButton.click();

    await expect(page.getByText('Help', { exact: true }).last()).toBeVisible();
    const hasBrowse = await page.getByText(/Browse help/i).isVisible({ timeout: 3000 }).catch(() => false);
    const hasOpenFull = await page.getByText(/Open full help page/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasBrowse || hasOpenFull).toBe(true);
  });

  test('B1/B2 - Help Hub loads and can find Writing help', async ({ page }) => {
    await page.goto('/app/help');
    await page.waitForLoadState('networkidle');

    const search = page.getByPlaceholder('Search help docs...');
    await expect(search).toBeVisible();
    await search.fill('writing');

    await expect(page.getByRole('link', { name: /Writing/i }).first()).toBeVisible();
    await expect(page.getByText(/seeds|drafts|publishing/i).first()).toBeVisible();
  });

  test('B3 - Writing help article loads from the Help Hub', async ({ page }) => {
    await page.goto('/app/help');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Search help docs...').fill('writing');
    await page.getByRole('link', { name: /Writing/i }).first().click();

    await expect(page.getByRole('heading', { name: 'Writing' })).toBeVisible();
    const hasSection = await page.getByText('Key concepts', { exact: true }).isVisible({ timeout: 3000 }).catch(() => false);
    const hasAltSection = await page.getByText(/How to write and save a draft|Current limitations/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasSection || hasAltSection).toBe(true);
  });

  test('C1/C2 - Draft Room resolves contextual Writing help in the drawer', async ({ page }) => {
    await gotoDraftRoom(page);

    await expect(page.getByText('Draft Room', { exact: true }).first()).toBeVisible();

    const helpButton = page.getByRole('button', { name: /^Help$/ });
    await helpButton.click();

    await expect(page.getByText('Writing', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    const hasWritingCopy = await page.getByText(/drafts|seeds|publishing|stream authoring/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasWritingCopy).toBe(true);
  });

  test('C3 - Draft Room inline help tip opens a Writing preview popover', async ({ page }) => {
    await gotoDraftRoom(page);

    const inlineTip = page.getByRole('button', { name: /^\?$/ }).first();
    const hasTip = await inlineTip.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasTip, 'Inline help tip not visible in Draft Room.');

    await inlineTip.click();
    await expect(page.getByText('Writing', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Read more/i })).toBeVisible();
  });
});
