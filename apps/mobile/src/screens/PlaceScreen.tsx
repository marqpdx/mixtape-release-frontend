import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { navigationRef } from '../navigation/AppNavigator';

// ============================================================================
// DISPATCH HISTORY TYPES
// Matches the backend shape: seed.dispatches.all()
// Endpoint TBD — pending Session Zero / create_dispatch service completion.
// ============================================================================

export interface SeedDispatch {
  destination_type: 'storyline' | 'message' | 'commons';
  destination_id: string;
  verb: 'copy' | 'move';
  outcome: 'delivered' | 'failed' | 'pending';
  dispatched_at: string; // ISO 8601
}

function formatDispatchAge(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// ============================================================================
// DISPATCH EMBLEM
// Shown below a zone when at least one dispatch exists for that destination_type
// ============================================================================

function DispatchEmblem({ dispatches }: { dispatches: SeedDispatch[] }) {
  if (dispatches.length === 0) return null;
  const latest = dispatches.reduce((a, b) =>
    new Date(a.dispatched_at) > new Date(b.dispatched_at) ? a : b
  );
  const label = latest.verb === 'copy' ? 'Copied' : 'Moved';
  return (
    <View style={styles.emblem}>
      <Ionicons name="checkmark-circle" size={13} color="#5CB87A" />
      <Text style={styles.emblemText}>
        {label} · {formatDispatchAge(latest.dispatched_at)}
      </Text>
    </View>
  );
}

// ============================================================================
// PLACEMENT ZONE
// ============================================================================

interface PlacementZoneProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description: string;
  color: string;
  lightColor: string;
  onCopy: (() => void) | null;
  onMove: (() => void) | null;
  pendingNote?: string; // shown when buttons are disabled, explains why
  dispatches: SeedDispatch[];
}

function PlacementZone({
  icon,
  label,
  description,
  color,
  lightColor,
  onCopy,
  onMove,
  pendingNote,
  dispatches,
}: PlacementZoneProps) {
  return (
    <View style={[styles.zone, { borderColor: color + '40' }]}>
      <View style={styles.zoneMain}>
        <View style={styles.zoneHeader}>
          <View style={[styles.zoneIconWrap, { backgroundColor: lightColor }]}>
            <Ionicons name={icon} size={22} color={color} />
          </View>

          <View style={styles.zoneBody}>
            <Text style={styles.zoneLabel}>{label}</Text>
            <Text style={styles.zoneDesc}>{description}</Text>
          </View>

          <View style={styles.zoneActions}>
            <TouchableOpacity
              style={[styles.actionButton, onCopy ? { backgroundColor: lightColor } : styles.actionButtonDimmed]}
              onPress={onCopy ?? undefined}
              disabled={!onCopy}
              activeOpacity={0.75}
            >
              <Text style={[styles.actionLabel, onCopy ? { color } : styles.actionLabelDimmed]}>
                Copy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, onMove ? { backgroundColor: lightColor } : styles.actionButtonDimmed]}
              onPress={onMove ?? undefined}
              disabled={!onMove}
              activeOpacity={0.75}
            >
              <Text style={[styles.actionLabel, onMove ? { color } : styles.actionLabelDimmed]}>
                Move
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {pendingNote ? (
          <Text style={styles.pendingNote}>{pendingNote}</Text>
        ) : null}

        <DispatchEmblem dispatches={dispatches} />
      </View>
    </View>
  );
}

// ============================================================================
// SCREEN
// ============================================================================

export default function PlaceScreen() {
  // TODO: Wire to a selected Seed once Seed selection flow is built.
  // Dispatch history comes from GET /api/writing/seeds/<id>/dispatches/ (endpoint TBD).
  // For now all zones show empty dispatch history.
  const dispatches: SeedDispatch[] = [];

  const messageDispatches = dispatches.filter((d) => d.destination_type === 'message');
  const storylineDispatches = dispatches.filter((d) => d.destination_type === 'storyline');
  const commonsDispatches = dispatches.filter((d) => d.destination_type === 'commons');

  return (
    <View style={styles.container}>
      <CrossroadsHeader routeLabel="place" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Place a Seed</Text>
        <Text style={styles.subheading}>
          Choose a destination. Copy keeps the original; Move releases it.
        </Text>

        <PlacementZone
          label="Message"
          icon="chatbubble-ellipses-outline"
          description="Send directly to a person or group conversation."
          color="#0E5AA7"
          lightColor="#EAF2FB"
          onCopy={() => navigationRef.isReady() && navigationRef.navigate('MainTabs', { screen: 'Connect' })}
          onMove={() => navigationRef.isReady() && navigationRef.navigate('MainTabs', { screen: 'Connect' })}
          dispatches={messageDispatches}
        />

        <PlacementZone
          label="Storyline"
          icon="layers-outline"
          description="Shape into a Leaf and publish to your Storyline or a Group."
          color="#4A6B42"
          lightColor="#EDF5EB"
          // Disabled until Leaf draft creation endpoint is available.
          // On tap: POST to Leaf draft endpoint with Seed content → navigate to Storyline with draft ID.
          // See features/groups/group-storyline-implementation.md + backend Leaf+LeafPlacement model.
          onCopy={null}
          onMove={null}
          pendingNote="Coming soon — will open Storyline with a pre-filled draft."
          dispatches={storylineDispatches}
        />

        <PlacementZone
          label="Commons"
          icon="globe-outline"
          description="Contribute to the shared, publicly visible mosaic."
          color="#7B4FA6"
          lightColor="#F3EDFB"
          onCopy={null}
          onMove={null}
          pendingNote="Coming soon."
          dispatches={commonsDispatches}
        />

        {/* Seed preview anchor */}
        <View style={styles.previewCard}>
          <View style={styles.previewRow}>
            <Ionicons name="leaf-outline" size={16} color="#7A8B99" />
            <Text style={styles.previewLabel}>Seed preview</Text>
          </View>
          <Text style={styles.previewPlaceholder}>
            Select a Seed from Notebook to place it here.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4F8',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#13293D',
    marginBottom: 2,
  },
  subheading: {
    fontSize: 13,
    color: '#6A7785',
    marginBottom: 4,
  },
  zone: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  zoneMain: {
    gap: 10,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zoneIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  zoneBody: {
    flex: 1,
    gap: 2,
  },
  zoneLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#13293D',
  },
  zoneDesc: {
    fontSize: 12,
    color: '#6A7785',
    lineHeight: 16,
  },
  zoneActions: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionButtonDimmed: {
    backgroundColor: '#F0F3F6',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionLabelDimmed: {
    color: '#B0BEC8',
  },
  pendingNote: {
    fontSize: 11,
    color: '#9AABBA',
    fontStyle: 'italic',
    paddingLeft: 2,
  },
  emblem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  emblemText: {
    fontSize: 12,
    color: '#5CB87A',
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A8B99',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  previewPlaceholder: {
    fontSize: 13,
    color: '#9AABBA',
    fontStyle: 'italic',
  },
});
