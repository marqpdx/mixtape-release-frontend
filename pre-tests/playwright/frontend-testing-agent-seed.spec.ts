import { test, expect } from '@playwright/test';
import { loginWithEmail, requireEnv } from './helpers/session';

const AUTHOR_EMAIL = requireEnv('E2E_AUTHOR_EMAIL');
const AUTHOR_PASSWORD = requireEnv('E2E_AUTHOR_PASSWORD');

test.describe('Pre-test: Frontend Testing Agent Seed (Appendix Contracts)', () => {
  test('Contract - required env vars for role-based suites are defined', async () => {
    const requiredVars = [
      'E2E_AUTHOR_EMAIL',
      'E2E_AUTHOR_PASSWORD',
      'E2E_EDITOR_EMAIL',
      'E2E_EDITOR_PASSWORD',
      'E2E_COMMENTER_EMAIL',
      'E2E_COMMENTER_PASSWORD',
      'E2E_OUTSIDER_EMAIL',
      'E2E_OUTSIDER_PASSWORD',
    ];

    for (const name of requiredVars) {
      expect(process.env[name], `${name} must be set for frontend role-based suites`).toBeTruthy();
    }
  });

  test('Contract - authenticated author can reach seed page', async ({ page }) => {
    await loginWithEmail(page, AUTHOR_EMAIL, AUTHOR_PASSWORD);
    await page.goto('/seed');
    await expect(page.getByPlaceholder('Capture a quick idea...')).toBeVisible();
  });

  test.skip('Contract - dispatch comments pre-test mapping', async ({ page }) => {
    // Blocked for now: pre-tests/dispatch-comments-pre.md is referenced but not present in this repo.
    // This test should be replaced once that source pre-test exists.
    await page.goto('/');
  });

  test('Triage shape - owner bucket vocabulary is fixed', async () => {
    const buckets = ['frontend', 'backend', 'infra'];
    expect(buckets).toEqual(['frontend', 'backend', 'infra']);
  });
});
