import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3011';
const SHOTS = '/tmp/studio-verify';
const EMAIL = 'marqpdx@gmail.com';
const PASS  = 'boston99';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const results = [];
const ss = (name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });

async function go(path, label) {
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);
  if (label) await ss(label);
  return { url: page.url() };
}

// --- LOGIN ---
await page.goto(BASE + '/app/login', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(500);
// Fill email
const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
await emailInput.fill(EMAIL);
const passInput = page.locator('input[type="password"]').first();
await passInput.fill(PASS);
await ss('0-login-filled');
await page.locator('button', { hasText: /sign in/i }).click();
await page.waitForTimeout(1500);
await page.waitForURL(/\/app\//, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1000);
await ss('0-after-login');
results.push({ test: '0. Login', url: page.url(), loggedIn: !page.url().includes('/login') });

// 1. Nav Studio link
const studioNavLink = await page.locator('a[href="/app/studio"]').first().isVisible().catch(() => false);
results.push({ test: '1. Nav "Studio" link (href=/app/studio)', pass: studioNavLink });
await ss('1-nav');

// 2. /console redirect
const r2 = await go('/console', '2-console-redirect');
results.push({ test: '2. /console → /app/studio', pass: r2.url.includes('/app/studio'), landedAt: r2.url });

// 3 & 4. Studio Lounge + Beryl card
const r3 = await go('/app/studio', '3-lounge');
results.push({ test: '3. /app/studio loads', url: r3.url, onStudio: r3.url.includes('/app/studio') });
// const bodyLounge = await page.textContent('body').catch(() => '');
const berylText = await page.locator('text=Beryl').first().isVisible().catch(() => false);
results.push({ test: '4. Beryl card present on lounge', visible: berylText });
// capture any context cards
const cardTexts = await page.locator('[class*="card"], [class*="Card"]').allTextContents().catch(() => []);
results.push({ test: '3b. Lounge context cards', cards: cardTexts.map(t => t.trim().slice(0, 60)).filter(Boolean).slice(0, 6) });

// 5. /app/studio/beryl
const r5 = await go('/app/studio/beryl', '5-beryl');
const berylBody = await page.textContent('body').catch(() => '');
const hasScrapCard = /scrap|tag|archive|done/i.test(berylBody);
results.push({ test: '5. /app/studio/beryl', url: r5.url, onBeryl: r5.url.includes('beryl'), hasScrapContent: hasScrapCard });

// 6. Group Studio tabs — find a group from the lounge
await go('/app/studio', null);
const groupAnchorEls = await page.locator('a[href*="/app/studio/"]').all();
const groupHrefs = [];
for (const el of groupAnchorEls) {
  const href = await el.getAttribute('href').catch(() => null);
  if (href && href !== '/app/studio' && !href.includes('beryl')) groupHrefs.push(href);
}
results.push({ test: '6a. Group studio links found', links: [...new Set(groupHrefs)].slice(0, 5) });

const firstGroup = [...new Set(groupHrefs)][0];
if (firstGroup) {
  const r6 = await go(firstGroup, '6-group-studio');
  results.push({ test: `6b. Group studio loads (${firstGroup})`, url: r6.url });

  const tabPulse   = await page.locator('button, [role="tab"]').filter({ hasText: /^Pulse$/i  }).first().isVisible().catch(() => false);
  const tabCanon   = await page.locator('button, [role="tab"]').filter({ hasText: /^Canon$/i  }).first().isVisible().catch(() => false);
  const tabCommand = await page.locator('button, [role="tab"]').filter({ hasText: /^Command$/i}).first().isVisible().catch(() => false);
  results.push({ test: '6c. Tabs: Pulse / Canon / Command', pulse: tabPulse, canon: tabCanon, command: tabCommand });

  // 7. VerbPicker
  if (tabPulse) {
    await page.locator('button, [role="tab"]').filter({ hasText: /^Pulse$/i }).first().click();
    await page.waitForTimeout(600);
    await ss('7-pulse-tab');

    const addBtn = page.locator('button').filter({ hasText: /^\+?\s*(add|new|create)/i }).first();
    const addVisible = await addBtn.isVisible().catch(() => false);
    results.push({ test: '7a. Pulse → + Add button visible', visible: addVisible });

    if (addVisible) {
      await addBtn.click();
      await page.waitForTimeout(800);
      await ss('7-verbpicker');
      const vbBody = await page.textContent('body').catch(() => '');
      const hasVerbs = /draft|summarize|synthesize|retrieve|curate/i.test(vbBody);
      results.push({ test: '7b. VerbPicker verbs visible', pass: hasVerbs, snippet: vbBody.replace(/\s+/g, ' ').slice(0, 500) });
    }
  } else {
    results.push({ test: '7. VerbPicker', skipped: 'Pulse tab not found' });
  }
} else {
  results.push({ test: '6b/7. Group studio', skipped: 'No group links on /app/studio' });
}

// 8. Member Hub — use logged-in username
// Extract username from profile link or nav
const profileLinks = await page.locator('a[href*="/member/"]').all();
let memberPath = '/member';
for (const el of profileLinks) {
  const h = await el.getAttribute('href').catch(() => null);
  if (h && h.includes('/hub')) { memberPath = h; break; }
  if (h && h.startsWith('/member/')) { memberPath = h + '/hub'; break; }
}
const r8 = await go(memberPath, '8-member-hub');
const hub8Body = await page.textContent('body').catch(() => '');
const worktableInNav = await page.locator('button, a, [role="menuitem"]').filter({ hasText: /worktable/i }).first().isVisible().catch(() => false);
const worktableInBody = /worktable/i.test(hub8Body);
results.push({ test: '8. Member Hub WorkTable absent', pass: !worktableInNav && !worktableInBody, path: memberPath, url: r8.url });
// Check that Overview is available
const overviewItem = await page.locator('button, a, [role="menuitem"]').filter({ hasText: /overview/i }).first().isVisible().catch(() => false);
results.push({ test: '8b. Member Hub Overview section present', pass: overviewItem });

await browser.close();
console.log(JSON.stringify(results, null, 2));
