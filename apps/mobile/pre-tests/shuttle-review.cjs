// Run from apps/mobile: node pre-tests/shuttle-review.cjs
// Local contract checks only; no server, device, credentials or network needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const mobile = path.resolve(__dirname, '..');
const filename = path.join(mobile, 'src/services/shuttle/review.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, {
  exports: exportsObject,
  require: (specifier) => {
    assert.ok(specifier.startsWith('@mixtape/api/clients/shuttle/fixtures/'));
    return require(path.resolve(mobile, '../../packages/api/src', specifier.replace('@mixtape/api/', '')));
  },
}, { filename });
// Normalize objects from the isolated VM before strict comparison.
const plain = (value) => JSON.parse(JSON.stringify(value));
const { samplePacket, sampleConfirm, createReview, reviewFromSample, buildConfirmation, unansweredMerges } = exportsObject;

assert.deepEqual(plain(buildConfirmation(samplePacket, reviewFromSample())), sampleConfirm,
  'Supplied sample choices must reproduce the shared confirmation exactly');

const review = createReview(samplePacket);
assert.equal(review.tickedIds.length, 11, 'All items, Ideas and adjacencies start checked');
assert.deepEqual(plain(review.stories), {}, 'Stories start empty, never agent-authored');
assert.deepEqual(plain(unansweredMerges(samplePacket, review)), ['Pub Choir']);
review.mergeDecisions['thing-pub-choir'] = 'merge';
assert.deepEqual(plain(unansweredMerges(samplePacket, review)), []);

const verbatim = '  I found Pub Choir.\nThen I remembered C!C!C! — and Portland.  ';
review.stories['place-brisbane'] = verbatim;
review.musicLinks['place-brisbane'] = 'https://open.spotify.com/track/example';
review.stories['place-toronto'] = ' \n ';
review.stories['place-portland'] = 'Do not send an unticked story';
review.tickedIds = review.tickedIds.filter((id) => id !== 'place-portland');
review.tickedIds.push('not-in-packet');
review.ideaWordings['idea-gathering'] = 'Finding one another';
const confirmation = plain(buildConfirmation(samplePacket, review));
assert.deepEqual(confirmation.stories, [{ item_id: 'place-brisbane', text: verbatim, music_link: review.musicLinks['place-brisbane'] }]);
assert.ok(!confirmation.ticked_item_ids.includes('not-in-packet'));
assert.deepEqual(confirmation.idea_rewordings, [{ idea_id: 'idea-gathering', wording: 'Finding one another' }]);
assert.equal(confirmation.merge_answers[0].decision, 'merge');
assert.equal(confirmation.stories_not_yet_told_answer, false);

review.tickedIds = review.tickedIds.filter((id) => id !== 'thing-pub-choir');
assert.deepEqual(plain(buildConfirmation(samplePacket, review).merge_answers), []);
const withoutOffers = { ...samplePacket, stories_not_yet_told: undefined };
assert.ok(!('stories_not_yet_told_answer' in buildConfirmation(withoutOffers, review)));
assert.equal(samplePacket.items.length, 6, 'Review must not mutate the shared packet');
console.log('Shuttle review checks passed: sample parity, verbatim stories, selections, merge answers, Idea edits and optional offers.');

const interpretationFile = path.join(mobile, 'src/services/shuttle/interpretation.ts');
const interpretation = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(interpretationFile, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: interpretation }, { filename: interpretationFile });
const { getWeaveText, buildInterpretationRequest } = interpretation;
const voice = { kind: 'voice', status: 'ready', transcript_text: verbatim, body_text: 'Voice placeholder' };
assert.equal(getWeaveText(voice), verbatim, 'Keep transcript whitespace and line breaks exactly');
assert.equal(getWeaveText({ ...voice, status: 'processing' }), null);
assert.equal(getWeaveText({ ...voice, status: 'failed' }), null);
assert.equal(getWeaveText({ ...voice, transcript_text: null }), null, 'Never pass a voice placeholder as the telling');
assert.equal(getWeaveText({ ...voice, transcript_text: '  \n ' }), null);
assert.equal(getWeaveText({ kind: 'text', status: 'ready', body_text: verbatim }), verbatim);
assert.equal(getWeaveText(null), null);
const request = buildInterpretationRequest(verbatim);
assert.equal(request.slice(request.indexOf('Verbatim weave:\n') + 'Verbatim weave:\n'.length), verbatim,
  'The interpretation handoff must preserve the complete telling');
console.log('Shuttle interpretation checks passed: verbatim handoff and ready/processing/failed/missing transcript states.');
