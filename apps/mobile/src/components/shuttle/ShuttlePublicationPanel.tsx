import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import type { ShuttleInterpretation } from '@mixtape/api/clients/shuttle/findings';
import type { ShuttlePacketOut, ShuttleResultOut } from '@mixtape/api/clients/shuttle/contract';
import { buildShuttlePacket, confirmShuttlePacket, keepShuttleInNotebook } from '@mixtape/api/clients/shuttle/publication';
import { buildConfirmation, createReview, reviewProblems } from '../../services/shuttle/review';
import type { ShuttleReview } from '../../services/shuttle/review';
import type { ShuttleSession } from '../../services/shuttle/session';
import { saveShuttleSession } from '../../services/shuttle/session';
import { ShuttleReviewForm } from './ShuttleReviewForm';

export function ShuttlePublicationPanel({ current, session, username, onSession, onLocked, onFinish, blocked }: {
  blocked: boolean;
  current: ShuttleInterpretation; session: ShuttleSession; username: string;
  onSession: (next: ShuttleSession) => void; onLocked: (value: boolean) => void;
  onFinish: () => Promise<void>;
}) {
  const [packet, setPacket] = useState<ShuttlePacketOut | null>(null);
  const [review, setReview] = useState<ShuttleReview | null>(null);
  const [result, setResult] = useState<ShuttleResultOut | null>(session.result ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(!!session.publishAttempted);
  const active = useRef(false);
  const revision = `${current.revision}:${current.source_digest}`;
  useEffect(() => { setPacket(null); setReview(null); }, [revision]);
  useEffect(() => { onLocked(busy || !!packet || attempted || !!result); }, [busy, packet, attempted, result, onLocked]);
  const perform = async (work: () => Promise<void>) => {
    if (active.current || blocked) return;
    active.current = true; setBusy(true); setError('');
    try { await work(); }
    catch { setError('Could not finish this step. Your capture is kept. Check your connection before continuing.'); }
    finally { active.current = false; setBusy(false); }
  };
  const keep = () => Alert.alert('Keep in Notebook?',
    'End this Shuttle attempt and keep the original capture in Notebook. Nothing new is published by this action.',
    [{ text: 'Continue this weave', style: 'cancel' }, { text: 'Keep in Notebook', onPress: () => void perform(async () => {
      await keepShuttleInNotebook(current.weave_action_run_id);
      await onFinish();
    }) }]);
  const publish = () => {
    if (!packet || !review || attempted || active.current) return;
    const problems = reviewProblems(packet, review);
    if (problems.length) { setError(problems.join('\n')); return; }
    const confirmation = buildConfirmation(packet, review);
    const omitted = packet.items.filter((item) => !review.tickedIds.includes(item.item_id)).map((item) => item.name);
    Alert.alert('Publish this weave to Commons?',
      `The checked entries and their stories will go live together.${omitted.length ? ` Explicitly left out: ${omitted.join(', ')}.` : ''} Cloud consent did not grant publication permission.`,
      [{ text: 'Keep reviewing', style: 'cancel' }, { text: 'Publish', onPress: () => void perform(async () => {
        // Persist before dispatch. A remount/crash must never replay confirm.
        const marked = { ...session, publishAttempted: true };
        await saveShuttleSession(username, marked);
        onSession(marked); setAttempted(true);
        try {
          const written = await confirmShuttlePacket(confirmation);
          setResult(written);
          const completed = { ...marked, result: written };
          onSession(completed);
          await saveShuttleSession(username, completed);
        } catch {
          setError('The publication outcome is unknown. It may have completed. Do not publish again. Result recovery is waiting for the server lookup; keep this session.');
        }
      }) }]);
  };
  if (result) return <View style={{ gap: 12 }}>
    <Text accessibilityRole="header">Published to Commons</Text>
    <Text>{result.written.length} written records confirmed by the server. Map placement is a separate checkpoint.</Text>
    {result.rested_as_seed.length > 0 && <Text>{result.rested_as_seed.length} entries remained private as Seeds.</Text>}
    <TouchableOpacity accessibilityRole="button" disabled={busy || blocked} onPress={() => void perform(onFinish)}><Text>Finish this weave</Text></TouchableOpacity>
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
  </View>;
  if (attempted) return <View style={{ gap: 12 }}>
    <Text accessibilityRole="alert">Publication was attempted. Its outcome is not yet confirmed here. It may have completed; do not publish again. Server result recovery is pending.</Text>
    <Text selectable>Weave: {current.weave_action_run_id}</Text>
  </View>;
  if (current.status === 'abandoned') return <View style={{ gap: 12 }}>
    <Text>Kept in Notebook. This Shuttle attempt has ended.</Text>
    <TouchableOpacity accessibilityRole="button" disabled={busy || blocked} onPress={() => void perform(onFinish)}><Text>Start fresh</Text></TouchableOpacity>
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
  </View>;
  return <View style={{ gap: 14 }}>
    {packet && review ? <>
      <ShuttleReviewForm packet={packet} review={review} disabled={busy || blocked} onChange={(next) => { setReview(next); setError(''); }} />
      <TouchableOpacity accessibilityRole="button" disabled={busy || blocked} onPress={publish}><Text>Publish to Commons</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={busy || blocked} onPress={() => { setPacket(null); setReview(null); }}><Text>Back to interpretation and corrections</Text></TouchableOpacity>
    </> : current.status === 'succeeded' && current.findings ? (
      <TouchableOpacity accessibilityRole="button" disabled={busy || blocked} onPress={() => void perform(async () => {
        const next = await buildShuttlePacket(current.weave_action_run_id);
        if (next.action_run_id !== current.weave_action_run_id) throw new Error('Wrong weave');
        setPacket(next); setReview(createReview(next));
      })}><Text>Review publication packet</Text></TouchableOpacity>
    ) : null}
    <TouchableOpacity accessibilityRole="button" disabled={busy || blocked} onPress={keep}><Text>Keep in Notebook</Text></TouchableOpacity>
    {busy && <ActivityIndicator />}
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
  </View>;
}
