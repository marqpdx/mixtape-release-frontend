import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3011';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const SHOTS = '/tmp/studio-verify';

const results = [];
const ss = (name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });

async function go(path, label) {
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  if (label) await ss(label);
  return { url: page.url() };
}

// 1 + 2: Load app root — nav Studio link + console redirect
await go('/', '1-home');
const studioNavLink = await page.locator('a[href="/app/studio"]').first().isVisible().catch(() => false);
results.push({ test: '1. Nav Studio link (href=/app/studio)', pass: studioNavLink });

let r = await go('/console', '2-console-redirect');
const redirectedToStudio = r.url.includes('/app/studio');
results.push({ test: '2. /console redirects to /app/studio', pass: redirectedToStudio, landedAt: r.url });

// 3: Lounge structure
r = await go('/app/studio', '3-lounge');
const bodyText = await page.textContent('body').catch(() => '');
results.push({ test: '3. Studio Lounge loads', url: r.url, bodySnippet: bodyText.slice(0, 200).replace(/\s+/g, ' ') });

// 4: Beryl card (absent when no raw scraps)
const berylCard = await page.locator('[class*="beryl"], [data-testid*="beryl"]').first().isVisible().catch(() => false);
const berylText = await page.locator('text=Beryl').first().isVisible().catch(() => false);
results.push({ test: '4. Beryl card on lounge (expect absent without scraps)', visible: berylCard || berylText });

// 5: /app/studio/beryl
r = await go('/app/studio/beryl', '5-beryl-session');
const berylPageBody = await page.textContent('body').catch(() => '');
results.push({ test: '5. /app/studio/beryl loads', url: r.url, bodySnippet: berylPageBody.slice(0, 300).replace(/\s+/g, ' ') });

// 6: Group Studio tabs — find group links from studio page
r = await go('/app/studio', null);
const groupAnchorEls = await page.locator('a[href*="/app/studio/"]').all();
const groupHrefs = [];
for (const el of groupAnchorEls.slice(0, 5)) {
  const href = await el.getAttribute('href').catch(() => null);
  if (href && href !== '/app/studio') groupHrefs.push(href);
}
results.push({ test: '6a. Group studio links found', links: groupHrefs });

if (groupHrefs.length > 0) {
  r = await go(groupHrefs[0], '6-group-studio');
  const tabPulse = await page.locator('button, [role="tab"]').filter({ hasText: /^Pulse$/ }).first().isVisible().catch(() => false);
  const tabCanon = await page.locator('button, [role="tab"]').filter({ hasText: /^Canon$/ }).first().isVisible().catch(() => false);
  const tabCommand = await page.locator('button, [role="tab"]').filter({ hasText: /^Command$/ }).first().isVisible().catch(() => false);
  results.push({ test: `6b. Group studio tabs at ${groupHrefs[0]}`, pulse: tabPulse, canon: tabCanon, command: tabCommand });

  // 7: VerbPicker — click Pulse → + Add
  if (tabPulse) {
    await page.locator('button, [role="tab"]').filter({ hasText: /^Pulse$/ }).first().click();
    await page.waitForTimeout(500);
    await ss('7-pulse-tab');

    // Find add button
    const addBtns = await page.locator('button').all();
    let addBtnText = [];
    for (const btn of addBtns) {
      const t = await btn.textContent().catch(() => '');
      if (/add|new|\+/i.test(t)) addBtnText.push(t.trim());
    }
    results.push({ test: '7a. Pulse tab add buttons found', buttons: addBtnText.slice(0, 5) });

    // Click the first add-like button
    const addBtn = await page.locator('button').filter({ hasText: /add|new|\+/i }).first();
    const addVisible = await addBtn.isVisible().catch(() => false);
    if (addVisible) {
      await addBtn.click();
      await page.waitForTimeout(700);
      await ss('7-verbpicker');
      const pageAfterAdd = await page.textContent('body').catch(() => '');
      const hasVerbOptions = /draft|summarize|synthesize|retrieve|curate/i.test(pageAfterAdd);
      results.push({ test: '7b. VerbPicker visible after + Add click', pass: hasVerbOptions, snippet: pageAfterAdd.slice(0, 400).replace(/\s+/g, ' ') });
    }
  } else {
    results.push({ test: '7. VerbPicker', skipped: 'Pulse tab not found' });
  }
} else {
  results.push({ test: '6b/7. Group studio', skipped: 'No group links found on /app/studio' });
}

// 8: Member Hub — need a real username; try generic path
r = await go('/member', '8-member-hub');
const worktableVisible = await page.locator('button, a, [role="menuitem"]').filter({ hasText: /worktable/i }).first().isVisible().catch(() => false);
results.push({ test: '8. WorkTable absent from member hub nav', pass: !worktableVisible, url: r.url });

// Also check current body for worktable mention
const memberBody = await page.textContent('body').catch(() => '');
const worktableInBody = /worktable/i.test(memberBody);
results.push({ test: '8b. "worktable" not in page body', pass: !worktableInBody });

await browser.close();
console.log(JSON.stringify(results, null, 2));
