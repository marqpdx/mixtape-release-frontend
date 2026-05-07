// apps/mobile/src/screens/HubCaptureScreen.tsx
//
// CS-M8: Fast raw-material capture via HubCapture API.
// Kind picker → body input → optional scope/remind_at → POST.
// Also shows open captures with resolve action and pull-to-refresh.

import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { useHubCaptures, useResolveCapture } from '@mixtape/api/hooks/console/useConsole';
import { fetchHubCaptures, HubCaptureKind } from '@mixtape/api/clients/console/consoleApi';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import { useQueryClient } from '@tanstack/react-query';
import { useOrientation } from '@mixtape/api/hooks/console/useConsole';

// ---------------------------------------------------------------------------
// Kind config
// ---------------------------------------------------------------------------

type KindConfig = {
  kind: HubCaptureKind;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  placeholder: string;
};

const KINDS: KindConfig[] = [
  { kind: 'fix',       label: "Let's Fix",    icon: 'construct-outline', color: '#C0392B', placeholder: "What needs fixing?" },
  { kind: 'need_more', label: 'Need More',     icon: 'cart-outline',      color: '#0E5AA7', placeholder: "What do we need more of?" },
  { kind: 'remind',    label: 'Remind Me',     icon: 'alarm-outline',     color: '#8A6B00', placeholder: "Remind me to…" },
  { kind: 'note',      label: 'Note',          icon: 'pencil-outline',    color: '#2E7D52', placeholder: "Capture a note…" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KindPill({
  config,
  selected,
  onPress,
}: {
  config: KindConfig;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.kindPill, selected && { backgroundColor: config.color, borderColor: config.color }]}
      onPress={onPress}
      hitSlop={4}
    >
      <Ionicons name={config.icon} size={16} color={selected ? '#FFFFFF' : config.color} />
      <Text style={[styles.kindPillLabel, selected && { color: '#FFFFFF' }]}>{config.label}</Text>
    </Pressable>
  );
}

function CaptureCard({
  body,
  kind,
  createdAt,
  onResolve,
}: {
  body: string;
  kind: HubCaptureKind;
  createdAt: string;
  onResolve: () => void;
}) {
  const cfg = KINDS.find((k) => k.kind === kind) ?? KINDS[0];
  const date = new Date(createdAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <View style={styles.captureCard}>
      <View style={styles.captureCardRow}>
        <View style={[styles.kindDot, { backgroundColor: cfg.color }]} />
        <Text style={styles.captureBody} numberOfLines={3}>{body}</Text>
        <Pressable onPress={onResolve} hitSlop={8} style={styles.resolveBtn}>
          <Ionicons name="checkmark-circle-outline" size={22} color="#2E7D52" />
        </Pressable>
      </View>
      <Text style={styles.captureMeta}>{cfg.label} · {dateLabel}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function HubCaptureScreen() {
  const queryClient = useQueryClient();
  const { data: orientation } = useOrientation();

  const [selectedKind, setSelectedKind] = useState<HubCaptureKind>('fix');
  const [body, setBody] = useState('');
  const [groupSlug, setGroupSlug] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const activeCfg = KINDS.find((k) => k.kind === selectedKind) ?? KINDS[0];
  const groups = orientation?.groups ?? [];

  const { data: captureData, isLoading, refetch } = useHubCaptures(selectedKind, groupSlug ?? undefined);
  const resolveCapture = useResolveCapture();

  const captures = captureData?.captures ?? [];

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await axiosInstance.post('/api/console/hub/captures/', {
        kind: selectedKind,
        body: trimmed,
        group_slug: groupSlug ?? undefined,
      });
      setBody('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
      void queryClient.invalidateQueries({ queryKey: ['console', 'hub-captures'] });
      void queryClient.invalidateQueries({ queryKey: ['console', 'orientation'] });
    } catch {
      setSubmitError('Could not save. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <CrossroadsHeader routeLabel="capture" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => void refetch()} tintColor="#0E5AA7" />
        }
      >
        {/* Kind picker */}
        <View style={styles.kindRow}>
          {KINDS.map((cfg) => (
            <KindPill
              key={cfg.kind}
              config={cfg}
              selected={selectedKind === cfg.kind}
              onPress={() => setSelectedKind(cfg.kind)}
            />
          ))}
        </View>

        {/* Capture input */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.bodyInput}
            value={body}
            onChangeText={setBody}
            placeholder={activeCfg.placeholder}
            placeholderTextColor="#9AACBA"
            multiline
            returnKeyType="default"
            autoCorrect
          />

          {/* Scope picker — only show if user is in groups */}
          {groups.length > 0 && (
            <View style={styles.scopeRow}>
              <TouchableOpacity
                style={[styles.scopeChip, !groupSlug && styles.scopeChipActive]}
                onPress={() => setGroupSlug(null)}
              >
                <Text style={[styles.scopeChipText, !groupSlug && styles.scopeChipTextActive]}>
                  Personal
                </Text>
              </TouchableOpacity>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.slug}
                  style={[styles.scopeChip, groupSlug === g.slug && styles.scopeChipActive]}
                  onPress={() => setGroupSlug(g.slug)}
                >
                  <Text
                    style={[styles.scopeChipText, groupSlug === g.slug && styles.scopeChipTextActive]}
                    numberOfLines={1}
                  >
                    {g.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {submitError ? (
            <Text style={styles.errorText}>{submitError}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: activeCfg.color },
              (!body.trim() || submitting) && styles.submitBtnDisabled,
            ]}
            onPress={() => void handleSubmit()}
            disabled={!body.trim() || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : submitted ? (
              <Text style={styles.submitBtnText}>Captured ✓</Text>
            ) : (
              <Text style={styles.submitBtnText}>Capture</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Open captures list */}
        {captures.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.listHeading}>Open</Text>
            {captures.map((c) => (
              <CaptureCard
                key={c.id}
                body={c.body}
                kind={c.kind}
                createdAt={c.created_at}
                onResolve={() => resolveCapture.mutate(c.id)}
              />
            ))}
          </View>
        )}

        {!isLoading && captures.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No open {activeCfg.label.toLowerCase()} captures.</Text>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
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
  scroll: {
    gap: 14,
    paddingBottom: 32,
  },

  // Kind picker
  kindRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kindPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D7E0EA',
    backgroundColor: '#FFFFFF',
  },
  kindPillLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#435261',
  },

  // Input card
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 12,
  },
  bodyInput: {
    fontSize: 16,
    color: '#13293D',
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 22,
  },

  // Scope
  scopeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scopeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#EEF4F8',
    borderWidth: 1,
    borderColor: '#D7E0EA',
    maxWidth: 140,
  },
  scopeChipActive: {
    backgroundColor: '#0E5AA7',
    borderColor: '#0E5AA7',
  },
  scopeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#435261',
  },
  scopeChipTextActive: {
    color: '#FFFFFF',
  },

  // Submit
  submitBtn: {
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
  },

  // Captures list
  listSection: {
    gap: 8,
  },
  listHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6A7785',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  captureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 6,
  },
  captureCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  kindDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  captureBody: {
    flex: 1,
    fontSize: 15,
    color: '#13293D',
    lineHeight: 20,
  },
  resolveBtn: {
    padding: 2,
    flexShrink: 0,
  },
  captureMeta: {
    fontSize: 11,
    color: '#9AACBA',
    marginLeft: 18,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#9AACBA',
  },
  bottomPad: {
    height: 16,
  },
});
