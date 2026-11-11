// Run from the frontend root: node pre-tests/argus-api-client.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { AxiosError } = require('axios');

function load(relative, imports = {}) {
  const filename = path.resolve(relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const result = { exports: {} };
  new Function('module', 'exports', 'require', compiled)(result, result.exports, (name) => imports[name] ?? require(name));
  return result.exports;
}

// Exercise the real HTTP client against an inert axios transport; no network.
const calls = [];
let response;
const { argusApi } = load('packages/api/src/clients/argus/argusApi.ts', {
  '../../lib/axiosInstance': { axiosInstance: {
    get: async (...args) => { calls.push(['GET', ...args]); return {data: response}; },
    post: async (...args) => { calls.push(['POST', ...args]); return {data: response}; },
  } },
});
const { argusErrorMessage } = load('packages/api/src/clients/argus/errors.ts');
const invalid = new AxiosError('Request failed with status code 400', 'ERR_BAD_REQUEST', undefined, undefined, {
  status: 400, data: {per_turn_caps: {max_tokens: ['Ensure this value is greater than or equal to 0.'], max_turns: ['This field is required.']}, span: ['Series exceeds seven days.']},
});
assert.equal(argusErrorMessage(invalid), 'per_turn_caps.max_tokens: Ensure this value is greater than or equal to 0.; per_turn_caps.max_turns: This field is required.; span: Series exceeds seven days.');
assert.equal(argusErrorMessage(new Error('Network Error')), 'Network Error');
assert.match(argusErrorMessage(null), /Request failed/);
(async () => {
  const signal = new AbortController().signal;
  response = {available: true, blocks: []};
  assert.deepEqual(await argusApi.listBlocks(signal), response);
  assert.equal(calls.at(-1)[1], '/api/argus/blocks/');
  assert.equal(calls.at(-1)[2].signal, signal);
  response = {available: false, reason: "Registry is not configured", blocks: []};
  assert.deepEqual(await argusApi.listBlocks(), response);
  response = {slug: 'help-fidelity-01', runs: []};
  await argusApi.getBlock('help-fidelity-01', signal);
  assert.equal(calls.at(-1)[1], '/api/argus/blocks/help-fidelity-01/');
  response = {status: 'not_reachable', detail: 'Cass not reachable'};
  assert.deepEqual(await argusApi.startRun('help-fidelity-01'), response);
  assert.equal(calls.at(-1)[1], '/api/argus/blocks/help-fidelity-01/run/');
  assert.equal(calls.at(-1)[2], undefined);
  response = {status: 'started', run_id: 'r1'};
  assert.equal((await argusApi.startRun('help-fidelity-01')).run_id, 'r1');
  response = {status: 'unknown'};
  await assert.rejects(argusApi.startRun('help-fidelity-01'), /unrecognized/);
  response = {status: 'started'};
  await assert.rejects(argusApi.startRun('help-fidelity-01'), /unrecognized/);
  const payload = {block_slug: 'help-fidelity-01', cadence_hours: 2, span: {kind: 'days', value: 3}, per_turn_caps: {max_tokens: 10000, max_turns: 5, max_wall_clock_seconds: 120}};
  response = {...payload, series_id: 's1', status: 'active', runs_done: 0, runs_total: null, started_by: 'Builder', day_of_span: 1};
  await argusApi.createSeries(payload);
  assert.equal(calls.at(-1)[1], '/api/argus/series/');
  assert.deepEqual(calls.at(-1)[2], payload);
  await argusApi.getSeries('s1', signal);
  assert.equal(calls.at(-1)[1], '/api/argus/series/s1/');
  response = {series_id: 's1', status: 'stopped'};
  await argusApi.stopSeries('s1');
  assert.equal(calls.at(-1)[1], '/api/argus/series/s1/stop/');
  for (const call of calls.filter(item => item[0] === 'POST')) assert.equal(call[3]._retry, true);
  response = {series_id: 'other', status: 'stopped'};
  await assert.rejects(argusApi.stopSeries('s1'), /not confirmed/);
  response = {series_id: 's1', status: 'active'};
  await assert.rejects(argusApi.stopSeries('s1'), /not confirmed/);
  response = {};
  await assert.rejects(argusApi.createSeries(payload), /unrecognized/);
  await assert.rejects(argusApi.listBlocks(), /block registry/);
  await assert.rejects(argusApi.getBlock('help-fidelity-01'), /run history/);
  response = {...payload, series_id: 'other', status: 'active'};
  await assert.rejects(argusApi.getSeries('s1'), /unrecognized/);
  const before = calls.length;
  await assert.rejects(argusApi.getBlock('..'), /identifier/);
  await assert.rejects(argusApi.getSeries(''), /identifier/);
  assert.equal(calls.length, before);
  response = {slug: 'a/b', runs: []};
  await argusApi.getBlock('a/b');
  assert.equal(calls.at(-1)[1], '/api/argus/blocks/a%2Fb/');
  console.log('PASS all six HTTP operations, cancellation, mutation replay guards and response acknowledgements');
})().catch((error) => { console.error(error); process.exitCode = 1; });
