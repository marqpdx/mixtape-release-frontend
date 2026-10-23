// Offline SH-11 tests: actual shared Axios interceptor + publication transport,
// with a fake adapter. No server, credentials, or external network.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');
const mobile = path.resolve(__dirname, '..');
let refreshes = 0;
const load = (file, imports) => {
  const result = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, { exports: result, require: (key) => {
    if (!(key in imports)) throw new Error(`Unexpected import ${key}`);
    return imports[key];
  }, process: { env: {} }, console: { log() {}, warn() {}, error() {} } }, { filename: file });
  return result;
};
const api = path.resolve(mobile, '../../packages/api/src');
const transport = load(path.join(api, 'lib/axiosInstance.ts'), {
  axios,
  '@mixtape/auth/tokenStorage': { getAccessToken: () => null, setAccessToken() {}, clearAccessToken() {} },
  '../clients/auth/api': { refreshAccessToken: async () => { refreshes++; return 'test'; } },
});
const publication = load(path.join(api, 'clients/shuttle/publication.ts'), { '../../lib/axiosInstance': transport });
let requests = [];
transport.axiosInstance.defaults.adapter = async (config) => {
  requests.push(config);
  if (config.url.endsWith('/confirm/')) {
    const response = { status: 401, statusText: 'Unauthorized', data: { detail: 'Expired' }, headers: {}, config };
    throw new axios.AxiosError('Expired', 'ERR_BAD_REQUEST', config, {}, response);
  }
  return { data: { action_run_id: 'weave-1' }, status: 200, statusText: 'OK', headers: {}, config };
};
(async () => {
  await assert.rejects(publication.confirmShuttlePacket({ version: '1.0', action_run_id: 'weave-1', ticked_item_ids: [], stories: [] }));
  assert.equal(requests.length, 1, 'Confirm must never be replayed');
  assert.equal(refreshes, 0, '401 interceptor must not replay this confirmation');
  await publication.buildShuttlePacket('weave-1');
  await publication.keepShuttleInNotebook('weave-1');
  assert.equal(requests[1].url, '/api/shuttle/weaves/weave-1/build-packet/');
  assert.equal(requests[2].url, '/api/shuttle/weaves/weave-1/keep-in-notebook/');

  const storage = new Map();
  const session = load(path.join(mobile, 'src/services/shuttle/session.ts'), {
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => storage.get(key) ?? null,
      setItem: async (key, value) => storage.set(key, value),
      removeItem: async (key) => storage.delete(key),
    },
  });
  const marked = { seedId: 'seed-1', requestId: 'request-1', weaveId: 'weave-1', publishAttempted: true };
  await session.saveShuttleSession('writer-a', marked);
  assert.deepEqual(JSON.parse(JSON.stringify(await session.readShuttleSession('writer-a'))), marked);
  assert.equal(await session.readShuttleSession('writer-b'), null, 'Sessions must be account-scoped');
  await session.clearShuttleSession('writer-a');
  assert.equal(await session.readShuttleSession('writer-a'), null);
  console.log('Publication checks passed: no confirm replay on 401, same weave routes, persistent attempt marker, account isolation and explicit clearing.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
