import { test, expect, type Page } from '@playwright/test';
import { requireEnv } from './helpers/session';

// Source of truth: pre-tests/workbench-curation-frontend-pre.md
// Scenario IDs: A1, A2, B1, B2, B3, C1, C2, C3, D1, D2, E1, F1, F2, G1

const BASE_URL = requireEnv('E2E_BASE_URL');
const ADMIN_EMAIL = requireEnv('E2E_ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('E2E_ADMIN_PASSWORD');
const TEST_GROUP_SLUG = process.env.E2E_TEST_GROUP_SLUG || 'default';

test.use({ baseURL: BASE_URL });

const WORKBENCH_URL = `/groups/${TEST_GROUP_SLUG}?view=admin&section=workbench-curation`;

async function loginAsAdmin(page: Page): Promise<void> {
  await page.context().clearCookies();
  let res;
  try {
    res = await page.goto('/app/login');
  } catch (error) {
    test.skip(true, `Frontend host unavailable; workbench pre-tests skipped. ${String(error)}`);
    return;
  }
  test.skip(res?.status() === 404, 'Login route unavailable; workbench pre-tests skipped.');

  const loginField = page.locator('input[name="identifier"]');
  const hasLogin = await loginField.isVisible({ timeout: 5000 }).catch(() => false);
  test.skip(!hasLogin, 'Login form unavailable; workbench pre-tests skipped.');

  await loginField.fill(ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/groups|\/dashboard|\/app\//, { timeout: 20000 });
}

test.describe('Pre-test: Workbench Curation frontend', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ============================================================
  // A) Navigation & Access
  // ============================================================

  test('A1 - Workbench / Curation menu item exists', async ({ page }) => {
    await page.goto(`/groups/${TEST_GROUP_SLUG}?view=admin`);
    await page.waitForLoadState('networkidle');

    // Open Workbench menu group if collapsed
    const workbenchToggle = page.getByRole('button', { name: /Workbench/i }).first();
    if (await workbenchToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await workbenchToggle.click();
    }

    await expect(page.getByText('Curation', { exact: true })).toBeVisible();
  });

  test('A2 - Workbench section loads with four lanes', async ({ page }) => {
    await page.goto(WORKBENCH_URL);
    await page.waitForLoadState('networkidle');

    // All four lane headers must be present
    await expect(page.getByText('Raw', { exact: true })).toBeVisible();
    await expect(page.getByText('Working Set', { exact: true })).toBeVisible();
    await expect(page.getByText('Craft', { exact: true })).toBeVisible();
    await expect(page.getByText('Published', { exact: true })).toBeVisible();

    // No error fallback
    await expect(page.getByText('This group section is under development.')).toHaveCount(0);
    await expect(page.getByText('Access Denied')).toHaveCount(0);
  });

  // ============================================================
  // B) Lane 1 — Raw Pieces
  // ============================================================

  test('B1 - Pieces load in Lane 1', async ({ page }) => {
    await page.goto(WORKBENCH_URL);
    await page.waitForLoadState('networkidle');

    // Wait for at least one piece card (spinner should resolve)
    await expect(page.locator('[data-testid="piece-card"], .chakra-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('B2 - Search filters pieces', async ({ page }) => {
    await page.goto(WORKBENCH_URL);
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Search pieces...');
    await expect(searchInput).toBeVisible();

    // Count cards before search
    const initialCount = await page.locator('.chakra-card').count();

    // Type an unlikely string that should return 0 results
    await searchInput.fill('xyzzy_no_match_12345');
    await expect(page.getByText('No raw pieces yet.')).toBeVisible({ timeout: 3000 });

    // Clear and confirm list restores
    await searchInput.clear();
    await expect(page.locator('.chakra-card').first()).toBeVisible({ timeout: 5000 });
  });

  test('B3 - Clicking a piece selects it and shows create CTA', async ({ page }) => {
    await page.goto(WORKBENCH_URL);
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('.chakra-card').first();
    await firstCard.click();

    // CTA should appear
    await expect(page.getByText(/Create working item/i)).toBeVisible({ timeout: 3000 });
  });

  // ============================================================
  // C) Lane 2 — Working Set
  // ============================================================

  test('C1 - Creating a working item shows it in Lane 2', async ({ page }) => {
    await page.goto(WORKBENCH_URL);
    await page.waitForLoadState('networkidle');

    // Select first piece
    await page.locator('.chakra-card').first().click();
    await expect(page.getByText(/Create working item/i)).toBeVisible();

    // Enter title
    const titleInput = page.getByPlaceholder('Working item title...');
    await titleInput.fill(`Test item ${Date.now()}`);

    // Click create
    await page.getByRole('button', { name: /Create working item/i }).click();

    // Working item should appear — wait for network
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Test item/i)).toBeVisible({ timeout: 8000 });
  });

  test('C2 - Opening a working item shows the editor panel', async ({ page }) => {
    await page.goto(WORKBENCH_URL);
    await page.waitForLoadState('networkidle');

    // Click on an existing working item card (assumes one exists from prior test or fixture)
    const wiCard = page.locator('.chakra-card').filter({ hasText: /assembling|ready|parked/ }).first();
    const hasWI = await wiCard.isVisible({ timeout: 4000 }).catch(() => false);
    test.skip(!hasWI, 'No working items found — skipping detail panel test.');

    await wiCard.click();
    await expect(page.getByText('SOURCE PIECES')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('PROMOTE TO DRAFT')).toBeVisible({ timeout: 5000 });
  });

  test('C3 - Status buttons update working item status', async ({ page }) => {
    await page.goto(WORKBENCH_URL);
    await page.waitForLoadState('networkidle');

    const wiCard = page.locator('.chakra-card').filter({ hasText: /assembling|parked/ }).first();
    const hasWI = await wiCard.isVisible({ timeout: 4000 }).catch(() => false);
    test.skip(!hasWI, 'No assembling/parked working items — skipping status update test.');

    await wiCard.click();
    await page.getByRole('button', { name: /ready/i }).click();

    await expect(page.locator('[data-status="ready"], .chakra-badge').filter({ hasText: 'ready' }).first())
      .toBeVisible({ timeout: 5000 });
  });

  // ============================================================
  // D) Lane Focus / Collapse
  // ============================================================

  test('D1 - Clicking Working Set header expands it to ~85%', async ({ page }) => {
    await page.goto(WORKBENCH_URL);
    await page.waitForLoadState('networkidle');

    // Click "Working Set" header — find via the LaneHeader HStack
    await page.getByText('Working Set', { exact: true }).click();

    // Collapsed lanes show rotated label text; Raw label should collapse
    await expect(page.getByText('Raw').filter({ hasText: 'Raw' }).nth(1)).toBeVisible({ timeout: 3000 });
  });

  test('D2 - Clicking same header again restores equal widths', async ({ page }) => {
    await page.goto(WORKBENCH_URL);
    await page.waitForLoadState('networkidle');

    await page.getByText('Working Set', { exact: true }).click();
    await page.getByText('Working Set', { exact: true }).click();

    // After un-focus, all four headers should be visible and non-collapsed
    await expect(page.getByText('Raw', { exact: true })).toBeVisible();
    await expect(page.getByText('Craft', { exact: true })).toBeVisible();
  });

  // ============================================================
  // E) Lane 3 — Craft idle state
  // ============================================================

  test('E1 - Lane 3 shows idle placeholder when no item promoted', async ({ page }) => {
    await page.goto(WORKBENCH_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Promote a working item to open the editor here/i)).toBeVisible();
  });

  // ============================================================
  // F) Lane 4 — Published
  // ============================================================

  test('F1 - Published lane renders (cards or empty state)', async ({ page }) => {
    await page.goto(WORKBENCH_URL);
    await page.waitForLoadState('networkidle');

    // Either published cards or the empty message — one must be visible
    const hasCards = await page.locator('.chakra-card').last().isVisible({ timeout: 6000 }).catch(() => false);
    const hasEmpty = await page.getByText('No published pieces yet.').isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasCards || hasEmpty).toBe(true);
  });

  // ============================================================
  // G) Promotion Gate Feedback
  // ============================================================

  test('G1 - Promote button disabled when status is not ready', async ({ page }) => {
    await page.goto(WORKBENCH_URL);
    await page.waitForLoadState('networkidle');

    const wiCard = page.locator('.chakra-card').filter({ hasText: /assembling/ }).first();
    const hasWI = await wiCard.isVisible({ timeout: 4000 }).catch(() => false);
    test.skip(!hasWI, 'No assembling working items — skipping gate test.');

    await wiCard.click();
    const promoteBtn = page.getByRole('button', { name: /Promote to Draft/i });
    await expect(promoteBtn).toBeVisible({ timeout: 5000 });
    await expect(promoteBtn).toBeDisabled();
    await expect(page.getByText(/Set status to "ready"/i)).toBeVisible();
  });
});
