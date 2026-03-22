import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { CrossroadsHeader } from '../components/CrossroadsHeader';

export default function ProfileScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const initials = (currentUser?.username || '?').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
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

      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4F8',
    paddingHorizontal: 18,
    paddingTop: 18,
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
});
