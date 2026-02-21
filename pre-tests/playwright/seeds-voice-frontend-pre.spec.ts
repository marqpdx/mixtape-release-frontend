import { test, expect } from '@playwright/test';
import { loginWithEmail, requireEnv } from './helpers/session';

const AUTHOR_EMAIL = requireEnv('E2E_AUTHOR_EMAIL');
const AUTHOR_PASSWORD = requireEnv('E2E_AUTHOR_PASSWORD');

test.describe('Pre-test: Voice Seeds v1 Frontend', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithEmail(page, AUTHOR_EMAIL, AUTHOR_PASSWORD);
    await page.goto('/seed');
    await page.waitForLoadState('networkidle');
  });

  test('D1/E1 - Text seed appears and autosave hint is visible', async ({ page }) => {
    await expect(page.getByText('Autosaves as you type')).toBeVisible();

    const input = page.getByPlaceholder('Capture a quick idea...');
    await input.fill('voice-seed-pretest-text-entry');

    await page.getByLabel('Send seed').click();
    await expect(page.getByText('voice-seed-pretest-text-entry')).toBeVisible();
  });

  test('B1 - Upload via file picker creates a processing voice seed', async ({ page }) => {
    const chooser = page.waitForEvent('filechooser');
    await page.getByLabel('Upload audio file').click();
    const fileChooser = await chooser;

    await fileChooser.setFiles({
      name: 'sample.wav',
      mimeType: 'audio/wav',
      buffer: Buffer.from('RIFF....WAVEfmt ', 'utf8'),
    });

    await expect(page.getByText('Transcribing…')).toBeVisible({ timeout: 15000 });
  });

  test.skip('A1/A2 - Microphone record and stop flow', async ({ page, browserName }) => {
    // Blocked for now: CI/browser permission handling for MediaRecorder differs by runtime.
    // Source: pre-tests/seeds-voice-frontend-pre.md scenarios A1, A2.
    test.skip(browserName !== 'chromium', 'recording path currently scoped to Chromium baseline');
    await page.goto('/');
  });

  test.skip('C1/C2 - Processing to transcript and audio playback', async ({ page }) => {
    // Blocked for now: requires stable backend transcription timing + seeded ready voice fixture.
    // Source: pre-tests/seeds-voice-frontend-pre.md scenarios C1, C2.
    await page.goto('/');
  });

  test.skip('B2 - Unsupported upload format shows UX error', async ({ page }) => {
    // Blocked for now: current UI does not expose deterministic toast/inline error assertion.
    // Source: pre-tests/seeds-voice-frontend-pre.md scenario B2.
    await page.goto('/');
  });
});
