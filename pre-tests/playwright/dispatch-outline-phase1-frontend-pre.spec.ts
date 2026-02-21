import { test, expect } from '@playwright/test';
import { gotoAuthorWritePage, loginWithEmail, requireEnv } from './helpers/session';

const AUTHOR_EMAIL = requireEnv('E2E_AUTHOR_EMAIL');
const AUTHOR_PASSWORD = requireEnv('E2E_AUTHOR_PASSWORD');
const AUTHOR_USERNAME = process.env.E2E_AUTHOR_USERNAME || 'admin';

test.describe('Pre-test: Dispatch Outline Phase 1', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithEmail(page, AUTHOR_EMAIL, AUTHOR_PASSWORD);
    await gotoAuthorWritePage(page, AUTHOR_USERNAME);
  });

  test('A1 - Empty document shows empty outline state', async ({ page }) => {
    await page.getByRole('button', { name: 'Outline' }).click();

    await expect(page.getByText('No headings found')).toBeVisible();
    await expect(page.getByText('Add H1, H2, or H3 headings in your document to see them here.')).toBeVisible();
  });

  test('C1 - H1/H2/H3 toolbar buttons are visible', async ({ page }) => {
    await expect(page.getByLabel('Heading 1')).toBeVisible();
    await expect(page.getByLabel('Heading 2')).toBeVisible();
    await expect(page.getByLabel('Heading 3')).toBeVisible();
  });

  test('A2 - Single heading appears in outline', async ({ page }) => {
    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    await editor.fill('Intro heading');

    await page.getByLabel('Heading 1').click();
    await page.getByRole('button', { name: 'Outline' }).click();

    await expect(page.getByText('H1')).toBeVisible();
    await expect(page.getByText('Intro heading')).toBeVisible();
  });

  test('D2 - Drawer closes via Close button', async ({ page }) => {
    await page.getByRole('button', { name: 'Outline' }).click();
    await expect(page.getByText('Outline')).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByText('No headings found')).toHaveCount(0);
  });

  test.skip('A3/B1/B2 - Nested tree + click-to-scroll + active highlight', async ({ page }) => {
    // Blocked for now: editor node-level selection + cursor assertions need stable heading/test IDs.
    // Source: pre-tests/dispatch-outline-phase1-frontend-pre.md scenarios A3, B1, B2.
    await page.goto('/');
  });

  test.skip('E1 - Collaborative mode outline extraction', async ({ page }) => {
    // Blocked for now: requires deterministic collab-enabled fixture document and collaborator setup.
    // Source: pre-tests/dispatch-outline-phase1-frontend-pre.md scenario E1.
    await page.goto('/');
  });
});
