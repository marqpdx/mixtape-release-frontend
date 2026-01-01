// UserPicker Component
// Reusable component for searching and selecting users
// Used in new conversation creation flows

import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

export interface UserPickerUser {
  id: string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface UserPickerProps {
  users: UserPickerUser[];
  selectedUserIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  loading?: boolean;
  multiSelect?: boolean;
  excludeUserIds?: string[];
  placeholder?: string;
}

export function UserPicker({
  users,
  selectedUserIds,
  onSelectionChange,
  loading = false,
  multiSelect = true,
  excludeUserIds = [],
  placeholder = 'Search users...',
}: UserPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search and exclusions
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(
      (user) => !excludeUserIds.includes(user.id)
    );

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((user) => {
        const username = user.username?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        const firstName = user.first_name?.toLowerCase() || '';
        const lastName = user.last_name?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`.trim();

        return (
          username.includes(query) ||
          email.includes(query) ||
          fullName.includes(query)
        );
      });
    }

    return filtered;
  }, [users, searchQuery, excludeUserIds]);

  // Handle user selection
  const handleToggleUser = (userId: string) => {
    if (multiSelect) {
      // Multi-select mode
      if (selectedUserIds.includes(userId)) {
        onSelectionChange(selectedUserIds.filter((id) => id !== userId));
      } else {
        onSelectionChange([...selectedUserIds, userId]);
      }
    } else {
      // Single-select mode
      if (selectedUserIds.includes(userId)) {
        onSelectionChange([]);
      } else {
        onSelectionChange([userId]);
      }
    }
  };

  // Format user display name
  const getUserDisplayName = (user: UserPickerUser) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.username;
  };

  // Render single user row
  const renderUser = ({ item }: { item: UserPickerUser }) => {
    const isSelected = selectedUserIds.includes(item.id);
    const displayName = getUserDisplayName(item);

    return (
      <TouchableOpacity
        style={[styles.userRow, isSelected && styles.userRowSelected]}
        onPress={() => handleToggleUser(item.id)}
        activeOpacity={0.7}
      >
        {/* Avatar placeholder */}
        <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
          <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* User info */}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, isSelected && styles.userNameSelected]}>
            {displayName}
          </Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
        </View>

        {/* Checkbox */}
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* User list */}
      {filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? 'No users found matching your search'
              : 'No users available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  listContent: {
    paddingVertical: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  userRowSelected: {
    backgroundColor: '#F0F8FF',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSelected: {
    backgroundColor: '#007AFF',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
  },
  avatarTextSelected: {
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userNameSelected: {
    color: '#007AFF',
  },
  userUsername: {
    fontSize: 14,
    color: '#8E8E93',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
