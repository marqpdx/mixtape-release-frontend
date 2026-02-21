# Pre-Test -> Playwright Template

Use this file as the standard hand-off contract for converting any `pre-tests/*.md` document into executable Playwright tests.

## Objective
- Convert one pre-test markdown file into one Playwright spec file.
- Keep tests deterministic, role-aware, and failure-triage ready.
- Prefer conservative assertions that reflect user-visible behavior.

## Output Location
- Spec file: `pre-tests/playwright/<pre-test-name>.spec.ts`
- Shared helpers: `pre-tests/playwright/helpers/*.ts`

## Required Sections For Every Converted Spec
1. `Source of truth`
- Link the exact `pre-tests/*.md` file used.
- List scenario IDs copied (example: `A1`, `B2`, `D4`).

2. `Environment contract`
- `E2E_BASE_URL`
- Auth creds used by that suite (example: `E2E_AUTHOR_EMAIL`, `E2E_AUTHOR_PASSWORD`).
- Any required seeded records.

3. `Selector strategy`
- Preferred: `getByRole` + accessible name.
- Secondary: `getByLabel` / `getByPlaceholder`.
- Last resort: stable text with scoped locator.
- Avoid brittle CSS chains.

4. `Scenario mapping`
- One Playwright test maps to one scenario ID when feasible.
- If merged, explain why in spec comments.

5. `Failure triage payload`
- Always include in failure notes:
  1. Scenario name
  2. Last successful step
  3. Actual vs expected
  4. Artifact path (trace/video/screenshot)
  5. Suspected owner (`frontend` | `backend` | `infra`)

## Conservative Authoring Rules
- Keep tests independent.
- Do not require execution ordering.
- Use `test.skip` with explicit reason when blocked by missing route, selector, or backend contract.
- Start with Chromium-only assumptions unless asked to expand matrix.
- Assert user-visible outcomes first; network details second.

## Skeleton: Shared Helper
```ts
// pre-tests/playwright/helpers/session.ts
import { expect, Page } from '@playwright/test';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export async function loginWithEmail(page: Page, email: string, password: string) {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByRole('textbox', { name: /email|username/i }).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(/dashboard|app\//);
}
```

## Skeleton: Spec
```ts
// pre-tests/playwright/example.spec.ts
import { test, expect } from '@playwright/test';
import { loginWithEmail, requireEnv } from './helpers/session';

const AUTHOR_EMAIL = requireEnv('E2E_AUTHOR_EMAIL');
const AUTHOR_PASSWORD = requireEnv('E2E_AUTHOR_PASSWORD');

test.describe('Pre-test: <name>', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithEmail(page, AUTHOR_EMAIL, AUTHOR_PASSWORD);
  });

  test('A1 - <scenario name>', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });

  test.skip('B2 - <scenario blocked>', async () => {
    // Block reason: missing selector/data-testid in current UI.
  });
});
```

## Agent Checklist (must complete before hand-off)
- [ ] Scenario IDs in spec match pre-test document.
- [ ] All `skip` tests include concrete unblock reason.
- [ ] No destructive commands used.
- [ ] Commands to run only this spec documented in PR/notes.
- [ ] Artifacts enabled via existing Playwright config.
- [ ] Any discovered defect captured in `_issues.md` with repro + expected behavior.
- [ ] If suites were run, update `app/TEST_RUN_STATUS.md` for only the executed areas.

## Appendix Alignment (from frontend-testing-agent-seed.md)
- Treat pre-tests as source-of-truth contracts until explicitly revised.
- Keep quiet/signal-first run behavior when executing broad suites.
- Use owner buckets consistently in triage: `frontend`, `backend`, `infra`.

## Run Commands
```bash
# Run one converted pre-test spec
npx playwright test pre-tests/playwright/<pre-test-name>.spec.ts

# Run all converted pre-test specs
npx playwright test pre-tests/playwright
```

## Notes For This Repo
- Existing project Playwright config currently points at `tests/` (`apps/mixtape/playwright.config.ts`).
- If you want these pre-tests to run in CI, either:
  - move validated specs into `tests/`, or
  - add a second Playwright config targeting `pre-tests/playwright/`.
