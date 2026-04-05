import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { useExperimentalSettings } from '../hooks/useExperimentalSettings';

export default function ProfileScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const {
    dispatchInputEnabled,
    setDispatchInputEnabled,
    messageMemoryEnabled,
    setMessageMemoryEnabled,
  } = useExperimentalSettings();

  const initials = (currentUser?.username || '?').charAt(0).toUpperCase();
  const isSuperuser = currentUser?.is_superuser === true;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <CrossroadsHeader routeLabel="profile" />

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{currentUser?.username || 'Profile'}</Text>
        {currentUser?.username ? (
          <Text style={styles.username}>@{currentUser.username}</Text>
        ) : null}
      </View>

      {/* Privacy settings — visible to all users */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsHeading}>Privacy</Text>
        <View style={styles.settingsRow}>
          <View style={styles.settingsLabel}>
            <Text style={styles.settingsName}>Message Memory</Text>
            <Text style={styles.settingsDesc}>
              Allow Mixtape to use your conversations to personalise memory and search. Off by default.
            </Text>
          </View>
          <Switch
            value={messageMemoryEnabled}
            onValueChange={(v) => { void setMessageMemoryEnabled(v); }}
            trackColor={{ false: '#C9D4DE', true: '#0E5AA7' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {isSuperuser ? (
        <View style={styles.settingsCard}>
          <Text style={styles.settingsHeading}>Experimental Features</Text>
          <View style={styles.settingsRow}>
            <View style={styles.settingsLabel}>
              <Text style={styles.settingsName}>Dispatch Input</Text>
              <Text style={styles.settingsDesc}>
                Send messages inline from the notebook with /msg @user
              </Text>
            </View>
            <Switch
              value={dispatchInputEnabled}
              onValueChange={(v) => { void setDispatchInputEnabled(v); }}
              trackColor={{ false: '#C9D4DE', true: '#0E5AA7' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      ) : null}

      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4F8',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#D7E0EA',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1B4570',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D2235',
  },
  username: {
    fontSize: 15,
    color: '#5E6E7D',
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7E0EA',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C0392B',
  },
  settingsCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 14,
  },
  settingsHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#315E87',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingsLabel: {
    flex: 1,
    gap: 3,
  },
  settingsName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#13293D',
  },
  settingsDesc: {
    fontSize: 13,
    color: '#5E6E7D',
    lineHeight: 18,
  },
});
