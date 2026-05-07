// apps/mobile/src/screens/BusinessHubScreen.tsx
//
// Small business hub — Reminders, Fix List, Need More, and quick-fire verb tiles.
// Scoped to a single group at a time; shows a group picker if the user admins > 1.

import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useUserGroups } from '@mixtape/api/hooks/groups/useGroups';
import { useFixItems, useSupplyRequests, useUpdateFixItem, useUpdateSupplyRequest } from '@mixtape/api/hooks/business/useBusiness';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import type { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import type { FixItem, FixItemStatus, SupplyRequest, SupplyRequestStatus } from '@mixtape/api/clients/business/businessApi';
import type { Group } from '@mixtape/core/types/groupTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAdminOfGroup(group: Group): boolean {
  return Array.isArray(group.user_roles) && group.user_roles.includes('admin');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && count > 0 && (
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyCardText}>{message}</Text>
    </View>
  );
}

function FixItemCard({
  item,
  onMarkResolved,
}: {
  item: FixItem;
  onMarkResolved: (id: string) => void;
}) {
  const isResolved = item.status === 'resolved';
  return (
    <View style={[styles.card, isResolved && styles.cardResolved]}>
      <View style={styles.cardRow}>
        <Text style={[styles.cardTitle, isResolved && styles.cardTitleResolved]} numberOfLines={2}>
          {item.title}
        </Text>
        {!isResolved && (
          <Pressable
            style={styles.resolveBtn}
            onPress={() => onMarkResolved(item.id)}
            hitSlop={8}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color="#2E7D52" />
          </Pressable>
        )}
      </View>
      {item.description ? (
        <Text style={styles.cardBody} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <Text style={styles.cardMeta}>{formatDate(item.created_at)}</Text>
    </View>
  );
}

function SupplyRequestCard({
  item,
  onMarkOrdered,
  onMarkReceived,
}: {
  item: SupplyRequest;
  onMarkOrdered: (id: string) => void;
  onMarkReceived: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.item_name}</Text>
          {item.quantity_note ? (
            <Text style={styles.cardSubtitle}>{item.quantity_note}</Text>
          ) : null}
          {item.supplier_name ? (
            <Text style={styles.cardSupplier}>from {item.supplier_name}</Text>
          ) : null}
        </View>
        <View style={styles.statusBadgeWrap}>
          <Text style={[styles.statusBadge, item.status === 'ordered' && styles.statusOrdered, item.status === 'received' && styles.statusReceived]}>
            {item.status}
          </Text>
        </View>
      </View>
      {item.status === 'pending' && (
        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={() => onMarkOrdered(item.id)}>
            <Text style={styles.actionBtnText}>Mark ordered</Text>
          </Pressable>
        </View>
      )}
      {item.status === 'ordered' && (
        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={() => onMarkReceived(item.id)}>
            <Text style={styles.actionBtnText}>Mark received</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.cardMeta}>{formatDate(item.created_at)}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Quick-fire verb tiles
// ---------------------------------------------------------------------------

const VERB_TILES: { label: string; prefix: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Remind me…', prefix: 'remind me ', icon: 'alarm-outline' },
  { label: "Let's fix…", prefix: "let's fix ", icon: 'construct-outline' },
  { label: 'We need more…', prefix: 'we need more ', icon: 'cart-outline' },
];

function VerbTile({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.verbTile} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#0E5AA7" />
      <Text style={styles.verbTileLabel}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Group picker (shown only when user admins > 1 group)
// ---------------------------------------------------------------------------

function GroupPicker({
  groups,
  selectedSlug,
  onSelect,
}: {
  groups: Group[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.groupPickerScroll}
      contentContainerStyle={styles.groupPickerContent}
    >
      {groups.map((g) => (
        <Pressable
          key={g.slug}
          style={[styles.groupChip, g.slug === selectedSlug && styles.groupChipActive]}
          onPress={() => onSelect(g.slug)}
        >
          <Text
            style={[styles.groupChipText, g.slug === selectedSlug && styles.groupChipTextActive]}
            numberOfLines={1}
          >
            {g.title}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function BusinessHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { groups, isLoading: groupsLoading } = useUserGroups();
  const adminGroups = groups.filter(isAdminOfGroup);

  const firstSlug = adminGroups[0]?.slug ?? groups[0]?.slug ?? null;
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const activeSlug = selectedSlug ?? firstSlug;

  const {
    data: fixItems = [],
    isLoading: fixLoading,
    refetch: refetchFix,
  } = useFixItems(activeSlug);

  const {
    data: supplyRequests = [],
    isLoading: supplyLoading,
    refetch: refetchSupply,
  } = useSupplyRequests(activeSlug);

  const { mutate: updateFix } = useUpdateFixItem(activeSlug ?? '');
  const { mutate: updateSupply } = useUpdateSupplyRequest(activeSlug ?? '');

  const isLoading = groupsLoading || fixLoading || supplyLoading;
  const isRefreshing = fixLoading || supplyLoading;

  const handleRefresh = () => {
    void refetchFix();
    void refetchSupply();
  };

  const handleVerbTile = (prefix: string) => {
    // Navigate to Capture tab for quick HubCapture entry
    navigation.navigate('MainTabs', { screen: 'Capture' });
  };

  const handleMarkFixResolved = (id: string) => {
    updateFix({ fixItemId: id, status: 'resolved' });
  };

  const handleMarkOrdered = (id: string) => {
    updateSupply({ requestId: id, status: 'ordered' });
  };

  const handleMarkReceived = (id: string) => {
    updateSupply({ requestId: id, status: 'received' });
  };

  const showGroupPicker = adminGroups.length > 1;
  const activeGroup = (adminGroups.length > 0 ? adminGroups : groups).find(
    (g) => g.slug === activeSlug,
  );

  if (!isLoading && groups.length === 0) {
    return (
      <View style={styles.container}>
        <CrossroadsHeader routeLabel="hub" />
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>No groups yet</Text>
          <Text style={styles.centerBody}>Join or create a group to use the hub.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CrossroadsHeader routeLabel="hub" />

      {showGroupPicker && activeSlug && (
        <GroupPicker
          groups={adminGroups}
          selectedSlug={activeSlug}
          onSelect={setSelectedSlug}
        />
      )}

      {activeGroup && (
        <Text style={styles.activeGroupLabel}>{activeGroup.title}</Text>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#0E5AA7" />
        }
      >
        {/* Quick-fire verb tiles */}
        <View style={styles.verbRow}>
          {VERB_TILES.map((tile) => (
            <VerbTile
              key={tile.label}
              label={tile.label}
              icon={tile.icon}
              onPress={() => handleVerbTile(tile.prefix)}
            />
          ))}
        </View>

        {/* Fix List */}
        <SectionHeader title="Fix List" count={fixItems.length} />
        {fixLoading ? (
          <ActivityIndicator style={styles.loader} color="#0E5AA7" />
        ) : fixItems.length === 0 ? (
          <EmptyCard message={"Nothing on the fix list. Say \"Let's fix...\" to add one."} />
        ) : (
          fixItems.map((item) => (
            <FixItemCard
              key={item.id}
              item={item}
              onMarkResolved={handleMarkFixResolved}
            />
          ))
        )}

        {/* Need More / Supply Requests */}
        <SectionHeader title="Need More" count={supplyRequests.filter((r) => r.status !== 'received').length} />
        {supplyLoading ? (
          <ActivityIndicator style={styles.loader} color="#0E5AA7" />
        ) : supplyRequests.length === 0 ? (
          <EmptyCard message='Nothing on the order list. Say "We need more..." to add one.' />
        ) : (
          supplyRequests.map((item) => (
            <SupplyRequestCard
              key={item.id}
              item={item}
              onMarkOrdered={handleMarkOrdered}
              onMarkReceived={handleMarkReceived}
            />
          ))
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
  activeGroupLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6A7785',
    marginBottom: 10,
    marginTop: 2,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 32,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#13293D',
  },
  centerBody: {
    fontSize: 14,
    color: '#6A7785',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 16,
  },

  // Group picker
  groupPickerScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  groupPickerContent: {
    gap: 8,
    paddingBottom: 4,
  },
  groupChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D7E0EA',
  },
  groupChipActive: {
    backgroundColor: '#0E5AA7',
    borderColor: '#0E5AA7',
  },
  groupChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#435261',
  },
  groupChipTextActive: {
    color: '#FFFFFF',
  },

  // Verb tiles
  verbRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  verbTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C9D8E6',
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  verbTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E5AA7',
    textAlign: 'center',
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#13293D',
  },
  sectionBadge: {
    backgroundColor: '#D7E0EA',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#435261',
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 4,
  },
  cardResolved: {
    opacity: 0.55,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#13293D',
  },
  cardTitleResolved: {
    textDecorationLine: 'line-through',
    color: '#6A7785',
  },
  cardBody: {
    fontSize: 13,
    color: '#435261',
    lineHeight: 18,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6A7785',
  },
  cardSupplier: {
    fontSize: 12,
    color: '#0E5AA7',
    fontWeight: '600',
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 11,
    color: '#9AACBA',
    marginTop: 2,
  },
  resolveBtn: {
    padding: 2,
  },
  statusBadgeWrap: {
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6A7785',
    backgroundColor: '#EEF4F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  statusOrdered: {
    backgroundColor: '#FFF8E1',
    color: '#8A6B00',
  },
  statusReceived: {
    backgroundColor: '#F0FBF4',
    color: '#2E7D52',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EEF4F8',
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E5AA7',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D7E0EA',
  },
  emptyCardText: {
    fontSize: 13,
    color: '#6A7785',
    lineHeight: 18,
  },
  bottomPad: {
    height: 16,
  },
});
