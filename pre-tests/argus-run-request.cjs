// Run from the frontend root: node pre-tests/argus-run-request.cjs
// No API, login, database or network required. Compile the real pure TS helpers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relative, imports = {}) {
  const filename = path.resolve(relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const result = { exports: {} };
  new Function('module', 'exports', 'require', compiled)(result, result.exports, (name) => imports[name] ?? require(name));
  return result.exports;
}

const { buildRunRequest, initialRunDraft, localArgusUrl } = load('apps/mixtape/src/components/argus/runRequest.ts');
const draft = { ...initialRunDraft, blockIds: ['help-fidelity-01'], mode: 'bounded', tokens: '10000', turns: '5', wallSeconds: '120' };
let checks = 0;
function check(name, run) { run(); checks++; console.log(`PASS ${name}`); }
function rejects(change, message) { assert.throws(() => buildRunRequest({ ...draft, ...change }), message); }

check('single run uses the documented block path without invented cap fields', () => assert.deepEqual(buildRunRequest({ ...initialRunDraft, blockIds: ['help-fidelity-01'] }), {mode: 'single', block_slug: 'help-fidelity-01'}));
check('a single run cannot cover several blocks', () => rejects({ mode: 'single', blockIds: ['a', 'b'] }, /one block/));
check('multi-block series cannot silently fan out consent', () => rejects({ blockIds: ['a', 'b'] }, /Multi-block/));
check('a run needs a block', () => rejects({ blockIds: [] }, /one block/));
for (const field of ['tokens', 'turns', 'wallSeconds', 'cadenceMinutes']) {
  for (const invalid of ['', '0', '-1', '1.5', 'Infinity', '1e4', '9007199254740992']) {
    check(`${field} rejects ${JSON.stringify(invalid)}`, () => rejects({ [field]: invalid }, /positive whole number/));
  }
}
check('bounded days retain the exact reviewed wire shape', () => assert.deepEqual(buildRunRequest(draft), {
  mode: 'bounded', request: {block_slug: 'help-fidelity-01', cadence_hours: 2, span: {kind: 'days', value: 3},
    per_turn_caps: {max_tokens: 10000, max_turns: 5, max_wall_clock_seconds: 120}},
}));
check('seven days allowed', () => assert.equal(buildRunRequest({ ...draft, days: '7' }).request.span.value, 7));
check('more than seven days rejected', () => rejects({ days: '8' }, /one and seven/));
check('count sends only count span', () => assert.deepEqual(buildRunRequest({ ...draft, bound: 'count', count: '3', end: '2027-01-01' }).request.span, {kind: 'runs', value: 3}));
check('count allows exactly 168 cadence hours', () => assert.equal(buildRunRequest({ ...draft, bound: 'count', count: '84' }).request.span.value, 84));
check('count rejects more than 168 cadence hours', () => rejects({ bound: 'count', count: '85' }, /seven days/));
check('count includes every cadence interval as core does', () => rejects({ bound: 'count', count: '2', cadenceMinutes: '10020' }, /seven days/));
check('invalid count rejected', () => rejects({ bound: 'count', count: '0' }, /Run count/));
check('minute cadences are never rounded', () => rejects({ cadenceMinutes: '90' }, /whole number of hours/));
check('an exact end time is never silently converted', () => rejects({ bound: 'end', end: '2026-11-10T12:00:00Z' }, /not available/));
check('open-ended series never become bounded consent', () => rejects({ mode: 'open_ended' }, /not available/));
for (const url of ['https://example.com', '//example.com', 'javascript:alert(1)', '/\\example.com', '/ /example.com', undefined]) {
  check(`unsafe result link rejected: ${url}`, () => assert.equal(localArgusUrl(url), undefined));
}
check('same-origin result links retained', () => assert.equal(localArgusUrl('/argus?run=123'), '/argus?run=123'));

// Exercise the actual route gate with an inert layout; no work-area mount is
// allowed before authentication resolves or for an ordinary member/staff user.
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let auth;
const Page = load('apps/mixtape/src/app/(authenticated)/argus/page.tsx', {
  '@/lib/auth/AuthContext': { useAuth: () => auth },
  '@chakra-ui/react': { Text: ({ children }) => React.createElement('p', null, children) },
  '@components/common/DashboardLayout': { default: () => React.createElement('div', null, 'ARGUS_WORK_AREA_MOUNTED') },
  '@components/argus/ArgusWorkArea': { default: () => null },
}).default;
for (const [name, state, expected] of [
  ['loading', {user: {is_superuser: true}, isLoading: true}, 'Loading Argus'],
  ['anonymous', {user: null, isLoading: false}, 'Authentication required.'],
  ['ordinary member', {user: {is_superuser: false}, isLoading: false}, 'Superuser access required.'],
  ['staff without superuser', {user: {is_staff: true, is_superuser: false}, isLoading: false}, 'Superuser access required.'],
  ['superuser', {user: {is_superuser: true}, isLoading: false}, 'ARGUS_WORK_AREA_MOUNTED'],
]) {
  check(`route gate: ${name}`, () => {
    auth = state;
    const html = renderToStaticMarkup(React.createElement(Page));
    assert.ok(html.includes(expected));
    assert.equal(html.includes('ARGUS_WORK_AREA_MOUNTED'), name === 'superuser');
  });
}

console.log(`PASS ${checks} request/link/gate checks`);
