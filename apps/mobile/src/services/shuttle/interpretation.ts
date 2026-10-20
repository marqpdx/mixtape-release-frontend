import type { Seed } from '@mixtape/api/clients/writing/seedApi';

// A processing/failed voice Seed's body may be a placeholder, not a transcript.
export function getWeaveText(seed: Seed | null): string | null {
  if (!seed || seed.status !== 'ready') return null;
  const text = seed.kind === 'voice' ? seed.transcript_text : seed.body_text;
  return text?.trim() ? text : null;
}

// This is a person-controlled handoff to the working conversation, not a
// packet parser or an automatic submission to an AI/Commons endpoint.
export function buildInterpretationRequest(text: string): string {
  return [
    'Help me interpret this Shuttle weave before we shape its publication packet.',
    'Report the things, named Places and locales, proposed Ideas, connections and their reasons,',
    'and stories actually present in my telling. Distinguish what I experienced, what I heard,',
    'what I remembered, and what you infer. Keep uncertainties and unclear names visible.',
    'For each proposed connection, quote the words supporting my intent to connect the things.',
    'Distinguish my expressed intent from your interpretation of it; topical similarity alone',
    'does not establish that I intended an adjacency. Return a short proposed reading I can correct.',
    'One coherent statement may support the whole cluster; do not make me restate every pair.',
    'Do not invent addresses, existing matches, stories, or a map placement.',
    'Preserve my original transcript and quote story passages verbatim; do not smooth them.',
    'Ask only the small questions that materially change the interpretation.',
    'We are tuning capture and understanding; do not publish anything.',
    '',
    'Verbatim weave:',
    text,
  ].join('\n');
}
