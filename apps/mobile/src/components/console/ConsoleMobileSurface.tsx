import { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { UniversalActionField } from '../initiatives/UniversalActionField';
import { useConsoleSurface } from '../../hooks/useConsoleSurface';
import { useInitiativesStore } from '../../stores/initiativesStore';
import { useOrientation } from '@mixtape/api/hooks/console/useConsole';

function SectionCard({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionKicker}>{kicker}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

const CAPTURE_KIND_LABELS: Record<string, string> = {
  fix: "Fix",
  need_more: "Need More",
  remind: "Reminders",
  note: "Notes",
};

export function ConsoleMobileSurface({
  onActionFocusChange,
}: {
  onActionFocusChange?: (focused: boolean) => void;
}) {
  const [stewardshipExpanded, setStewardshipExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const { data, isLoading, error, reload } = useConsoleSurface();
  const { data: orientation, refetch: refetchOrientation } = useOrientation();
  const sessionHistory = useInitiativesStore((state) => state.sessionHistory);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([reload(), refetchOrientation()]);
    setRefreshing(false);
  };

  const captureCounts = orientation?.capture_counts ?? {};
  const totalCaptures = Object.values(captureCounts).reduce((sum, n) => sum + n, 0);

  if (isLoading && !data) {
    return (
      <View style={styles.loadingCard}>
        <Text style={styles.loadingTitle}>Loading Console mobile surface...</Text>
        <Text style={styles.loadingSubtitle}>Fetching live Console layers from the control-surface endpoints.</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.loadingCard}>
        <Text style={styles.loadingTitle}>Console surface unavailable</Text>
        <Text style={styles.loadingSubtitle}>{error || 'No Console surface data returned.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor="#0E5AA7" />
      }
    >
      <SectionCard
        kicker="Re-entry"
        title="Resume momentum"
        subtitle="Recent, in-progress, and open work ordered by the live re-entry feed."
      >
        <View style={styles.cardList}>
          {data.reentryItems.length === 0 ? (
            <Text style={styles.emptyText}>No re-entry items right now.</Text>
          ) : (
            data.reentryItems.map((item) => (
              <Pressable key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemKind}>{item.kind}</Text>
                  <Text style={styles.itemLink}>Resume</Text>
                </View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDetail}>{item.detail}</Text>
              </Pressable>
            ))
          )}
        </View>
      </SectionCard>

      {totalCaptures > 0 && (
        <SectionCard
          kicker="Captures"
          title="Open items"
          subtitle="Raw captures waiting to be resolved or promoted. Tap the Capture tab to add more."
        >
          <View style={styles.captureCountRow}>
            {Object.entries(captureCounts)
              .filter(([, count]) => count > 0)
              .map(([kind, count]) => (
                <View key={kind} style={styles.captureCountChip}>
                  <Text style={styles.captureCountNum}>{count}</Text>
                  <Text style={styles.captureCountLabel}>{CAPTURE_KIND_LABELS[kind] ?? kind}</Text>
                </View>
              ))}
          </View>
        </SectionCard>
      )}

      <SectionCard
        kicker="Signals"
        title="See what is pulling"
        subtitle="Grouped semantic states: /!, /~, /?, /@ plus flagged reading signals from the live aggregation feed."
      >
        <View style={styles.signalGroupList}>
          {data.signalGroups.length === 0 ? (
            <Text style={styles.emptyText}>No active signals right now.</Text>
          ) : (
            data.signalGroups.map((group) => (
              <View key={group.id} style={styles.signalCard}>
                <View style={styles.signalHeader}>
                  <Text style={styles.signalMarker}>{group.marker}</Text>
                  <Text style={styles.signalTitle}>{group.title}</Text>
                </View>
                {group.items.map((item) => (
                  <Text key={item} style={styles.signalItem}>
                    {item}
                  </Text>
                ))}
              </View>
            ))
          )}
        </View>
      </SectionCard>

      <SectionCard
        kicker="Intentions"
        title="Act from one field"
        subtitle="The Universal Action Field reuses the Initiatives verb-routing flow and stays additive to the Initiatives tab."
      >
        <UniversalActionField
          kicker="Intentions"
          title="Universal Action Field"
          subtitle="Same 8 verbs, same confirm discipline, touch-adapted for Console mobile."
          placeholder="task Maria: follow up with the linen supplier by Friday"
          helperLeft="Console action field shares Initiatives contracts"
          onFocusChange={onActionFocusChange}
        />
      </SectionCard>

      <SectionCard
        kicker="Orientation"
        title="See where gravity is active"
        subtitle="Compact initiative and group lists ordered by the live active-gravity feed."
      >
        <View style={styles.orientationWrap}>
          {data.orientationSections.map((section) => (
            <View key={section.id} style={styles.orientationBlock}>
              <Text style={styles.orientationTitle}>{section.title}</Text>
              {section.items.length === 0 ? (
                <Text style={styles.emptyText}>No items in this section right now.</Text>
              ) : (
                section.items.map((item) => (
                  <Pressable key={item.id} style={styles.orientationItem}>
                    <Text style={styles.orientationLabel}>{item.label}</Text>
                    <Text style={styles.orientationDetail}>{item.detail}</Text>
                  </Pressable>
                ))
              )}
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        kicker="Stewardship"
        title="Keep drift visible"
        subtitle="Collapsed by default. It should surface stale work without interrupting the main control surface."
      >
        <TouchableOpacity
          style={styles.stewardshipToggle}
          onPress={() => setStewardshipExpanded((value) => !value)}
          activeOpacity={0.85}
        >
          <Text style={styles.stewardshipToggleText}>
            {stewardshipExpanded ? 'Hide stewardship' : 'Show stewardship'}
          </Text>
        </TouchableOpacity>

        {stewardshipExpanded ? (
          <View style={styles.stewardshipList}>
            {data.stewardshipItems.length === 0 ? (
              <Text style={styles.emptyText}>No stewardship items right now.</Text>
            ) : (
              data.stewardshipItems.map((item) => (
                <View key={item} style={styles.stewardshipItem}>
                  <Text style={styles.stewardshipText}>{item}</Text>
                </View>
              ))
            )}
          </View>
        ) : null}
      </SectionCard>

      {/* Session history — absorbed from Initiatives tab */}
      {sessionHistory.length > 0 && (
        <SectionCard
          kicker="Commands"
          title="Session history"
          subtitle="Recent parsed commands from this session."
        >
          <TouchableOpacity
            style={styles.stewardshipToggle}
            onPress={() => setHistoryExpanded((v) => !v)}
            activeOpacity={0.85}
          >
            <Text style={styles.stewardshipToggleText}>
              {historyExpanded ? 'Hide history' : `Show ${sessionHistory.length} command${sessionHistory.length > 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>

          {historyExpanded && (
            <View style={styles.stewardshipList}>
              {sessionHistory.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.stewardshipItem,
                    item.tone === 'success' && { backgroundColor: '#F5FBF7', borderColor: '#9BC8AE' },
                    item.tone === 'error' && { backgroundColor: '#FFF5F5', borderColor: '#E1A5A5' },
                  ]}
                >
                  <Text style={[styles.stewardshipText, { fontWeight: '700' }]}>{item.title}</Text>
                  {item.body ? <Text style={styles.stewardshipText}>{item.body}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </SectionCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 28,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 8,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#13293D',
  },
  loadingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#627181',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 12,
  },
  sectionKicker: {
    color: '#315E87',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D2235',
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5F6E7D',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#627181',
  },
  cardList: {
    gap: 10,
  },
  itemCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemKind: {
    color: '#315E87',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemLink: {
    color: '#0E5AA7',
    fontSize: 12,
    fontWeight: '700',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#13293D',
  },
  itemDetail: {
    fontSize: 13,
    lineHeight: 18,
    color: '#627181',
  },
  signalGroupList: {
    gap: 10,
  },
  signalCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 8,
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  signalMarker: {
    color: '#8A5A00',
    fontSize: 13,
    fontWeight: '800',
  },
  signalTitle: {
    color: '#13293D',
    fontSize: 15,
    fontWeight: '700',
  },
  signalItem: {
    color: '#435261',
    fontSize: 14,
    lineHeight: 20,
  },
  orientationWrap: {
    gap: 12,
  },
  orientationBlock: {
    gap: 8,
  },
  orientationTitle: {
    color: '#315E87',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  orientationItem: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 4,
  },
  orientationLabel: {
    color: '#13293D',
    fontSize: 15,
    fontWeight: '700',
  },
  orientationDetail: {
    color: '#627181',
    fontSize: 13,
    lineHeight: 18,
  },
  stewardshipToggle: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#0E5AA7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stewardshipToggleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stewardshipList: {
    gap: 10,
  },
  stewardshipItem: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#E4D2A5',
  },
  stewardshipText: {
    color: '#6C5A32',
    fontSize: 14,
    lineHeight: 20,
  },
  captureCountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  captureCountChip: {
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 72,
  },
  captureCountNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E5AA7',
  },
  captureCountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#627181',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
