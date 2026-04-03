import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { MobileBeacon } from './feedback/MobileBeacon';

interface CrossroadsHeaderProps {
  routeLabel: string;
  // Guide — only Notebook uses this. Parent owns the collapsed state.
  guideExpanded?: boolean;
  onToggleGuide?: () => void;
  guideContent?: React.ReactNode;
}

export function CrossroadsHeader({
  routeLabel,
  guideExpanded,
  onToggleGuide,
  guideContent,
}: CrossroadsHeaderProps) {
  const currentUser = useAuthStore((state) => state.user);
  const canUseBeacon = Boolean(currentUser?.can_use_beacon ?? currentUser?.can_use_lighthouse);
  const isSuperuser = Boolean(currentUser?.is_superuser);
  const [beaconOpen, setBeaconOpen] = useState(false);

  const hasGuide = guideContent !== undefined && onToggleGuide !== undefined;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.brand}>Crossroads</Text>
        <Text style={styles.username}>{currentUser?.username || ''}</Text>

        {hasGuide ? (
          <TouchableOpacity
            onPress={onToggleGuide}
            activeOpacity={0.8}
            style={styles.iconButton}
          >
            <Ionicons
              name={guideExpanded ? 'information-circle' : 'information-circle-outline'}
              size={18}
              color="#9DB9D4"
            />
          </TouchableOpacity>
        ) : null}

        {canUseBeacon ? (
          <TouchableOpacity
            onPress={() => setBeaconOpen(true)}
            activeOpacity={0.8}
            style={styles.iconButton}
          >
            <Ionicons
              name="sparkles"
              size={16}
              color={isSuperuser ? '#4EC9D0' : '#5CB87A'}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {hasGuide && guideExpanded ? (
        <View style={styles.guide}>{guideContent}</View>
      ) : null}

      {canUseBeacon ? (
        <MobileBeacon
          canUseLighthouse={canUseBeacon}
          isSuperuser={isSuperuser}
          routeLabel={routeLabel}
          open={beaconOpen}
          onClose={() => setBeaconOpen(false)}
        />
      ) : null}
    </View>
  );
}

export const HEADER_BG = '#1B4570';

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: HEADER_BG,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    color: '#9DB9D4',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  username: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    padding: 2,
  },
  guide: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A5A8A',
    gap: 6,
  },
});
