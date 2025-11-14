// tests/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup runs once before all tests
 *
 * Purpose:
 * - Verify both frontend and backend servers are running
 * - Clear any existing test data
 * - Ensure clean test environment
 */
async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseURL = config.projects[0].use.baseURL || 'http://127.0.0.1:3010';
  const backendURL = process.env.BACKEND_URL || 'http://127.0.0.1:8010';

  console.log('\n🧪 Mixtape Test Setup');
  console.log('─'.repeat(50));

  // Check frontend server
  try {
    await page.goto(baseURL, { timeout: 10000 });
    console.log(`✓ Frontend server running: ${baseURL}`);
  } catch (error) {
    console.error(`✗ Frontend server not responding at ${baseURL}`);
    console.error('  Run: yarn dev');
    await browser.close();
    throw new Error('Frontend server not available');
  }

  // Check backend server
  try {
    const response = await page.request.get(`${backendURL}/health/`);
    if (response.ok()) {
      console.log(`✓ Backend server running: ${backendURL}`);
    } else {
      throw new Error(`Backend returned ${response.status()}`);
    }
  } catch (error) {
    console.error(`✗ Backend server not responding at ${backendURL}/health/`);
    console.error('  Run: cd ../mixtape-release-core && python manage.py runserver 127.0.0.1:8010');
    await browser.close();
    throw new Error('Backend server not available');
  }

  // Clear test emails
  try {
    await page.request.post(`${backendURL}/api/test/clear-emails/`);
    console.log('✓ Test environment cleared');
  } catch (error) {
    console.warn('⚠ Could not clear test emails (may not be critical)');
  }

  console.log('─'.repeat(50));
  console.log('✓ All systems ready for testing\n');

  await browser.close();
}

export default globalSetup;
