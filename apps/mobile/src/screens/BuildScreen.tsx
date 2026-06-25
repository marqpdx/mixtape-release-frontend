import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { CaptureDock } from '../components/shared/CaptureDock';
import type { RecordedClip } from '../hooks/useNativeVoiceRecorder';
import { useCreateVoiceSeed, useDeleteSeed } from '@mixtape/api/hooks/useSeed';
import { fetchRecentSeeds } from '@mixtape/api/clients/writing/seedApi';
import { pollWithBackoff } from '../services/polling/pollWithBackoff';
import {
  usePersonalInitiative,
  useMeSessions,
  useCreateMeSession,
  useCloseMeSession,
  useMeSessionArtifacts,
} from '@mixtape/api/hooks/initiatives/useMeInitiative';
import { useMeSessionExchange } from '@mixtape/api/hooks/initiatives/useMeSessionExchange';
import type { SessionResponse, RawTranscriptTurn, ArtifactResponse } from '@mixtape/api/clients/initiatives/initiativesApi';

const BUILD_MODEL_KEY = 'mixtape.mobile.buildModel';

const MODELS: { id: string; label: string }[] = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet' },
  { id: 'claude-opus-4-8', label: 'Opus' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku' },
];

function formatSessionTime(iso: string | null | undefined): string {
  if (!iso) return 'Unknown';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function TurnBubble({ speaker, text, streaming }: {
  speaker: string;
  text: string;
  streaming?: boolean;
}) {
  const isUser = speaker === 'human' || speaker === 'user';
  return (
    <View style={[bubbleStyles.wrap, isUser ? bubbleStyles.wrapUser : bubbleStyles.wrapAssistant]}>
      <View style={[bubbleStyles.bubble, isUser ? bubbleStyles.bubbleUser : bubbleStyles.bubbleAssistant]}>
        <Text style={[bubbleStyles.text, isUser ? bubbleStyles.textUser : bubbleStyles.textAssistant]}>
          {text || (streaming ? '…' : '')}
        </Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrap: { marginVertical: 4, paddingHorizontal: 18 },
  wrapUser: { alignItems: 'flex-end' },
  wrapAssistant: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: '#0E5AA7' },
  bubbleAssistant: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8E8F2' },
  text: { fontSize: 15, lineHeight: 21 },
  textUser: { color: '#FFFFFF' },
  textAssistant: { color: '#1B2B3A' },
});

function SessionsList({
  sessions,
  isLoading,
  onSelectSession,
  onStartSession,
  isStarting,
}: {
  sessions: SessionResponse[];
  isLoading: boolean;
  onSelectSession: (id: string) => void;
  onStartSession: () => void;
  isStarting: boolean;
}) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <View style={slStyles.container}>
      <FlatList
        data={sorted}
        keyExtractor={s => s.id}
        contentContainerStyle={slStyles.list}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color="#9DB9D4" style={slStyles.spinner} />
          ) : (
            <Text style={slStyles.empty}>No sessions yet. Start one below.</Text>
          )
        }
        renderItem={({ item }) => {
          const label = item.intent.replace(/_/g, ' ');
          const meta = [
            formatSessionTime(item.started_at ?? item.created_at),
            item.ended_at ? 'closed' : 'open',
            item.artifact_count > 0 ? `${item.artifact_count} artifact${item.artifact_count !== 1 ? 's' : ''}` : null,
          ].filter(Boolean).join(' · ');

          return (
            <TouchableOpacity
              style={slStyles.row}
              onPress={() => onSelectSession(item.id)}
              activeOpacity={0.75}
            >
              <View style={slStyles.rowMain}>
                <Text style={slStyles.rowLabel}>{label}</Text>
                <Text style={slStyles.rowMeta}>{meta}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9DB9D4" />
            </TouchableOpacity>
          );
        }}
      />
      <TouchableOpacity
        style={[slStyles.startButton, isStarting && slStyles.startButtonDisabled]}
        onPress={onStartSession}
        disabled={isStarting}
        activeOpacity={0.8}
      >
        {isStarting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={slStyles.startButtonText}>Start new session</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const slStyles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 12 },
  spinner: { marginTop: 32 },
  empty: { color: '#738292', fontSize: 14, textAlign: 'center', marginTop: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E8F0',
    gap: 12,
  },
  rowMain: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: '#1B2B3A', textTransform: 'capitalize' },
  rowMeta: { fontSize: 12, color: '#738292', marginTop: 2 },
  startButton: {
    marginHorizontal: 18,
    marginVertical: 12,
    backgroundColor: '#0E5AA7',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  startButtonDisabled: { opacity: 0.6 },
  startButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});

