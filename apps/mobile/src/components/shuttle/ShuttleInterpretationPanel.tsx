import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { uuid } from 'expo-modules-core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  correctShuttleInterpretation, executeShuttleInterpretation, fetchShuttleInterpretation,
  startShuttleInterpretation,
} from '@mixtape/api/clients/shuttle/findings';
import type { ShuttleInterpretation, ShuttleSighting } from '@mixtape/api/clients/shuttle/findings';
import { useCreateVoiceSeed, useRecentSeeds } from '@mixtape/api/hooks/useSeed';
import type { Seed } from '@mixtape/api/clients/writing/seedApi';
import { CaptureDock } from '../shared/CaptureDock';
import { getWeaveText } from '../../services/shuttle/interpretation';

const ERROR_MESSAGES: Record<string, string> = {
  runtime_missing: 'Your Claude account is not connected for Shuttle yet. Your capture is safe.',
  runtime_not_ready: 'Your Claude account is not ready yet. Your capture is safe.',
  mode_not_allowed: 'Your Claude account is not enabled for Shuttle interpretation yet.',
  policy_forbids_cloud: 'Your privacy policy does not allow this cloud interpretation. Nothing was sent.',
  cloud_approval_required: 'Review and approve sending this telling before interpretation.',
  cloud_approval_not_permitted: 'Cloud interpretation is not enabled for your account yet.',
  auth_failure: 'Your Claude account needs to be signed in again.',
  timeout: 'Interpretation took too long. Your capture is safe; you can retry.',
  invalid_output: 'The interpretation did not pass its checks. Your words are unchanged; you can retry.',
  revision_conflict: 'This weave has changed. Refresh it before trying that correction again.',
  dispatch_unavailable: 'Interpretation could not start. Your capture is safe; you can retry.',
  execution_failed: 'Interpretation did not finish. Your capture is safe; you can retry.',
};

function explain(error: unknown): string {
  if (isAxiosError<{ error?: string }>(error)) {
    if (error.response?.status === 404) return 'Shuttle interpretation is not available here yet. You can still copy your telling for interpretation.';
    const code = error.response?.data?.error;
    if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  }
  return 'Could not reach interpretation. Your capture is safe; try again when connected.';
}

function label(sighting: ShuttleSighting): string {
  if ('name_as_said' in sighting) return sighting.proposed_name ?? sighting.name_as_said;
  if (sighting.shape_id === 'shuttle.idea') return sighting.wording;
  return sighting.sighting_id;
}

