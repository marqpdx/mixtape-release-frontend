// Real React components in isolated Chromium; no app server, account or network.
// Run from frontend root: node pre-tests/accessibility-second-pass.cjs
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { chromium, expect } = require('@playwright/test');
const webpackModule = require('next/dist/compiled/webpack/webpack');
webpackModule.init();

(async () => {
  const root = process.cwd();
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'abe-a11y-components-'));
  const files = [
    'components/profile200/VoicePlayer200',
    'editor/inline/EditableText',
    'editor/panels/ContentPanel',
  ];
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, 'apps/mixtape/src/features/profile-revamp', `${file}.tsx`), 'utf8');
    const output = path.join(temp, `${file}.js`);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    }).outputText);
  }
  fs.writeFileSync(path.join(temp, 'icons.js'), 'exports.IconPlayerPlayFilled = exports.IconPlayerPauseFilled = () => null;');
  fs.writeFileSync(path.join(temp, 'entry.js'), `
    const React = require('react');
    const { createRoot } = require('react-dom/client');
    const { VoicePlayer200 } = require('./components/profile200/VoicePlayer200');
    const ContentPanel = require('./editor/panels/ContentPanel').default;
    window.patches = [];
    const profile = { displayName: 'Alex', status: 'Writing', bio: 'My biography' };
    createRoot(document.getElementById('root')).render(React.createElement(React.Fragment, null,
      React.createElement(VoicePlayer200, { src: '', displayName: 'Alex', transcript: 'Full voice introduction.' }),
      React.createElement(ContentPanel, { profile, onPatch: p => window.patches.push(p) }),
      React.createElement(ContentPanel, { profile, onPatch: p => window.patches.push(p) })
    ));
  `);
  await new Promise((resolve, reject) => webpackModule.webpack({
    mode: 'production', entry: path.join(temp, 'entry.js'), cache: false,
    output: { path: temp, filename: 'bundle.js' },
    resolve: { modules: [path.join(root, 'node_modules')], alias: { '@tabler/icons-react': path.join(temp, 'icons.js') } },
    optimization: { minimize: false },
  }, (error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => route.abort());
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: fs.readFileSync(path.join(temp, 'bundle.js'), 'utf8') });
    const slider = page.getByRole('slider', { name: 'Seek' });
    await expect(slider).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(slider).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuenow', '0');
    await page.locator('audio').evaluate(audio => {
      Object.defineProperty(audio, 'duration', { configurable: true, value: 100 });
      audio.dispatchEvent(new Event('loadedmetadata'));
    });
    await expect(slider).toHaveAttribute('aria-valuemax', '100');
    const cases = [['ArrowRight', 5], ['ArrowUp', 10], ['ArrowLeft', 5], ['ArrowDown', 0], ['ArrowLeft', 0], ['End', 100], ['ArrowRight', 100], ['Home', 0]];
    for (const [key, value] of cases) {
      await page.keyboard.press(key);
      await expect(slider).toHaveAttribute('aria-valuenow', String(value));
      assert.equal(await page.locator('audio').evaluate(audio => audio.currentTime), value, key);
    }
    await page.keyboard.press('End');
    await expect(slider).toHaveAttribute('aria-valuetext', '1:40 of 1:40');
    await page.locator('audio').evaluate(audio => { audio.currentTime = 42; audio.dispatchEvent(new Event('timeupdate')); });
    await expect(slider).toHaveAttribute('aria-valuenow', '42');
    await expect(slider).toHaveAttribute('aria-valuetext', '0:42 of 1:40');
    await page.keyboard.press('Escape');
    await expect(slider).toHaveAttribute('aria-valuenow', '42');
    await slider.evaluate(el => {
      const rect = el.getBoundingClientRect();
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.right + 50 }));
    });
    await expect(slider).toHaveAttribute('aria-valuenow', '100');
    const transcriptId = await page.locator('audio').getAttribute('aria-details');
    assert.ok(transcriptId);
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveAttribute('aria-details', transcriptId);
    assert.equal(await page.locator('details').getAttribute('id'), transcriptId);
    await page.getByText('Read voice introduction transcript').click();
    await expect(page.getByText('Full voice introduction.')).toBeVisible();

    for (const name of ['Display name', 'Status', 'Bio']) {
      const fields = page.getByRole('textbox', { name, exact: true });
      await expect(fields).toHaveCount(2);
      const ids = await fields.evaluateAll(elements => elements.map(el => el.getAttribute('aria-labelledby')));
      assert.equal(new Set(ids).size, 2, 'unique labels in multiple panels');
    }
    const nameField = page.getByRole('textbox', { name: 'Display name', exact: true }).first();
    await nameField.fill('Alex revised');
    await nameField.press('Enter');
    assert.deepEqual(await page.evaluate(() => window.patches.at(-1)), { displayName: 'Alex revised' });
    await expect(page.getByRole('textbox', { name: 'Bio', exact: true }).first()).toHaveAttribute('aria-multiline', 'true');
    console.log('PASS: real component keyboard focus/seek/bounds/time updates, transcript association and expansion, unique label names and edit commits');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
