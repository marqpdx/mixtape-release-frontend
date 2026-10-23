import type {
  ShuttleConfirmIn,
  ShuttleMergeDecision,
  ShuttlePacketOut,
  ShuttleResultOut,
  ShuttleWeaveIn,
} from '@mixtape/api/clients/shuttle/contract';
import packet from '@mixtape/api/clients/shuttle/fixtures/three_choirs_packet_out.json';
import weave from '@mixtape/api/clients/shuttle/fixtures/three_choirs_weave_in.json';
import confirm from '@mixtape/api/clients/shuttle/fixtures/three_choirs_confirm_in.json';
import result from '@mixtape/api/clients/shuttle/fixtures/three_choirs_result_out.json';

export const samplePacket: ShuttlePacketOut = packet;
export const sampleWeave: ShuttleWeaveIn = weave;
export const sampleConfirm: ShuttleConfirmIn = confirm;
// Reference only: never treat this fixed result as a response to an edited review.
export const sampleResult: ShuttleResultOut = result;

export interface ShuttleReview {
  tickedIds: string[];
  stories: Record<string, string>;
  musicLinks: Record<string, string>;
  mergeDecisions: Record<string, ShuttleMergeDecision>;
  ideaWordings: Record<string, string>;
  keepOffers: boolean;
}

export function createReview(packet: ShuttlePacketOut): ShuttleReview {
  return {
    tickedIds: [
      ...packet.items.map((item) => item.item_id),
      ...packet.ideas.map((idea) => idea.idea_id),
      ...packet.adjacencies.map((adjacency) => adjacency.adjacency_id),
    ],
    stories: Object.fromEntries(packet.story_prompts.flatMap((prompt) =>
      prompt.known_story ? [[prompt.item_id, prompt.known_story.text]] : [])),
    musicLinks: Object.fromEntries(packet.story_prompts.flatMap((prompt) =>
      prompt.known_story?.music_link ? [[prompt.item_id, prompt.known_story.music_link]] : [])),
    mergeDecisions: {},
    ideaWordings: Object.fromEntries(packet.ideas.map((idea) => [idea.idea_id, idea.wording])),
    keepOffers: false,
  };
}

export function reviewFromSample(): ShuttleReview {
  return {
    ...createReview(samplePacket),
    tickedIds: [...sampleConfirm.ticked_item_ids],
    stories: Object.fromEntries(sampleConfirm.stories.map((story) => [story.item_id, story.text])),
    musicLinks: Object.fromEntries(sampleConfirm.stories.map((story) => [story.item_id, story.music_link ?? ''])),
    mergeDecisions: Object.fromEntries((sampleConfirm.merge_answers ?? []).map((answer) => [
      answer.item_id, answer.decision as ShuttleMergeDecision,
    ])),
    keepOffers: sampleConfirm.stories_not_yet_told_answer ?? false,
  };
}

export function unansweredMerges(packet: ShuttlePacketOut, review: ShuttleReview): string[] {
  return packet.items.filter((item) =>
    review.tickedIds.includes(item.item_id) && item.match_state === 'near_duplicate' &&
    !review.mergeDecisions[item.item_id],
  ).map((item) => item.name);
}

export function buildConfirmation(packet: ShuttlePacketOut, review: ShuttleReview): ShuttleConfirmIn {
  const allowedIds = new Set([
    ...packet.items.map((item) => item.item_id),
    ...packet.ideas.map((idea) => idea.idea_id),
    ...packet.adjacencies.map((adjacency) => adjacency.adjacency_id),
  ]);
  const ticked = new Set(review.tickedIds.filter((id) => allowedIds.has(id)));
  return {
    version: packet.version,
    action_run_id: packet.action_run_id,
    ticked_item_ids: [...ticked],
    stories: packet.story_prompts.flatMap(({ item_id }) => {
      const text = review.stories[item_id] ?? '';
      if (!ticked.has(item_id) || !text.trim()) return [];
      const musicLink = review.musicLinks[item_id] ?? '';
      return [{ item_id, text, ...(musicLink.trim() ? { music_link: musicLink } : {}) }];
    }),
    merge_answers: packet.items.flatMap((item) => {
      const decision = review.mergeDecisions[item.item_id];
      if (!ticked.has(item.item_id) || item.match_state !== 'near_duplicate' || !item.candidate || !decision) return [];
      return [{ item_id: item.item_id, candidate_id: item.candidate.id, decision }];
    }),
    ...(packet.stories_not_yet_told ? { stories_not_yet_told_answer: review.keepOffers } : {}),
    idea_rewordings: packet.ideas.flatMap((idea) => {
      const wording = review.ideaWordings[idea.idea_id] ?? idea.wording;
      return ticked.has(idea.idea_id) && wording !== idea.wording
        ? [{ idea_id: idea.idea_id, wording }] : [];
    }),
  };
}

/** Validate the explicit publication scope before sending a non-replayable confirm. */
export function reviewProblems(packet: ShuttlePacketOut, review: ShuttleReview): string[] {
  const errors: string[] = [];
  const selected = new Set(review.tickedIds);
  if (!selected.size) errors.push('Choose what belongs in this weave, or Keep in Notebook.');
  const merges = unansweredMerges(packet, review);
  if (merges.length) errors.push(`Choose merge or keep separate for ${merges.join(', ')}.`);
  for (const item of packet.items) {
    if (selected.has(item.item_id) && item.kind === 'place' && !review.stories[item.item_id]?.trim())
      errors.push(`Tell the first story for ${item.name}, or explicitly leave it out of this weave.`);
  }
  for (const edge of packet.adjacencies) {
    if (selected.has(edge.adjacency_id) && edge.ends.some((id) => !selected.has(id)))
      errors.push('A checked connection needs both of its things included.');
  }
  for (const idea of packet.ideas) {
    if (selected.has(idea.idea_id) && !review.ideaWordings[idea.idea_id]?.trim())
      errors.push('Give each included Idea a wording.');
  }
  return errors;
}
