// Offline contrast checks for the actual approved token source, in every mode.
// Run from frontend root: node pre-tests/semantic-theme-tokens.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
function load(file) {
  const result = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function('exports', code)(result.exports);
  return result.exports;
}
const { themes } = load('packages/ui-tokens/src/themes.ts');
const { tenantPalettes } = load('apps/crossroads/src/app/(main)/(group-landing)/groups/[slug]/tenantPalettes.ts');
const { getSemanticThemeVars, semanticThemeDeclarations, semanticColorTokens, semanticShadowTokens } = load('packages/ui-tokens/src/semantic-tokens.ts');
function rgb(value) {
  if (Array.isArray(value)) return value;
  if (value.startsWith('#')) return [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16));
  const match = value.match(/^color-mix\(in srgb, (#[\da-f]+) ([\d.]+)%, (#[\da-f]+) ([\d.]+)%\)$/i);
  assert.ok(match, value);
  const a = rgb(match[1]), b = rgb(match[3]), percent = Number(match[2]) / 100;
  return a.map((channel, i) => channel * percent + b[i] * (1 - percent));
}
function luminance(value) {
  return rgb(value).map(channel => {
    channel /= 255;
    return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
  }).reduce((sum, channel, i) => sum + channel * [.2126, .7152, .0722][i], 0);
}
function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
const minimum = {};
let cases = 0;
for (const theme of [...themes, ...tenantPalettes]) {
  for (const mode of ['light', 'dark']) for (const high of [false, true]) {
    const key = high ? `${mode}HighContrast` : mode;
    const c = theme[key];
    assert.ok(c, `${theme.id}/${key}`);
    const v = getSemanticThemeVars(c, mode, high ? 'high' : 'normal');
    const label = `${theme.id}/${key}`;
    const textBar = high ? 7 : 4.5, uiBar = high ? 4.5 : 3;
    const check = (role, a, b, bar) => {
      const ratio = contrast(a, b);
      assert.ok(ratio >= bar, `${label} ${role}: ${ratio} < ${bar}`);
      minimum[role] = Math.min(minimum[role] ?? Infinity, ratio);
    };
    // Mixes have been resolved to RGB arrays for the subtle surface comparison.
    const subtle = rgb(v['--ui-surface-subtle']);
    for (const surface of [c.bg, c.surface, subtle]) {
      check('muted', v['--theme-text-muted'], surface, textBar);
      check('placeholder', v['--theme-text-placeholder'], surface, textBar);
      check('control border', v['--ui-border-control'], surface, uiBar);
    }
    const statusForegrounds = [];
    for (const tone of ['danger', 'success', 'warning', 'info']) {
      const fg = v[`--status-${tone}-fg`], bg = v[`--status-${tone}-bg`];
      statusForegrounds.push(fg);
      check(`status ${tone}`, fg, bg, textBar);
      for (const surface of [c.bg, c.surface]) check(`status ${tone} exterior`, fg, surface, textBar);
      if (high) assert.equal(bg, mode === 'light' ? '#FFFFFF' : '#000000');
    }
    assert.equal(new Set(statusForegrounds).size, 4, 'status hues retained');
    if (high) {
      assert.equal(v['--theme-text-muted'], c.text);
      assert.equal(v['--ui-border-subtle'], v['--ui-border-control']);
      assert.equal(v['--ui-shadow-raised'], 'none');
    }
    assert.ok(!('--ui-text-muted-safe' in v));
    assert.ok(semanticThemeDeclarations(c, mode, high ? 'high' : 'normal').includes(`--theme-text-muted: ${v['--theme-text-muted']};`));
    cases++;
  }
}
assert.equal(Object.keys(semanticColorTokens).length, 13);
assert.equal(semanticShadowTokens['ui.shadowRaised'].value, 'var(--ui-shadow-raised)');
for (const app of ['mixtape', 'crossroads']) {
  const source = fs.readFileSync(`apps/${app}/src/theme/theme.ts`, 'utf8');
  assert.ok(source.includes('...semanticColorTokens'));
  assert.ok(source.includes('shadows: semanticShadowTokens'));
}
console.log(`PASS: ${cases} theme/mode variants, normal text 4.5/UI 3 and HC text 7/UI 4.5, including tenant palettes`);
console.log('Minimum contrast:', Object.fromEntries(Object.entries(minimum).map(([key, value]) => [key, Number(value.toFixed(3))])));
