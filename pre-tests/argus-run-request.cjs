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
const { argusClient } = load('packages/api/src/clients/argus/index.ts');
const now = Date.parse('2026-11-09T12:00:00Z');
const draft = { ...initialRunDraft, blockIds: ['help-fidelity-01'], tokens: '10000', turns: '5', wallSeconds: '120' };
let checks = 0;
function check(name, run) { run(); checks++; console.log(`PASS ${name}`); }
function rejects(change, message) { assert.throws(() => buildRunRequest({ ...draft, ...change }, now), message); }

check('single-run consent sends no series settings', () => assert.deepEqual(buildRunRequest(draft, now), {
  block_ids: ['help-fidelity-01'], mode: 'single', caps: { tokens: 10000, turns: 5, wall_seconds: 120 },
}));
check('a single run cannot silently cover several blocks', () => rejects({ blockIds: ['a', 'b'] }, /one block/));
check('a run needs a block', () => rejects({ blockIds: [] }, /at least one/));
for (const field of ['tokens', 'turns', 'wallSeconds', 'cadenceMinutes']) {
  for (const invalid of ['', '0', '-1', '1.5', 'Infinity', '1e4', '9007199254740992']) {
    check(`${field} rejects ${JSON.stringify(invalid)}`, () => rejects({ mode: 'bounded', [field]: invalid }, /positive whole number/));
  }
}
check('bounded days become an explicit end time', () => assert.equal(buildRunRequest({ ...draft, mode: 'bounded', days: '3' }, now).ends_at, '2026-11-12T12:00:00.000Z'));
check('seven-day duration allowed', () => assert.equal(buildRunRequest({ ...draft, mode: 'bounded', days: '7' }, now).ends_at, '2026-11-16T12:00:00.000Z'));
check('more than seven days rejected', () => rejects({ mode: 'bounded', days: '8' }, /one and seven/));
check('count sends no stale end time', () => assert.deepEqual(buildRunRequest({ ...draft, mode: 'bounded', bound: 'count', count: '3', end: '2027-01-01' }, now), {
  block_ids: ['help-fidelity-01'], mode: 'bounded', cadence_minutes: 120, run_count: 3,
  caps: { tokens: 10000, turns: 5, wall_seconds: 120 },
}));
check('count cannot schedule a run at or after seven days', () => rejects({ mode: 'bounded', bound: 'count', count: '85', cadenceMinutes: '120' }, /seven days/));
check('invalid count rejected', () => rejects({ mode: 'bounded', bound: 'count', count: '0' }, /Run count/));
for (const end of ['', 'garbage', '2026-11-09T11:59:00Z']) {
  check(`invalid/past end rejected: ${end}`, () => rejects({ mode: 'bounded', bound: 'end', end }, /future/));
}
check('end beyond seven days rejected', () => rejects({ mode: 'bounded', bound: 'end', end: '2026-11-17T12:00:00Z' }, /seven days/));
check('end at seven days accepted', () => assert.equal(buildRunRequest({ ...draft, mode: 'bounded', bound: 'end', end: '2026-11-16T12:00:00Z' }, now).ends_at, '2026-11-16T12:00:00.000Z'));
check('open-ended consent has no inherited duration or count', () => assert.deepEqual(buildRunRequest({ ...draft, mode: 'open_ended', count: '8', end: '2027-01-01' }, now), {
  block_ids: ['help-fidelity-01'], mode: 'open_ended', cadence_minutes: 120,
  caps: { tokens: 10000, turns: 5, wall_seconds: 120 },
}));
check('series blocks are deduplicated', () => assert.deepEqual(buildRunRequest({ ...draft, mode: 'bounded', blockIds: ['a', 'a', 'b'] }, now).block_ids, ['a', 'b']));
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

(async () => {
  const snapshot = await argusClient.snapshot();
  assert.equal(snapshot.available, false);
  assert.equal(snapshot.manual_ready, false);
  assert.equal(snapshot.scheduling_ready, false);
  assert.equal(snapshot.daily_tokens, null);
  await assert.rejects(argusClient.start(buildRunRequest(draft, now)), /cannot start/);
  await assert.rejects(argusClient.stop('series'), /cannot start/);
  await assert.rejects(argusClient.approveNext('series'), /cannot start/);
  console.log(`PASS ${checks} request/link checks; unavailable adapter rejects every mutation`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
