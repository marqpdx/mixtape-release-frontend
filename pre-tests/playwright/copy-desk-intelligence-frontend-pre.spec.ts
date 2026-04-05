import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function read(relPath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');
}

test.describe('Pre-test: Copy Desk Intelligence frontend', () => {
  test('statistics panel exposes goal input and suggest-splits toggle', async () => {
    const source = read('apps/mixtape/src/components/writing/copydesk/agents/StatisticsAgent.tsx');

    expect(source).toContain('Word Count Goal');
    expect(source).toContain('Suggest splitting docs');
    expect(source).toContain('type="number"');
    expect(source).toContain('disabled={targetWordCount == null}');
  });

  test('split suggestion callout exposes the expected actions and AI insertion flow', async () => {
    const source = read('apps/mixtape/src/components/writing/copydesk/SplitSuggestionCallout.tsx');

    expect(source).toContain('This piece may work well as 2 separate parts. Want to see where?');
    expect(source).toContain('Tell me more');
    expect(source).toContain('Not now');
    expect(source).toContain('Keep as one piece');
    expect(source).toContain('Insert split markers');
    expect(source).toContain("action: 'view' | 'dismiss' | 'decline'");
  });

  test('execute split banner calls the split endpoint and exposes ready-state copy', async () => {
    const source = read('apps/mixtape/src/components/writing/copydesk/ExecuteSplitBanner.tsx');

    expect(source).toContain('Ready to split');
    expect(source).toContain('split marker in this piece');
    expect(source).toContain('Execute split');
    expect(source).toContain('/execute-split');
    expect(source).toContain('surface_body_json');
    expect(source).toContain('session_id');
  });

  test('split marker editor affordances are wired in toolbar and extension commands', async () => {
    const toolbar = read('apps/mixtape/src/components/editor/TipTapToolbar.tsx');
    const markerExt = read('apps/mixtape/src/components/editor/extensions/SplitMarker.ts');
    const markerView = read('apps/mixtape/src/components/editor/extensions/SplitMarkerView.tsx');

    expect(toolbar).toContain('insertSplitMarker');
    expect(markerExt).toContain('insertSplitMarker');
    expect(markerExt).toContain('removeSplitMarker');
    expect(markerExt).toContain('insertSplitMarkersFromAI');
    expect(markerView).toContain('Split here');
  });

  test('write composer wires split suggestion and execute split into stream resumption', async () => {
    const source = read('apps/mixtape/src/components/writing/WriteComposer.tsx');

    expect(source).toContain('SplitSuggestionCallout');
    expect(source).toContain('ExecuteSplitBanner');
    expect(source).toContain('insertSplitMarkersFromAI');
    expect(source).toContain('resumeSession(session_id, surface_body_json)');
    expect(source).toContain('!wantsCollab && !streamIsActive');
  });
});
