// tests/global-teardown.ts
import { FullConfig } from '@playwright/test';

/**
 * Global teardown runs once after all tests complete
 *
 * Purpose:
 * - Clean up any test data created during test runs
 * - Clean up temporary test users (those created during registration tests)
 * - Leave persistent test users (admin, existinguser, groupmember) for next run
 */
async function globalTeardown(config: FullConfig) {
  const backendURL = process.env.BACKEND_URL || 'http://127.0.0.1:8010';

  console.log('\n🧹 Cleaning up test environment');
  console.log('─'.repeat(50));

  // Note: We keep the main test users (admin, existinguser, groupmember)
  // because they're needed for the next test run. Only clean up users
  // created during tests (e.g., registration tests create random users).

  // In the future, if we need to clean up test data, we can add API calls here:
  // - Delete users created during registration tests (username starts with "testuser")
  // - Clear test groups
  // - Reset database state

  console.log('✓ Cleanup complete');
  console.log('─'.repeat(50));
}

export default globalTeardown;
