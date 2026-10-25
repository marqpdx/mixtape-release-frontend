// Offline test of the Folio route resolver; callers supply one authorized scope.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const api = {};
const source = path.resolve(__dirname, '../../../packages/api/src/clients/folio/folioApi.ts');
vm.runInNewContext(ts.transpileModule(fs.readFileSync(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: api, require: () => ({ axiosInstance: {} }) });
const first = { id: 'uuid-a', slug: 'quiet-city', slug_history: ['untitled---old'] };
const second = { id: 'uuid-b', slug: 'quiet-city-2', slug_history: [] };
const otherScope = { id: 'uuid-c', slug: 'quiet-city', slug_history: ['untitled---other'] };
const scope = [first, second];
assert.equal(api.resolveFolioRoute(scope, 'uuid-a'), first);
assert.equal(api.resolveFolioRoute(scope, 'quiet-city'), first);
assert.equal(api.resolveFolioRoute(scope, 'untitled---old'), first);
assert.equal(api.resolveFolioRoute(scope, 'untitled---other'), undefined);
assert.equal(api.resolveFolioRoute([otherScope], 'quiet-city'), otherScope);
assert.equal(api.resolveFolioRoute([first, { ...second, slug: 'untitled---old' }], 'untitled---old').id, 'uuid-b');
assert.equal(api.resolveFolioRoute([first, { ...second, slug_history: ['untitled---old'] }], 'untitled---old'), undefined);
assert.equal(api.resolveFolioRoute([{ id: 'legacy' }], 'legacy').id, 'legacy');
console.log('Folio route checks passed: UUID/current/history redirects, sponsor-scope isolation and ambiguous-history refusal.');
