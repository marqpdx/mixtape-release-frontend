// New Group Chat Screen
// Allows creating a new conversation within a specific group

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
import { fetchGroupMembers } from '@mixtape/api/clients/group/groupApi';
import { createConversation } from '@mixtape/api/clients/chat/chatApi';
import { useAuthStore } from '../stores/authStore';

type NewGroupChatScreenProps = NativeStackScreenProps<RootStackParamList, 'NewGroupChat'>;

export default function NewGroupChatScreen({ route, navigation }: NewGroupChatScreenProps) {
  const { groupSlug, groupName } = route.params;
  const currentUser = useAuthStore((state) => state.user);
  const [members, setMembers] = useState<UserPickerUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Load group members on mount
  useEffect(() => {
    loadGroupMembers();
  }, [groupSlug]);

  const loadGroupMembers = async () => {
    try {
      setLoading(true);
      const memberships = await fetchGroupMembers(groupSlug, { status: 'active' });
      // Map group memberships to UserPickerUser format
      const users = memberships.map((m) => ({
        id: m.member_id,
        username: m.username || '',
        email: m.email,
        first_name: m.first_name,
        last_name: m.last_name,
      }));
      setMembers(users);
    } catch (error) {
      console.error('[NewGroupChatScreen] Error loading members:', error);
      Alert.alert('Error', 'Failed to load group members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get selected user objects
  const selectedUsers = members.filter((user) => selectedUserIds.includes(user.id));

  // Handle creating conversation
  const handleCreate = async () => {
    if (selectedUserIds.length === 0) {
      Alert.alert('No members selected', 'Please select at least one member to start a conversation.');
      return;
    }

    try {
      setCreating(true);

      // Include current user in participants
      const participantIds = [...selectedUserIds];
      if (currentUser?.id && !participantIds.includes(currentUser.id)) {
        participantIds.push(currentUser.id);
      }

      // Auto-generate title
      const title = `${groupName} Chat`;

      // Create conversation
      // TODO: Need to add group context to the conversation
      const conversation = await createConversation(participantIds, title);

      // Navigate to the chat screen
      navigation.replace('Chat', {
        conversationId: conversation.slug,
        title: conversation.title,
      });
    } catch (error) {
      console.error('[NewGroupChatScreen] Error creating conversation:', error);
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
        <Text style={styles.headerTitle}>New {groupName} Chat</Text>
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
        users={members}
        selectedUserIds={selectedUserIds}
        onSelectionChange={setSelectedUserIds}
        loading={loading}
        multiSelect={true}
        excludeUserIds={currentUser?.id ? [currentUser.id] : []}
        placeholder="Search group members..."
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
    flex: 1,
    textAlign: 'center',
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