function SessionView({
  sessionId,
  sessions,
  onClose,
  onSessionClosed,
}: {
  sessionId: string;
  sessions: SessionResponse[];
  onClose: () => void;
  onSessionClosed: () => void;
}) {
  const session = sessions.find(s => s.id === sessionId);
  const { data: artifacts = [] } = useMeSessionArtifacts(sessionId);
  const { localTurns, isStreaming, error, sendText, clearError } = useMeSessionExchange(sessionId);
  const closeSession = useCloseMeSession();
  const createVoiceSeed = useCreateVoiceSeed();
  const deleteSeed = useDeleteSeed();
  const scrollRef = useRef<ScrollView>(null);

  const handleSubmitVoice = async (clip: RecordedClip) => {
    const seed = await createVoiceSeed.mutateAsync({
      uri: clip.uri,
      mimeType: clip.mimeType,
      fileName: clip.fileName,
      source: 'mobile',
    });
    const transcript = await pollWithBackoff(async () => {
      const seeds = await fetchRecentSeeds(20);
      const match = seeds.find(s => s.id === seed.id);
      if (match && match.status !== 'processing') {
        return { done: true, value: match.status === 'ready' ? match.body_text : undefined };
      }
      return { done: false };
    });
    void deleteSeed.mutateAsync(seed.id).catch(() => {});
    if (transcript) {
      await sendText(transcript);
    }
  };

  const historyTurns: RawTranscriptTurn[] = session?.raw_transcript ?? [];

  useEffect(() => {
    if (localTurns.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [localTurns]);

  const handleExport = useCallback(() => {
    const lines: string[] = [
      `# Build Session — ${formatSessionTime(session?.started_at ?? session?.created_at)}`,
      '',
      '## Transcript',
      '',
    ];
    for (const turn of historyTurns) {
      const speaker = turn.speaker === 'human' ? 'You' : 'AI';
      lines.push(`**${speaker}:** ${turn.text}`);
      lines.push('');
    }
    for (const turn of localTurns) {
      const speaker = turn.role === 'user' ? 'You' : 'AI';
      lines.push(`**${speaker}:** ${turn.text}`);
      lines.push('');
    }
    if (artifacts.length > 0) {
      lines.push('## Artifacts', '');
      for (const a of artifacts) {
        lines.push(`### ${a.title}`, a.body, '');
      }
    }
    Clipboard.setString(lines.join('\n'));
    Alert.alert('Exported', 'Session copied to clipboard as markdown.');
  }, [session, historyTurns, localTurns, artifacts]);

  const handleCloseSession = useCallback(async () => {
    if (closeSession.isPending) return;
    try {
      await closeSession.mutateAsync(sessionId);
      onSessionClosed();
      onClose();
    } catch {
      Alert.alert('Could not close session', 'Try again in a moment.');
    }
  }, [closeSession, sessionId, onSessionClosed, onClose]);

  const allTurnsEmpty = historyTurns.length === 0 && localTurns.length === 0;

  return (
    <KeyboardAvoidingView
      style={svStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={svStyles.bar}>
        <TouchableOpacity onPress={onClose} style={svStyles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#0E5AA7" />
          <Text style={svStyles.backText}>Sessions</Text>
        </TouchableOpacity>
        <View style={svStyles.barActions}>
          {!session?.ended_at ? (
            <TouchableOpacity
              onPress={handleCloseSession}
              activeOpacity={0.7}
              disabled={closeSession.isPending}
            >
              <Text style={svStyles.closeText}>Close session</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={handleExport} activeOpacity={0.7}>
            <Text style={svStyles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={svStyles.thread}
        contentContainerStyle={svStyles.threadContent}
        keyboardShouldPersistTaps="handled"
      >
        {allTurnsEmpty ? (
          <View style={svStyles.emptyThread}>
            <Text style={svStyles.emptyThreadText}>Session open. Send your first message below.</Text>
          </View>
        ) : null}
        {historyTurns.map((turn, i) => (
          <TurnBubble key={`h-${i}`} speaker={turn.speaker} text={turn.text} />
        ))}
        {localTurns.map((turn, i) => (
          <TurnBubble key={`l-${i}`} speaker={turn.role} text={turn.text} streaming={turn.streaming} />
        ))}
        {error ? (
          <TouchableOpacity onPress={clearError} style={svStyles.errorBubble}>
            <Text style={svStyles.errorText}>{error} (tap to dismiss)</Text>
          </TouchableOpacity>
        ) : null}
        {artifacts.length > 0 ? (
          <View style={svStyles.artifactsSection}>
            <Text style={svStyles.artifactsHeading}>Artifacts ({artifacts.length})</Text>
            {artifacts.map((a: ArtifactResponse) => (
              <View key={a.id} style={svStyles.artifactCard}>
                <Text style={svStyles.artifactTitle}>{a.title}</Text>
                <Text style={svStyles.artifactKind}>{a.kind}</Text>
                <Text style={svStyles.artifactBody} numberOfLines={3}>{a.body}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <CaptureDock
        draftStorageKey={`mixtape.mobile.buildDraft.${sessionId}`}
        kickerLabel="BUILD"
        kickerSub={session?.ended_at ? 'Session closed' : 'Send a message'}
        placeholder={session?.ended_at ? 'This session is closed' : 'Type here…'}
        onSubmitText={(text) => sendText(text)}
        onSubmitVoice={handleSubmitVoice}
        isSubmittingText={isStreaming}
        isSubmittingVoice={createVoiceSeed.isPending}
        accentColor="#1B4570"
      />
    </KeyboardAvoidingView>
  );
}

const svStyles = StyleSheet.create({
  container: { flex: 1 },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E8F0',
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 14, fontWeight: '600', color: '#0E5AA7' },
  barActions: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  closeText: { fontSize: 13, color: '#738292', fontWeight: '600' },
  exportText: { fontSize: 13, color: '#0E5AA7', fontWeight: '600' },
  thread: { flex: 1, backgroundColor: '#EEF4F8' },
  threadContent: { paddingVertical: 12, paddingBottom: 24 },
  emptyThread: { alignItems: 'center', paddingVertical: 24 },
  emptyThreadText: { color: '#9DB9D4', fontSize: 14 },
  errorBubble: {
    marginHorizontal: 18,
    marginVertical: 4,
    backgroundColor: '#FFF0EE',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F5C4BF',
  },
  errorText: { fontSize: 13, color: '#8F3341' },
  artifactsSection: {
    marginTop: 12,
    marginHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#D8E8F2',
  },
  artifactsHeading: { fontSize: 12, fontWeight: '700', color: '#315E87', letterSpacing: 0.5, marginBottom: 8 },
  artifactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D8E8F2',
    gap: 4,
  },
  artifactTitle: { fontSize: 13, fontWeight: '700', color: '#1B2B3A' },
  artifactKind: { fontSize: 11, color: '#738292', textTransform: 'uppercase', letterSpacing: 0.5 },
  artifactBody: { fontSize: 13, color: '#3F5A70', lineHeight: 18 },
});

export default function BuildScreen() {
  const { data: initiative, isLoading: initiativeLoading } = usePersonalInitiative();
  const { data: sessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = useMeSessions();
  const createSession = useCreateMeSession();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(BUILD_MODEL_KEY).then(val => {
      if (val && MODELS.some(m => m.id === val)) setModel(val);
      setModelLoaded(true);
    });
  }, []);

  const handleSelectModel = (id: string) => {
    setModel(id);
    void AsyncStorage.setItem(BUILD_MODEL_KEY, id);
  };

  const handleStartSession = async () => {
    try {
      const session = await createSession.mutateAsync({ intent: 'open_inquiry', capture_mode: 'typed' });
      setActiveSessionId(session.id);
    } catch {
      Alert.alert('Could not start session', 'Try again in a moment.');
    }
  };

  if (initiativeLoading || !modelLoaded) {
    return (
      <View style={styles.container}>
        <CrossroadsHeader routeLabel="build" />
        <View style={styles.center}>
          <ActivityIndicator color="#9DB9D4" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CrossroadsHeader routeLabel="build" />

      <View style={styles.initiativeHeader}>
        <Text style={styles.initiativeTitle}>{initiative?.title ?? 'My Scratchpad'}</Text>
        <Text style={styles.initiativeStatus}>{initiative?.status ?? 'active'}</Text>
      </View>

      <View style={styles.modelRow}>
        <Text style={styles.modelLabel}>Model</Text>
        <View style={styles.modelChips}>
          {MODELS.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.modelChip, model === m.id && styles.modelChipActive]}
              onPress={() => handleSelectModel(m.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.modelChipText, model === m.id && styles.modelChipTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeSessionId ? (
        <SessionView
          sessionId={activeSessionId}
          sessions={sessions}
          onClose={() => setActiveSessionId(null)}
          onSessionClosed={() => { void refetchSessions(); }}
        />
      ) : (
        <SessionsList
          sessions={sessions}
          isLoading={sessionsLoading}
          onSelectSession={setActiveSessionId}
          onStartSession={handleStartSession}
          isStarting={createSession.isPending}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF4F8', paddingTop: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  initiativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
    paddingTop: 4,
  },
  initiativeTitle: { fontSize: 16, fontWeight: '700', color: '#1B2B3A', flex: 1, marginRight: 8 },
  initiativeStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#315E87',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E8F0',
  },
  modelLabel: { fontSize: 12, fontWeight: '600', color: '#738292' },
  modelChips: { flexDirection: 'row', gap: 6 },
  modelChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E8F2',
    backgroundColor: '#FFFFFF',
  },
  modelChipActive: { backgroundColor: '#0E5AA7', borderColor: '#0E5AA7' },
  modelChipText: { fontSize: 12, fontWeight: '600', color: '#315E87' },
  modelChipTextActive: { color: '#FFFFFF' },
});
