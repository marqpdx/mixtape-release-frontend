import { expect, Page } from '@playwright/test';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export async function loginWithEmail(page: Page, email: string, password: string): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/login');

  await page.locator('input[name="identifier"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(/\/dashboard|\/app\//, { timeout: 15000 });
  await expect(page).toHaveURL(/\/dashboard|\/app\//);
}

export async function gotoAuthorWritePage(page: Page, username: string): Promise<void> {
  await page.goto(`/member/${username}/write`);
  await page.waitForLoadState('networkidle');
}
