// SelectedUsersPills Component
// Displays selected users as dismissible chips/pills
// Used alongside UserPicker for visual feedback

import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { UserPickerUser } from './UserPicker';

interface SelectedUsersPillsProps {
  users: UserPickerUser[];
  onRemove: (userId: string) => void;
}

export function SelectedUsersPills({ users, onRemove }: SelectedUsersPillsProps) {
  // Format user display name
  const getUserDisplayName = (user: UserPickerUser) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.username;
  };

  if (users.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {users.map((user) => (
          <View key={user.id} style={styles.pill}>
            <Text style={styles.pillText} numberOfLines={1}>
              {getUserDisplayName(user)}
            </Text>
            <TouchableOpacity
              onPress={() => onRemove(user.id)}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.removeIcon}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  scrollContent: {
    padding: 12,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 6,
    marginRight: 8,
  },
  pillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    maxWidth: 150,
  },
  removeButton: {
    marginLeft: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});
