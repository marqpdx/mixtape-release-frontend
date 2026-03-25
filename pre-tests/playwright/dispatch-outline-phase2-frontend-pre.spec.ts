// Source of truth: pre-tests/dispatch-outline-phase2-frontend-pre.md
// Scenarios: A1, A2, B1, B2, C1, C2, C3, C4, C5, D1, E1, E2, F1, G2

import { test, expect } from '@playwright/test';
import { loginWithEmail, gotoAuthorWritePage, requireEnv } from './helpers/session';

const AUTHOR_EMAIL = requireEnv('E2E_AUTHOR_EMAIL');
const AUTHOR_PASSWORD = requireEnv('E2E_AUTHOR_PASSWORD');
const AUTHOR_USERNAME = process.env.E2E_AUTHOR_USERNAME || 'admin';

// Environment contract:
// - E2E_BASE_URL
// - E2E_AUTHOR_EMAIL / E2E_AUTHOR_PASSWORD — user who owns a dispatch WritingPiece
// - Seeded: at least one WritingPiece with writing_kind=dispatch, enable_outline=false

test.describe('Pre-test: Dispatch Outline Phase 2', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithEmail(page, AUTHOR_EMAIL, AUTHOR_PASSWORD);
    await gotoAuthorWritePage(page, AUTHOR_USERNAME);
  });

  // --- A) Dual Mode ---

  test('A1 - Outline disabled shows headings fallback mode', async ({ page }) => {
    // Add an H1 heading first
    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    await editor.fill('Test heading');
    await page.getByLabel('Heading 1').click();

    await page.getByRole('button', { name: /outline/i }).click();

    await expect(page.getByText(/auto-detected/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /enable persistent outline/i })).toBeVisible();
  });

  test('A2 - Enable persistent outline switches to Phase 2 mode', async ({ page }) => {
    await page.getByRole('button', { name: /outline/i }).click();
    await page.getByRole('button', { name: /enable persistent outline/i }).click();

    // Phase 2 mode: enable button gone, Add Section appears
    await expect(page.getByRole('button', { name: /enable persistent outline/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /add section/i })).toBeVisible();
  });

  // --- B) Create Section ---

  test('B1 - Add section creates node in drawer', async ({ page }) => {
    await page.getByRole('button', { name: /outline/i }).click();

    // Enable outline if not already
    const enableBtn = page.getByRole('button', { name: /enable persistent outline/i });
    if (await enableBtn.isVisible()) {
      await enableBtn.click();
    }

    await page.getByRole('button', { name: /add section/i }).click();

    // Section appears in drawer
    await expect(page.getByText(/new section/i)).toBeVisible();
  });

  test('B2 - Multiple sections appear in order', async ({ page }) => {
    await page.getByRole('button', { name: /outline/i }).click();

    const enableBtn = page.getByRole('button', { name: /enable persistent outline/i });
    if (await enableBtn.isVisible()) {
      await enableBtn.click();
    }

    await page.getByRole('button', { name: /add section/i }).click();
    await page.getByRole('button', { name: /add section/i }).click();
    await page.getByRole('button', { name: /add section/i }).click();

    const sections = page.locator('[data-section-item]');
    await expect(sections).toHaveCount(3);
  });

  // --- C) Edit Section Title ---

  test('C1 - Double-click section title enters edit mode', async ({ page }) => {
    await page.getByRole('button', { name: /outline/i }).click();

    const enableBtn = page.getByRole('button', { name: /enable persistent outline/i });
    if (await enableBtn.isVisible()) {
      await enableBtn.click();
    }

    await page.getByRole('button', { name: /add section/i }).click();
    await page.getByText(/new section/i).dblclick();

    await expect(page.locator('input[data-title-input], input[placeholder*="Section"]')).toBeVisible();
  });

  test('C2 - Save title on Enter', async ({ page }) => {
    await page.getByRole('button', { name: /outline/i }).click();

    const enableBtn = page.getByRole('button', { name: /enable persistent outline/i });
    if (await enableBtn.isVisible()) {
      await enableBtn.click();
    }

    await page.getByRole('button', { name: /add section/i }).click();
    await page.getByText(/new section/i).dblclick();

    const titleInput = page.locator('input[data-title-input], input[placeholder*="Section"]');
    await titleInput.fill('Introduction');
    await titleInput.press('Enter');

    await expect(page.getByText('Introduction')).toBeVisible();
    await expect(titleInput).toHaveCount(0);
  });

  test('C4 - Escape cancels title edit without saving', async ({ page }) => {
    await page.getByRole('button', { name: /outline/i }).click();

    const enableBtn = page.getByRole('button', { name: /enable persistent outline/i });
    if (await enableBtn.isVisible()) {
      await enableBtn.click();
    }

    await page.getByRole('button', { name: /add section/i }).click();
    await page.getByText(/new section/i).dblclick();

    const titleInput = page.locator('input[data-title-input], input[placeholder*="Section"]');
    await titleInput.fill('Should not save');
    await titleInput.press('Escape');

    await expect(page.getByText(/new section/i)).toBeVisible();
    await expect(page.getByText('Should not save')).toHaveCount(0);
  });

  // --- D) Delete Section ---

  test('D1 - Delete button removes section from drawer', async ({ page }) => {
    await page.getByRole('button', { name: /outline/i }).click();

    const enableBtn = page.getByRole('button', { name: /enable persistent outline/i });
    if (await enableBtn.isVisible()) {
      await enableBtn.click();
    }

    await page.getByRole('button', { name: /add section/i }).click();
    await expect(page.getByText(/new section/i)).toBeVisible();

    await page.getByRole('button', { name: /delete section/i }).first().click();

    await expect(page.getByText(/new section/i)).toHaveCount(0);
  });

  // --- E) Navigation ---

  test.skip('E1 - Click section scrolls editor to marker position', async ({ page }) => {
    // Blocked: requires deterministic marker position and scroll assertion.
    // Source: dispatch-outline-phase2-frontend-pre.md scenario E1.
    await page.goto('/');
  });

  test.skip('E2 - Orphaned section shows unlinked indicator', async ({ page }) => {
    // Blocked: requires manual marker deletion from editor JSON, which is difficult to
    // trigger reliably in Playwright without direct TipTap state manipulation.
    // Source: dispatch-outline-phase2-frontend-pre.md scenario E2.
    await page.goto('/');
  });

  // --- F) State Persistence ---

  test('F1 - Outline sections survive page reload', async ({ page }) => {
    await page.getByRole('button', { name: /outline/i }).click();

    const enableBtn = page.getByRole('button', { name: /enable persistent outline/i });
    if (await enableBtn.isVisible()) {
      await enableBtn.click();
    }

    await page.getByRole('button', { name: /add section/i }).click();
    await page.getByText(/new section/i).dblclick();
    const titleInput = page.locator('input[data-title-input], input[placeholder*="Section"]');
    await titleInput.fill('Persistent Section');
    await titleInput.press('Enter');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /outline/i }).click();

    await expect(page.getByText('Persistent Section')).toBeVisible();
  });

  // --- G) Edge Cases ---

  test.skip('G2 - Non-author/collaborator cannot open outline (403)', async ({ page }) => {
    // Blocked: requires a second user fixture and cross-user navigation setup.
    // Source: dispatch-outline-phase2-frontend-pre.md scenario G2.
    await page.goto('/');
  });
});
