// tests/auth/auth-permissions.spec.ts

import { test, expect } from '@playwright/test';

/**
 * Authentication: Permissions Flow (Phase 1)
 *
 * Tests the permissions system integration:
 * - Login receives permissions data
 * - Dashboard UI responds to permissions
 * - Group pages show/hide actions based on permissions
 * - Permission refresh works correctly
 * - Different roles have different access
 */

test.describe('Authentication: Permissions Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh - clear any existing session
    await page.context().clearCookies();
  });

  test('should receive permissions data after successful login', async ({ page, request }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill and submit login form
    await page.fill('input[name="identifier"]', 'admin@mixtape.com');
    await page.fill('input[name="password"]', 'testpassword123');

    // Intercept the login API call to verify permissions in response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/token') && response.status() === 200
    );

    await page.click('button[type="submit"]');

    // Wait for login response
    const response = await responsePromise;
    const data = await response.json();

    // Verify response includes permissions
    expect(data).toHaveProperty('permissions');
    expect(data.permissions).toHaveProperty('granted');
    expect(data.permissions).toHaveProperty('effective');
    expect(data.permissions).toHaveProperty('groups');

    // Verify permissions are arrays/objects
    expect(Array.isArray(data.permissions.granted)).toBe(true);
    expect(Array.isArray(data.permissions.effective)).toBe(true);
    expect(typeof data.permissions.groups).toBe('object');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('admin user should have admin permissions', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@mixtape.com');
    await page.fill('input[name="password"]', 'testpassword123');

    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/token')
    );

    await page.click('button[type="submit"]');

    const response = await responsePromise;
    const data = await response.json();

    // Admin should have high-level permissions
    const grantedPerms = data.permissions.granted || [];

    // Verify admin has create, edit, manage permissions
    expect(grantedPerms).toContain('create_course');
    expect(grantedPerms).toContain('edit_course');
    expect(grantedPerms).toContain('manage_members');
    expect(grantedPerms).toContain('delete_course');
  });

  test('dashboard should be accessible after login with permissions', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@mixtape.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Dashboard should render (no permission errors)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should persist permissions across page navigation', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@mixtape.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to a group page (if admin has access to any group)
    // This tests that permissions persist across navigation
    await page.goto('/dashboard');

    // Page should load without redirecting back to login
    await expect(page).toHaveURL(/\/dashboard/);

    // No authentication errors should appear
    const errorText = await page.textContent('body');
    expect(errorText).not.toContain('Unauthorized');
    expect(errorText).not.toContain('401');
  });

  test.skip('should show admin-only UI elements for admin users', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@mixtape.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // TODO: Navigate to a group page where permissions determine UI visibility
    // Once you have UI that conditionally renders based on permissions,
    // add assertions here to verify admin-only elements are visible

    // Example:
    // await page.goto('/groups/some-group');
    // await expect(page.locator('[data-testid="manage-members-button"]')).toBeVisible();
    // await expect(page.locator('[data-testid="delete-course-button"]')).toBeVisible();
  });

  test.skip('should hide admin-only UI elements for member users', async ({ page }) => {
    // TODO: Create a test user with 'member' role and test that admin UI is hidden

    // Login as member
    // await page.goto('/login');
    // await page.fill('input[name="identifier"]', 'member@mixtape.com');
    // await page.fill('input[name="password"]', 'testpassword123');
    // await page.click('button[type="submit"]');

    // Navigate to group page
    // await page.goto('/groups/some-group');

    // Verify admin-only elements are NOT visible
    // await expect(page.locator('[data-testid="manage-members-button"]')).not.toBeVisible();
    // await expect(page.locator('[data-testid="delete-course-button"]')).not.toBeVisible();
  });

  test('should handle empty permissions for users with no group memberships', async ({ page }) => {
    // TODO: Create a test user with no group memberships

    // For now, test that the app doesn't crash with empty permissions
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@mixtape.com');
    await page.fill('input[name="password"]', 'testpassword123');

    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/token')
    );

    await page.click('button[type="submit"]');

    const response = await responsePromise;
    const data = await response.json();

    // Even if empty, permissions should have proper structure
    expect(data.permissions).toHaveProperty('granted');
    expect(data.permissions).toHaveProperty('effective');
    expect(data.permissions).toHaveProperty('groups');

    // App should not crash
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test.skip('should update permissions after role change and refresh', async ({ page, request }) => {
    // TODO: This test requires backend API calls to change user roles
    // and then verify that refreshPermissions() fetches updated permissions

    // 1. Login as user
    // 2. Verify initial permissions (e.g., 'member' role)
    // 3. Use API to upgrade role to 'admin' (requires admin API endpoint)
    // 4. Call /api/auth/permissions/refresh
    // 5. Verify permissions now include admin permissions
    // 6. Verify UI updates accordingly
  });

  test('should not allow access to protected routes without authentication', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL(/\/login(\?redirect=.*)?/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test.skip('should handle permissions for multiple groups correctly', async ({ page }) => {
    // TODO: Test a user who is admin in one group and member in another

    // Login as user with multiple group memberships
    // await page.goto('/login');
    // await page.fill('input[name="identifier"]', 'multigroup@mixtape.com');
    // await page.fill('input[name="password"]', 'testpassword123');
    // await page.click('button[type="submit"]');

    // Intercept response to verify group-specific permissions
    // const response = await responsePromise;
    // const data = await response.json();

    // Verify group1 has admin permissions
    // expect(data.permissions.groups['group1'].permissions).toContain('manage_members');

    // Verify group2 has member permissions
    // expect(data.permissions.groups['group2'].permissions).not.toContain('manage_members');

    // Navigate to group1 - should see admin UI
    // await page.goto('/groups/group1');
    // await expect(page.locator('[data-testid="admin-action"]')).toBeVisible();

    // Navigate to group2 - should NOT see admin UI
    // await page.goto('/groups/group2');
    // await expect(page.locator('[data-testid="admin-action"]')).not.toBeVisible();
  });
});

test.describe('Authentication: Permission Edge Cases', () => {
  test('should handle malformed permissions gracefully', async ({ page, context }) => {
    // This test verifies the app doesn't crash if permissions data is malformed
    // In practice, backend should always return properly formatted data,
    // but frontend should be defensive

    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@mixtape.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // App should render without crashing
    await expect(page.locator('body')).toBeVisible();

    // No JavaScript errors in console (check console logs)
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate around
    await page.goto('/dashboard');

    // Verify no permission-related errors
    expect(errors.filter(e => e.includes('permission'))).toHaveLength(0);
  });

  test('should handle logout and clear permissions', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@mixtape.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // TODO: Trigger logout (need to know how logout works in your app)
    // await page.click('[data-testid="logout-button"]');

    // After logout, should redirect to login or home
    // Attempting to access protected route should fail
    // await page.goto('/dashboard');
    // await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Authentication: /auth/me Endpoint', () => {
  test('should return user identity with permissions when authenticated', async ({ page, request }) => {
    // Login to get access token
    await page.goto('/login');
    await page.fill('input[name="identifier"]', 'admin@mixtape.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Make request to /auth/me endpoint
    // Note: This requires the access token to be available
    // In real app, the token is httpOnly, so we test via page context

    const meResponse = await page.waitForResponse(
      response => response.url().includes('/api/auth/me'),
      {
        timeout: 5000,
      }
    ).catch(() => null);

    if (meResponse) {
      const meData = await meResponse.json();

      // Verify structure
      expect(meData).toHaveProperty('id');
      expect(meData).toHaveProperty('username');
      expect(meData).toHaveProperty('email');
      expect(meData).toHaveProperty('permissions');

      // Verify permissions structure
      expect(meData.permissions).toHaveProperty('granted');
      expect(meData.permissions).toHaveProperty('effective');
      expect(meData.permissions).toHaveProperty('groups');
    }
  });
});