export function ShuttleInterpretationPanel({ seedId, username }: { seedId: string; username: string }) {
  const queryClient = useQueryClient();
  const [weaveId, setWeaveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [voiceSeed, setVoiceSeed] = useState<Seed | null>(null);
  const startRequest = useRef(uuid.v4());
  const executionRequest = useRef<{ digest: string; id: string } | null>(null);
  const correctionRequest = useRef<{ text: string; id: string } | null>(null);
  const submitting = useRef(false);
  const createVoice = useCreateVoiceSeed();
  const recentSeeds = useRecentSeeds(20);
  const latestVoice = recentSeeds.data?.find((seed) => seed.id === voiceSeed?.id) ?? voiceSeed;
  const voiceText = getWeaveText(latestVoice);
  const { data, refetch, error: pollError } = useQuery({
    queryKey: ['shuttleInterpretation', weaveId],
    queryFn: () => fetchShuttleInterpretation(weaveId!), enabled: weaveId !== null,
    refetchInterval: (query) => {
      const current = query.state.data;
      return current?.execution_action_run_id && ['pending', 'running'].includes(current.status) ? 2000 : false;
    },
    retry: false,
  });
  const accept = (next: ShuttleInterpretation) => {
    queryClient.setQueryData(['shuttleInterpretation', next.weave_action_run_id], next);
    setWeaveId(next.weave_action_run_id);
    setError('');
  };
  const perform = async (operation: () => Promise<void>): Promise<void | false> => {
    if (submitting.current) return false;
    submitting.current = true;
    setBusy(true);
    setError('');
    try { await operation(); }
    catch (failure) { setError(explain(failure)); return false; }
    finally { submitting.current = false; setBusy(false); }
  };
  const execute = (current: ShuttleInterpretation) => {
    const send = () => void perform(async () => {
      if (!executionRequest.current || executionRequest.current.digest !== current.source_digest || current.status === 'failed') {
        executionRequest.current = { digest: current.source_digest, id: uuid.v4() };
      }
      accept(await executeShuttleInterpretation(current, executionRequest.current.id, current.cloud_requested));
    });
    if (current.cloud_requested) {
      Alert.alert('Send this telling to Claude?',
        'Your original telling and any corrections shown here will be sent to the remote Claude model through your own account. Nothing will be published.',
        [{ text: 'Keep private', style: 'cancel' }, { text: 'Send for interpretation', onPress: send }]);
    } else send();
  };
  const submitCorrection = async (text: string, correctionSeedId?: string) => perform(async () => {
    if (!data) return;
    const identity = `${data.revision}:${correctionSeedId ?? text}`;
    if (correctionRequest.current?.text !== identity) correctionRequest.current = { text: identity, id: uuid.v4() };
    const next = await correctShuttleInterpretation(data, {
      request_id: correctionRequest.current.id,
      ...(correctionSeedId ? { correction_seed_id: correctionSeedId } : { correction_text: text }),
    });
    accept(next);
    setVoiceSeed(null);
    // Sending the next revision is a separate, explicit cloud approval below.
  });
  const findings = data?.findings;
  const reading = findings?.sightings.find((s) => s.shape_id === 'shuttle.weave');
  const name = (id: string) => {
    const sighting = findings?.sightings.find((s) => s.sighting_id === id);
    return sighting ? label(sighting) : id;
  };

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Hear it back</Text>
      {pollError ? <Text accessibilityRole="alert" style={styles.error}>{explain(pollError)}</Text> : null}
      {!data ? (
        <>
          <Text style={styles.body}>See the things, Places, stories, and connections Shuttle hears, then tell it what to change.</Text>
          <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.button}
            onPress={() => void perform(async () => accept(await startShuttleInterpretation({ request_id: startRequest.current, seed_id: seedId, client: 'phone' })))}>
            <Text style={styles.buttonText}>Read my weave</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Original telling for this weave</Text>
          <Text selectable style={styles.hint}>{data.sources[0]?.text}</Text>
          {data.sources.slice(1).map((source) => <Text key={source.source_ref} selectable style={styles.body}>Your correction: {source.text}</Text>)}
          {['pending', 'running'].includes(data.status) && data.execution_action_run_id ? (
            <View style={styles.status}><ActivityIndicator color="#0E5AA7" /><Text style={styles.body}>Listening for the meaning…</Text></View>
          ) : !findings && data.status !== 'failed' ? (
            <Text style={styles.body}>{data.cloud_requested ? 'Ready to send this telling to your Claude account for interpretation.' : 'Ready to interpret this telling locally.'}</Text>
          ) : null}
          {(data.status === 'awaiting_cloud_approval' || (data.status === 'pending' && !data.execution_action_run_id) || data.status === 'failed') && (
            <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.button} onPress={() => execute(data)}>
              <Text style={styles.buttonText}>{data.cloud_requested ? 'Review with Claude' : 'Interpret locally'}</Text>
            </TouchableOpacity>
          )}
          {data.error ? <Text accessibilityRole="alert" style={styles.error}>{ERROR_MESSAGES[data.error] ?? 'Interpretation did not finish. Your capture is safe.'}</Text> : null}
          {reading?.shape_id === 'shuttle.weave' && <Text selectable style={styles.reading}>{reading.reading}</Text>}
          {findings?.sightings.filter((s) => ['shuttle.thing', 'shuttle.place', 'shuttle.idea'].includes(s.shape_id)).map((s) => (
            <Text key={s.sighting_id} style={styles.body}>{s.shape_id === 'shuttle.place' && s.role === 'locale' ? 'Locale' : s.shape_id.split('.')[1]} · {label(s)}</Text>
          ))}
          {findings?.sightings.map((s) => (
            <View key={s.sighting_id} style={styles.detail}>
              {s.shape_id === 'shuttle.adjacency' && <>
                <Text style={styles.body}>{s.ends.map(name).join(' ↔ ')}: {s.reason}</Text>
                {s.intent_evidence.map((span, index) => <Text key={index} selectable style={styles.hint}>Your words: “{span.quote}”</Text>)}
              </>}
              {s.shape_id === 'shuttle.story' && <>
                <Text style={styles.label}>Story · {s.subject_ids.map(name).join(', ')} · {s.knowledge_basis}</Text>
                <Text selectable style={styles.body}>{s.text}</Text>
              </>}
              {s.uncertain.map((item, index) => <Text key={index} style={styles.hint}>Uncertain · {item.reason}</Text>)}
            </View>
          ))}
          {findings?.questions.map((q) => <Text key={q.question_id} style={styles.body}>{q.text}</Text>)}
          {findings && <Text style={styles.hint}>A proposed reading, ready for your corrections. Nothing has been published.</Text>}
          {(findings || data.status === 'failed') && <CaptureDock
            draftStorageKey={`mixtape.mobile.shuttleCorrection.${username}.${data.weave_action_run_id}`}
            kickerLabel="Tell Shuttle what to change"
            placeholder="Yes, and… / Actually, I meant…"
            submitLabel="Correct"
            isSubmittingText={busy}
            isSubmittingVoice={createVoice.isPending}
            onSubmitText={(text) => submitCorrection(text)}
            onSubmitVoice={async (clip) => {
              try { setVoiceSeed(await createVoice.mutateAsync({ uri: clip.uri, mimeType: clip.mimeType, fileName: clip.fileName, source: 'mobile' })); }
              catch (failure) { setError(explain(failure)); }
            }}
            belowInputContent={<Text style={styles.hint}>Your original telling stays unchanged. A recorded correction is saved privately in Notebook for transcription.</Text>}
          />}
          {voiceSeed && <>
            <Text selectable style={styles.body}>{voiceText ?? (latestVoice?.status === 'failed' ? 'Transcription did not finish. The recording is in Notebook.' : 'Transcribing your correction…')}</Text>
            {voiceText && <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.button} onPress={() => void submitCorrection(voiceText, voiceSeed.id)}><Text style={styles.buttonText}>Use this correction</Text></TouchableOpacity>}
          </>}
          <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={() => void refetch()}><Text style={styles.link}>Refresh reading</Text></TouchableOpacity>
        </>
      )}
      {busy && <ActivityIndicator color="#0E5AA7" />}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12, paddingVertical: 12 },
  heading: { fontSize: 18, fontWeight: '700', color: '#173753' },
  body: { color: '#294A63', fontSize: 15, lineHeight: 22 },
  reading: { color: '#173753', fontSize: 18, lineHeight: 26, fontWeight: '600' },
  hint: { color: '#516C82', fontSize: 13, lineHeight: 19 },
  detail: { gap: 5 }, label: { color: '#173753', fontWeight: '600' },
  button: { backgroundColor: '#0E5AA7', borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  secondary: { minHeight: 44, justifyContent: 'center' },
  link: { color: '#0E5AA7', fontWeight: '600' },
  error: { color: '#A32929', lineHeight: 20 },
  status: { flexDirection: 'row', gap: 10, alignItems: 'center' },
});
