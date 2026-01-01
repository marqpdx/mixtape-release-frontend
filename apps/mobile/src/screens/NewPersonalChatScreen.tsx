// New Personal Chat Screen
// Allows user to search and select participants for a new conversation

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { UserPicker, UserPickerUser } from '../components/UserPicker';
import { SelectedUsersPills } from '../components/SelectedUsersPills';
import { fetchUsers } from '@mixtape/api/clients/user/userApi';
import { createConversation } from '@mixtape/api/clients/chat/chatApi';
import { useAuthStore } from '../stores/authStore';

type NewPersonalChatScreenProps = NativeStackScreenProps<RootStackParamList, 'NewPersonalChat'>;

export default function NewPersonalChatScreen({ navigation }: NewPersonalChatScreenProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<UserPickerUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Load all users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await fetchUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('[NewPersonalChatScreen] Error loading users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get selected user objects
  const selectedUsers = users.filter((user) => selectedUserIds.includes(user.id));

  // Handle creating conversation
  const handleCreate = async () => {
    if (selectedUserIds.length === 0) {
      Alert.alert('No users selected', 'Please select at least one user to start a conversation.');
      return;
    }

    try {
      setCreating(true);

      // Include current user in participants
      const participantIds = [...selectedUserIds];
      if (currentUser?.id && !participantIds.includes(currentUser.id)) {
        participantIds.push(currentUser.id);
      }

      // Auto-generate title based on number of participants
      let title: string | undefined;
      if (selectedUserIds.length === 1) {
        const otherUser = users.find((u) => u.id === selectedUserIds[0]);
        title = otherUser ? `Chat with ${otherUser.username}` : undefined;
      } else {
        title = `Group chat (${selectedUserIds.length + 1} members)`;
      }

      // Create conversation
      const conversation = await createConversation(participantIds, title);

      // Navigate to the chat screen
      navigation.replace('Chat', {
        conversationId: conversation.slug,
        title: conversation.title,
      });
    } catch (error) {
      console.error('[NewPersonalChatScreen] Error creating conversation:', error);
      Alert.alert('Error', 'Failed to create conversation. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Handle removing a selected user
  const handleRemoveUser = (userId: string) => {
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Chat</Text>
        <TouchableOpacity
          onPress={handleCreate}
          style={[styles.createButton, (selectedUserIds.length === 0 || creating) && styles.createButtonDisabled]}
          disabled={selectedUserIds.length === 0 || creating}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[styles.createText, selectedUserIds.length === 0 && styles.createTextDisabled]}>
              Create
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Selected users pills */}
      <SelectedUsersPills users={selectedUsers} onRemove={handleRemoveUser} />

      {/* User picker */}
      <UserPicker
        users={users}
        selectedUserIds={selectedUserIds}
        onSelectionChange={setSelectedUserIds}
        loading={loading}
        multiSelect={true}
        excludeUserIds={currentUser?.id ? [currentUser.id] : []}
        placeholder="Search users to add..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  cancelButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  createButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  createTextDisabled: {
    color: '#C7C7CC',
  },
});
