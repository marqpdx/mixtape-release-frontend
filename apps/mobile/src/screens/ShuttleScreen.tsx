import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { uuid } from 'expo-modules-core';
import { clearShuttleSession, readShuttleSession, saveShuttleSession } from '../services/shuttle/session';
import type { ShuttleSession } from '../services/shuttle/session';
import Clipboard from '@react-native-clipboard/clipboard';
import { CaptureDock } from '../components/shared/CaptureDock';
import { useCreateSeed, useCreateVoiceSeed, useRecentSeeds } from '@mixtape/api/hooks/useSeed';
import type { Seed } from '@mixtape/api/clients/writing/seedApi';
import { useSeedTranscription } from '../hooks/useSeedTranscription';
import { useAuthStore } from '../stores/authStore';
import {
  buildConfirmation, createReview, reviewFromSample, samplePacket, sampleResult,
  sampleWeave, unansweredMerges,
} from '../services/shuttle/review';
import type { ShuttleReview } from '../services/shuttle/review';
import type { ShuttleConfirmIn } from '@mixtape/api/clients/shuttle/contract';
import { buildInterpretationRequest, getWeaveText } from '../services/shuttle/interpretation';
import { ShuttleInterpretationPanel } from '../components/shuttle/ShuttleInterpretationPanel';

