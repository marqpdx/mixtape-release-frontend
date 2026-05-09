// apps/mobile/src/screens/OpsScreen.tsx
//
// Operations screen (Ops tab) — enterprise action capture.
// Group selector + op type selector at top; CaptureDock + recent items below.
// OP-2: shell, wiring, group emblem with fade transition.
// OP-3: voice list parsing + confirmation sheet.
// OP-4: voice session resilience via AsyncStorage.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { CaptureDock } from '../components/shared/CaptureDock';
import { useUserGroups } from '@mixtape/api/hooks/groups/useGroups';
import { useHubCaptures, useResolveCapture } from '@mixtape/api/hooks/console/useConsole';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import type { HubCapture, HubCaptureKind } from '@mixtape/api/clients/console/consoleApi';
import { useAuthStore } from '../stores/authStore';
import type { RecordedClip } from '../hooks/useNativeVoiceRecorder';
import type { Group } from '@mixtape/core/types/groupTypes';

// ---------------------------------------------------------------------------
// Op type config
// ---------------------------------------------------------------------------

type OpKind = HubCaptureKind;

interface OpConfig {
  kind: OpKind;
  label: string;
  buttonText: string;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const OPS: OpConfig[] = [
  {
    kind: 'remind',
    label: 'REMIND',
    buttonText: 'Remind me...',
    placeholder: 'Remind me to...',
    icon: 'alarm-outline',
    color: '#8A6B00',
  },
  {
    kind: 'need_more',
    label: 'NEED MORE',
    buttonText: 'We need more...',
    placeholder: 'We need more...',
    icon: 'cart-outline',
    color: '#0E5AA7',
  },
  {
    kind: 'fix',
    label: 'WE NEED TO',
    buttonText: 'We need to...',
    placeholder: 'We need to...',
    icon: 'checkmark-circle-outline',
    color: '#2E7D52',
  },
  {
    kind: 'note',
    label: 'DRAFT',
    buttonText: 'Draft a...',
    placeholder: 'Draft a...',
    icon: 'create-outline',
    color: '#6B3FA0',
  },
  {
    kind: 'note',
    label: 'NOTE',
    buttonText: 'Note',
    placeholder: 'Note...',
    icon: 'pencil-outline',
    color: '#435261',
  },
];

// We distinguish Draft vs Note by index since both use kind='note'
const DRAFT_INDEX = 3;

// ---------------------------------------------------------------------------
// Persistence keys
// ---------------------------------------------------------------------------

const LAST_GROUP_KEY = (username: string) =>
  `mixtape.mobile.ops.lastGroupSlug.${username}`;
const LAST_OP_KEY = (username: string) =>
  `mixtape.mobile.ops.lastOpIndex.${username}`;
const DRAFT_KEY = (username: string, groupSlug: string, opIndex: number) =>
  `mixtape.mobile.ops.draft.${username}.${groupSlug}.${opIndex}`;
const PENDING_VOICE_KEY = (username: string, groupSlug: string, opIndex: number) =>
  `mixtape.mobile.ops.pendingVoice.${username}.${groupSlug}.${opIndex}`;


// ---------------------------------------------------------------------------
// Mock group emblem (OP-2; real emblem via identity/ API in future pass)
// ---------------------------------------------------------------------------

const EMBLEM_COLORS = [
  '#0E5AA7', '#2E7D52', '#8A6B00', '#6B3FA0',
  '#C0392B', '#1A6B85', '#7D4E2E', '#3D5A80',
];

function groupColor(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EMBLEM_COLORS[Math.abs(hash) % EMBLEM_COLORS.length];
}

function groupInitial(title: string): string {
  return (title.trim()[0] ?? '?').toUpperCase();
}

function GroupEmblem({ group, style }: { group: { slug: string; title: string } | null; style?: object }) {
  if (!group) return null;
  return (
    <View style={[styles.emblem, { backgroundColor: groupColor(group.slug) }, style]}>
      <Text style={styles.emblemInitial}>{groupInitial(group.title)}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Recent ops item row
// ---------------------------------------------------------------------------

function OpsItemRow({
  item,
  opConfig,
  onResolve,
}: {
  item: HubCapture;
  opConfig: OpConfig;
  onResolve: (id: string) => void;
}) {
  const isResolved = item.status === 'resolved';
  const date = new Date(item.created_at);
  const timeLabel = Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <View style={[styles.opsRow, isResolved && styles.opsRowResolved]}>
      <View style={styles.opsRowHeader}>
        <Text style={[styles.opsRowKind, { color: opConfig.color }]}>{opConfig.label}</Text>
        <Text style={styles.opsRowTime}>{timeLabel}</Text>
      </View>
      <View style={styles.opsRowBody}>
        <Text
          style={[styles.opsRowText, isResolved && styles.opsRowTextResolved]}
          numberOfLines={3}
        >
          {item.body}
        </Text>
        {!isResolved && (
          <TouchableOpacity
            onPress={() => onResolve(item.id)}
            hitSlop={8}
            style={styles.resolveBtn}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color="#2E7D52" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function OpsScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const username = currentUser?.username ?? '';

  const { groups: allGroups, isLoading: groupsLoading } = useUserGroups();

  // Group selector: Personal always first
  const PERSONAL = { slug: '__personal__', title: 'Personal' } as const;
  const groupOptions = [PERSONAL, ...allGroups];

  const [selectedGroupSlug, setSelectedGroupSlug] = useState<string>(PERSONAL.slug);
  const [selectedOpIndex, setSelectedOpIndex] = useState(4); // default: Note
  const [actionFocused, setActionFocused] = useState(false);

  const [transcribing, setTranscribing] = useState(false);

  // Emblem fade transition
  const emblemOpacity = useRef(new Animated.Value(1)).current;

  // Restore last-used group and op type
  useEffect(() => {
    if (!username) return;
    void Promise.all([
      AsyncStorage.getItem(LAST_GROUP_KEY(username)),
      AsyncStorage.getItem(LAST_OP_KEY(username)),
    ]).then(([g, o]) => {
      if (g) setSelectedGroupSlug(g);
      if (o !== null) setSelectedOpIndex(Number(o));
    });
  }, [username]);

  const handleSelectGroup = useCallback((slug: string) => {
    Animated.sequence([
      Animated.timing(emblemOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(emblemOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setSelectedGroupSlug(slug);
    if (username) void AsyncStorage.setItem(LAST_GROUP_KEY(username), slug);
  }, [emblemOpacity, username]);

  const handleSelectOp = useCallback((index: number) => {
    setSelectedOpIndex(index);
    if (username) void AsyncStorage.setItem(LAST_OP_KEY(username), String(index));
  }, [username]);

  const activeOp = OPS[selectedOpIndex];
  const groupSlugParam = selectedGroupSlug === PERSONAL.slug ? undefined : selectedGroupSlug;
  const activeGroup = groupOptions.find((g) => g.slug === selectedGroupSlug) ?? PERSONAL;
  const draftKey = DRAFT_KEY(username, selectedGroupSlug, selectedOpIndex);
  const pendingVoiceKey = PENDING_VOICE_KEY(username, selectedGroupSlug, selectedOpIndex);

  // Recent ops list
  const { data: captureData, isLoading: capturesLoading, refetch } =
    useHubCaptures(activeOp.kind, groupSlugParam);
  const captures = captureData?.captures ?? [];

  const resolveCapture = useResolveCapture();

  // OP-4: check for pending voice clip on mount
  useEffect(() => {
    if (!username) return;
    void AsyncStorage.getItem(pendingVoiceKey).then((uri) => {
      if (!uri) return;
      Alert.alert(
        'Unsent recording',
        'You have a voice recording that was not sent. Would you like to send it now?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => void AsyncStorage.removeItem(pendingVoiceKey) },
          { text: 'Send', onPress: () => void handlePendingVoiceRecovery(uri) },
        ]
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, pendingVoiceKey]);

  // OP-4: save clip URI to AsyncStorage before upload begins
  const handleRecordingFinalized = useCallback((clip: RecordedClip) => {
    void AsyncStorage.setItem(pendingVoiceKey, clip.uri);
  }, [pendingVoiceKey]);

  const handlePendingVoiceRecovery = useCallback(async (uri: string) => {
    await handleVoiceUpload(uri, 'audio/m4a', 'ops-voice-recovery.m4a');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVoiceUpload = useCallback(async (uri: string, mimeType: string, fileName: string) => {
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append('audio', { uri, type: mimeType, name: fileName } as unknown as Blob);
      form.append('kind', activeOp.kind);
      if (groupSlugParam) form.append('group_slug', groupSlugParam);

      await axiosInstance.post('/api/console/hub/captures/voice/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      void queryClient.invalidateQueries({ queryKey: ['console', 'hub-captures'] });
      void queryClient.invalidateQueries({ queryKey: ['console', 'orientation'] });
      void AsyncStorage.removeItem(pendingVoiceKey);
    } catch {
      Alert.alert('Upload failed', 'Could not send the recording. Please try again.');
    } finally {
      setTranscribing(false);
    }
  }, [activeOp.kind, groupSlugParam, queryClient, pendingVoiceKey]);

  // CaptureDock submit handlers
  const handleSubmitText = useCallback(async (text: string) => {
    await axiosInstance.post('/api/console/hub/captures/', {
      kind: activeOp.kind,
      body: text,
      group_slug: groupSlugParam ?? undefined,
    });
    void queryClient.invalidateQueries({ queryKey: ['console', 'hub-captures'] });
    void queryClient.invalidateQueries({ queryKey: ['console', 'orientation'] });
  }, [activeOp.kind, groupSlugParam, queryClient]);

  const handleSubmitVoice = useCallback(async (clip: RecordedClip) => {
    await handleVoiceUpload(clip.uri, clip.mimeType, clip.fileName);
  }, [handleVoiceUpload]);

  return (
    <View style={styles.container}>
      {!actionFocused && <CrossroadsHeader routeLabel="operations" />}

      {/* ── Group selector ─────────────────────────────────────────── */}
      <View style={styles.selectorSection}>
        <Text style={styles.selectorLabel}>Group</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {groupOptions.map((g) => {
            const active = g.slug === selectedGroupSlug;
            return (
              <Pressable
                key={g.slug}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => handleSelectGroup(g.slug)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {g.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Op type selector ───────────────────────────────────────── */}
      <View style={styles.selectorSection}>
        <Text style={styles.selectorLabel}>What are you capturing?</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {OPS.map((op, index) => {
            const active = index === selectedOpIndex;
            return (
              <Pressable
                key={`${op.kind}-${index}`}
                style={[
                  styles.opChip,
                  active && { backgroundColor: op.color, borderColor: op.color },
                ]}
                onPress={() => handleSelectOp(index)}
              >
                <Ionicons
                  name={op.icon}
                  size={14}
                  color={active ? '#FFFFFF' : op.color}
                />
                <Text style={[styles.opChipText, active && styles.opChipTextActive, !active && { color: op.color }]}>
                  {op.buttonText}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Recent ops + capture dock ──────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Context bar with emblem */}
        <Animated.View style={[styles.contextBar, { opacity: emblemOpacity }]}>
          <GroupEmblem group={activeGroup.slug === '__personal__' ? null : activeGroup as Group} />
          <View>
            <Text style={styles.contextGroupName}>{activeGroup.title}</Text>
            <Text style={[styles.contextOpLabel, { color: activeOp.color }]}>
              {activeOp.buttonText}
            </Text>
          </View>
        </Animated.View>

        <FlatList
          data={captures}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          inverted
          refreshControl={
            <RefreshControl
              refreshing={capturesLoading}
              onRefresh={() => void refetch()}
              tintColor="#0E5AA7"
            />
          }
          ListEmptyComponent={
            capturesLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color="#0E5AA7" />
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Nothing here yet</Text>
                <Text style={styles.emptySubtitle}>
                  Use the field below to capture your first {activeOp.label.toLowerCase()} item.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <OpsItemRow
              item={item}
              opConfig={activeOp}
              onResolve={(id) => resolveCapture.mutate(id)}
            />
          )}
        />

        {transcribing && (
          <View style={styles.transcribingBanner}>
            <ActivityIndicator size="small" color="#0E5AA7" />
            <Text style={styles.transcribingText}>Transcribing your recording…</Text>
          </View>
        )}

        <View style={styles.dockWrap}>
          <CaptureDock
            draftStorageKey={draftKey}
            placeholder={activeOp.placeholder}
            kickerLabel="Operations"
            kickerSub={activeOp.buttonText}
            onSubmitText={handleSubmitText}
            onSubmitVoice={handleSubmitVoice}
            onRecordingFinalized={handleRecordingFinalized}
            onFocusChange={setActionFocused}
            isSubmittingVoice={transcribing}
          />
        </View>
      </KeyboardAvoidingView>

    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4F8',
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  // Selectors
  selectorSection: {
    marginBottom: 8,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6A7785',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E0EA',
  },
  chipActive: {
    backgroundColor: '#0E5AA7',
    borderColor: '#0E5AA7',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#435261',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  opChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D7E0EA',
  },
  opChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#435261',
  },
  opChipTextActive: {
    color: '#FFFFFF',
  },

  // Body (list + dock)
  body: {
    flex: 1,
  },

  // Context bar
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    marginBottom: 4,
  },
  emblem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  contextGroupName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#13293D',
  },
  contextOpLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // List
  listContent: {
    flexGrow: 1,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#E6EDF3',
    marginHorizontal: 16,
  },
  centerState: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#13293D',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#627181',
    textAlign: 'center',
  },

  // Ops item rows
  opsRow: {
    padding: 14,
    gap: 6,
  },
  opsRowResolved: {
    opacity: 0.45,
  },
  opsRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  opsRowKind: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  opsRowTime: {
    fontSize: 12,
    color: '#6A7785',
  },
  opsRowBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  opsRowText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#13293D',
  },
  opsRowTextResolved: {
    textDecorationLine: 'line-through',
    color: '#6A7785',
  },
  resolveBtn: {
    padding: 2,
    flexShrink: 0,
  },

  // Dock
  dockWrap: {
    paddingTop: 8,
    paddingBottom: 4,
  },

  // Transcribing banner
  transcribingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EEF4F8',
  },
  transcribingText: {
    fontSize: 13,
    color: '#435261',
    fontWeight: '600',
  },

  buttonDisabled: {
    opacity: 0.45,
  },
});