function CheckRow({ label, checked, onPress }: {
  label: string; checked: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.checkRow}
      onPress={onPress}
    >
      <Text style={[styles.check, checked && styles.checked]}>{checked ? '✓' : ''}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ShuttleScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const username = currentUser?.username ?? 'anonymous';
  const [session, setSession] = useState<ShuttleSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    let live = true;
    setSessionReady(false); setSession(null); setCapturedSeed(null); setStorageError('');
    readShuttleSession(username).then((saved) => { if (live) { setSession(saved); setSessionReady(true); } })
      .catch(() => { if (live) setStorageError('Could not restore this Shuttle session. Restart the app before starting another weave.'); });
    return () => { live = false; };
  }, [username]);
  const retainCapture = async (seed: Seed) => {
    const saved = { seedId: seed.id, requestId: uuid.v4() };
    await saveShuttleSession(username, saved);
    setSession(saved); setCapturedSeed(seed);
  };
  const finish = async () => {
    await clearShuttleSession(username);
    setSession(null); setCapturedSeed(null);
  };
  const recentSeeds = useRecentSeeds(20);
  const createSeed = useCreateSeed();
  const createVoiceSeed = useCreateVoiceSeed();
  useSeedTranscription(recentSeeds);
  const [capturedSeed, setCapturedSeed] = useState<Seed | null>(null);
  const [captureError, setCaptureError] = useState('');
  const latestCapture = recentSeeds.data?.find((seed) => seed.id === (session?.seedId ?? capturedSeed?.id)) ?? capturedSeed;
  const weaveText = getWeaveText(latestCapture);
  const [copiedWeave, setCopiedWeave] = useState<string | null>(null);
  const [showSample, setShowSample] = useState(false);
  const [review, setReview] = useState(() => createReview(samplePacket));
  const [confirmation, setConfirmation] = useState<ShuttleConfirmIn | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [showPayload, setShowPayload] = useState(false);
  const [message, setMessage] = useState('');

  const update = (patch: Partial<ShuttleReview>) => {
    setReview((previous) => ({ ...previous, ...patch }));
    setMessage('');
  };
  const toggle = (id: string) => {
    setReview((previous) => ({
      ...previous,
      tickedIds: previous.tickedIds.includes(id)
        ? previous.tickedIds.filter((value) => value !== id) : [...previous.tickedIds, id],
    }));
    setMessage('');
  };
  const itemName = (id: string) => samplePacket.items.find((item) => item.item_id === id)?.name ?? id;
  const publish = () => {
    const unanswered = unansweredMerges(samplePacket, review);
    if (unanswered.length) {
      setMessage(`Choose merge or keep separate for ${unanswered.join(', ')}.`);
      return;
    }
    if (samplePacket.ideas.some((idea) =>
      review.tickedIds.includes(idea.idea_id) && !review.ideaWordings[idea.idea_id]?.trim(),
    )) {
      setMessage('Give each checked Idea a wording, or untick it.');
      return;
    }
    setConfirmation(buildConfirmation(samplePacket, review));
    setShowPayload(false);
    setMessage('');
  };
  const reset = (withSampleStories: boolean) => {
    setReview(withSampleStories ? reviewFromSample() : createReview(samplePacket));
    setConfirmation(null);
    setShowReference(false);
    setShowPayload(false);
    setMessage('');
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}><CrossroadsHeader routeLabel="shuttle" /></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Shuttle</Text>
        <Text style={styles.notice}>Tell what you found. We'll shape it for Commons together, then you decide what to publish.</Text>
        {sessionReady && !session && <CaptureDock
          draftStorageKey={`mixtape.mobile.shuttleDraft.${currentUser?.username ?? 'anonymous'}`}
          kickerLabel="Shuttle"
          kickerSub="Tell what you found"
          placeholder="What did you find? What did it remind you of? Tell it your way…"
          submitLabel="Capture"
          isSubmittingText={createSeed.isPending}
          isSubmittingVoice={createVoiceSeed.isPending}
          onSubmitText={async (text) => {
            setCaptureError('');
            try {
              await retainCapture(await createSeed.mutateAsync({ body_text: text, kind: 'text', source: 'mobile' }));
            } catch {
              // CaptureDock clears text only when submission succeeds.
              setCaptureError('Could not save your weave. Your text is still here; try again.');
              return false;
            }
          }}
          onSubmitVoice={async (clip) => {
            setCaptureError('');
            try {
              await retainCapture(await createVoiceSeed.mutateAsync({
                uri: clip.uri, mimeType: clip.mimeType, fileName: clip.fileName, source: 'mobile',
              }));
            } catch {
              setCaptureError('Could not upload your recording. Check your connection and record again.');
            }
          }}
          belowInputContent={<Text style={styles.hint}>For now, sending keeps a private copy in Notebook. Nothing goes public from capture.</Text>}
        />}
        {storageError ? <Text accessibilityRole="alert" style={styles.error}>{storageError}</Text> : null}
        {!sessionReady && !storageError ? <Text>Restoring Shuttle…</Text> : null}
        {captureError ? <Text accessibilityRole="alert" style={styles.error}>{captureError}</Text> : null}
        {latestCapture && (
          <View style={styles.card}>
            <Text style={styles.heading}>Your weave</Text>
            {latestCapture.status === 'processing' ? (
              <Text style={styles.body}>Transcription in progress…</Text>
            ) : latestCapture.status === 'failed' ? (
              <Text style={styles.error}>Transcription did not finish. The recording remains in Notebook.</Text>
            ) : weaveText ? (
              <Text selectable style={styles.body}>{weaveText}</Text>
            ) : <Text style={styles.body}>No transcript text yet. Your capture is saved in Notebook.</Text>}

            {weaveText && (
              <>
                <Text style={styles.hint}>You can also copy this telling to interpret it in our working conversation.</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.secondary}
                  onPress={() => {
                    Clipboard.setString(buildInterpretationRequest(weaveText));
                    setCopiedWeave(`${latestCapture.id}:${weaveText}`);
                  }}
                >
                  <Text style={styles.link}>Copy for interpretation</Text>
                </TouchableOpacity>
                {copiedWeave === `${latestCapture.id}:${weaveText}` ? (
                  <Text accessibilityLiveRegion="polite" style={styles.hint}>Copied. Paste into our working conversation so we can read it together. Nothing has been sent automatically.</Text>
                ) : <Text style={styles.hint}>Copies your exact telling with a request to interpret it. Paste into our working conversation; we can tune what it means together.</Text>}
              </>
            )}
            <Text style={styles.hint}>Capture is private. Review and Publish below are separate actions.</Text>
          </View>
        )}
        {session && <View style={styles.card}>
          {session.publishAttempted ? <>
            <Text style={styles.heading}>{session.result ? 'Published to Commons' : 'Publication outcome not confirmed'}</Text>
            {session.result ? <>
              <Text>{session.result.written.length} written records confirmed by the server. Map visibility is a separate checkpoint.</Text>
              {session.result.rested_as_seed.length > 0 && <Text>{session.result.rested_as_seed.length} entries remained private as Seeds.</Text>}
              <TouchableOpacity accessibilityRole="button" onPress={() => void finish().catch(() => setStorageError('Could not clear the completed session. Try again.'))}><Text style={styles.link}>Finish this weave</Text></TouchableOpacity>
            </> : <>
              <Text accessibilityRole="alert">Publish was attempted and may have completed. Do not publish again. Keep this session while server result recovery is pending.</Text>
              <Text selectable>Weave: {session.weaveId}</Text>
            </>}
          </> : <ShuttleInterpretationPanel key={session.seedId} seedId={session.seedId} username={username}
            session={session} onSession={setSession} onFinish={finish} />}
        </View>}
        <View style={styles.card}>
          <Text style={styles.heading}>Packet review example</Text>
          <Text style={styles.hint}>Explore the three-choirs example when you want. Your telling above stays separate.</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ expanded: showSample }}
            style={styles.secondary}
            onPress={() => setShowSample((value) => !value)}
          >
            <Text style={styles.link}>{showSample ? 'Hide' : 'Open'} sample packet</Text>
          </TouchableOpacity>
        </View>
        {showSample && <>
        {confirmation ? (
          <View style={styles.card}>
            <Text style={styles.heading}>Confirmation prepared</Text>
            <Text style={styles.body}>These sample choices are ready locally. This confirmation has not published anything or created Seeds.</Text>
            <Text style={styles.body}>This is a historical sample. In live review, finish the stories or explicitly change scope before Publish.</Text>
            <TouchableOpacity style={styles.secondary} onPress={() => setConfirmation(null)}>
              <Text style={styles.link}>Back to review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondary} onPress={() => setShowPayload((value) => !value)}>
              <Text style={styles.link}>{showPayload ? 'Hide' : 'Inspect'} sample confirmation</Text>
            </TouchableOpacity>
            {showPayload && <Text selectable style={styles.code}>{JSON.stringify(confirmation, null, 2)}</Text>}
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.heading}>The weave</Text>
              <Text style={styles.body}>{sampleWeave.text}</Text>
              <Text style={styles.hint}>Shared three-choirs example, separate from your capture above.</Text>
            </View>
            <Text style={styles.anchor}>{samplePacket.anchor.headline}</Text>
            <View style={styles.card}>
              <Text style={styles.heading}>Things & places</Text>
              {samplePacket.items.map((item) => (
                <View key={item.item_id} style={styles.entry}>
                  <CheckRow
                    label={`${item.name} · ${item.locale}`}
                    checked={review.tickedIds.includes(item.item_id)}
                    onPress={() => toggle(item.item_id)}
                  />
                  <Text style={styles.hint}>{item.kind === 'place' ? 'Place' : 'Thing'} · {item.match_state === 'near_duplicate' ? 'Possible match' : item.match_state}</Text>
                  {item.match_state === 'near_duplicate' && item.candidate && review.tickedIds.includes(item.item_id) && (
                    <View style={styles.merge}>
                      <Text style={styles.body}>Same as {item.candidate.name}?</Text>
                      <View style={styles.choices}>
                        {(['merge', 'keep_separate'] as const).map((decision) => (
                          <TouchableOpacity
                            key={decision}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: review.mergeDecisions[item.item_id] === decision }}
                            onPress={() => update({ mergeDecisions: { ...review.mergeDecisions, [item.item_id]: decision } })}
                            style={[styles.choice, review.mergeDecisions[item.item_id] === decision && styles.chosen]}
                          >
                            <Text style={styles.link}>{decision === 'merge' ? 'Merge' : 'Keep separate'}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.heading}>Ideas</Text>
              {samplePacket.ideas.map((idea) => (
                <View key={idea.idea_id} style={styles.entry}>
                  <CheckRow label={idea.wording} checked={review.tickedIds.includes(idea.idea_id)} onPress={() => toggle(idea.idea_id)} />
                  <TextInput
                    accessibilityLabel={`Wording for ${idea.wording}`}
                    style={styles.input}
                    value={review.ideaWordings[idea.idea_id]}
                    onChangeText={(wording) => update({ ideaWordings: { ...review.ideaWordings, [idea.idea_id]: wording } })}
                  />
                  <Text style={styles.hint}>Closest existing: {idea.closest_existing.map((candidate) => candidate.name).join(', ') || 'none found'}</Text>
                </View>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.heading}>Adjacencies · one cluster</Text>
              {samplePacket.adjacencies.map((adjacency) => (
                <View key={adjacency.adjacency_id} style={styles.entry}>
                  <CheckRow
                    label={adjacency.ends.map(itemName).join(' ↔ ')}
                    checked={review.tickedIds.includes(adjacency.adjacency_id)}
                    onPress={() => toggle(adjacency.adjacency_id)}
                  />
                  <Text style={styles.hint}>{adjacency.reason}</Text>
                </View>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.heading}>Stories</Text>
              <Text style={styles.body}>One line is enough. Your words stay as you tell them. A place without a story rests as a Seed.</Text>
              {samplePacket.story_prompts.map(({ item_id, prompt }) => (
                <View key={item_id} style={styles.entry}>
                  <Text style={styles.label}>{itemName(item_id)}</Text>
                  {review.tickedIds.includes(item_id) ? (
                    <>
                      <Text style={styles.hint}>{prompt}</Text>
                      <TextInput
                        accessibilityLabel={`Story for ${itemName(item_id)}`}
                        style={[styles.input, styles.story]}
                        multiline
                        placeholder="Here's the story…"
                        placeholderTextColor="#6B8499"
                        value={review.stories[item_id] ?? ''}
                        onChangeText={(text) => update({ stories: { ...review.stories, [item_id]: text } })}
                      />
                      <TextInput
                        accessibilityLabel={`Music link for ${itemName(item_id)}`}
                        style={styles.input}
                        placeholder="Music link (optional)"
                        placeholderTextColor="#6B8499"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        value={review.musicLinks[item_id] ?? ''}
                        onChangeText={(link) => update({ musicLinks: { ...review.musicLinks, [item_id]: link } })}
                      />
                    </>
                  ) : <Text style={styles.hint}>Left to rest as a Seed when published.</Text>}
                </View>
              ))}
            </View>
            {samplePacket.stories_not_yet_told && (
              <View style={styles.card}>
                <Text style={styles.heading}>Stories Not Yet Told</Text>
                <Text style={styles.body}>{samplePacket.stories_not_yet_told.question}</Text>
                {samplePacket.stories_not_yet_told.offers.map((offer) => <Text key={offer.id} style={styles.hint}>{offer.label}</Text>)}
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Keep them?</Text>
                  <Switch accessibilityLabel="Keep Stories Not Yet Told" value={review.keepOffers} onValueChange={(keepOffers) => update({ keepOffers })} />
                </View>
              </View>
            )}
            {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
            <TouchableOpacity accessibilityRole="button" style={styles.publish} onPress={publish}>
              <Text style={styles.publishText}>Publish · sample</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={styles.card}>
          <Text style={styles.heading}>Try the handoff example</Text>
          <Text style={styles.hint}>Loads the supplied whole-weave choices and stories for all three choirs.</Text>
          <TouchableOpacity style={styles.secondary} onPress={() => reset(true)}><Text style={styles.link}>Load sample choices & stories</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={() => reset(false)}><Text style={styles.link}>Start sample over</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={() => setShowReference((value) => !value)}><Text style={styles.link}>{showReference ? 'Hide' : 'Show'} reference outcome</Text></TouchableOpacity>
          {showReference && <Text style={styles.body}>Reference fixture only: all three choirs are approved with their stories. Entries left private as Seeds ({sampleResult.rested_as_seed.map(itemName).join(', ')}). This is a fixed example, independent of your choices above.</Text>}
        </View>
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF4F8' },
  header: { paddingHorizontal: 18, paddingTop: 18 },
  content: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },
  title: { fontSize: 28, fontWeight: '700', color: '#173753' },
  notice: { color: '#3C5C73', fontSize: 13, lineHeight: 19 },
  anchor: { color: '#173753', fontSize: 18, fontWeight: '700', lineHeight: 26 },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: '#D7E0EA' },
  heading: { color: '#173753', fontSize: 18, fontWeight: '700' },
  body: { color: '#294A63', fontSize: 15, lineHeight: 22 },
  hint: { color: '#516C82', fontSize: 13, lineHeight: 19 },
  entry: { gap: 8, paddingVertical: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  check: { width: 26, height: 26, borderRadius: 6, borderWidth: 1, borderColor: '#6B8499', color: '#FFF', textAlign: 'center', lineHeight: 24, fontWeight: '700' },
  checked: { backgroundColor: '#0E5AA7', borderColor: '#0E5AA7' },
  rowLabel: { flex: 1, color: '#173753', fontSize: 15, lineHeight: 21, fontWeight: '600' },
  label: { color: '#173753', fontSize: 15, fontWeight: '600' },
  merge: { padding: 12, backgroundColor: '#EEF4F8', borderRadius: 10, gap: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { padding: 12, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: '#B9C9D6' },
  chosen: { backgroundColor: '#D6E8F8', borderColor: '#0E5AA7' },
  input: { borderWidth: 1, borderColor: '#B9C9D6', borderRadius: 10, padding: 12, color: '#173753', fontSize: 15, minHeight: 44 },
  story: { minHeight: 82, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secondary: { minHeight: 44, justifyContent: 'center', paddingVertical: 10 },
  link: { color: '#0E5AA7', fontSize: 14, fontWeight: '600' },
  publish: { backgroundColor: '#0E5AA7', borderRadius: 14, padding: 16, alignItems: 'center' },
  publishText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  error: { color: '#A32929', fontSize: 14, lineHeight: 20 },
  code: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#294A63', fontSize: 12, lineHeight: 18 },
});
