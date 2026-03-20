// screens/ChatScreen.tsx
import React from 'react';
import { useHeaderHeight } from '@react-navigation/elements';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ConversationThreadPanel } from '../components/messages/ConversationThreadPanel';

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ route }: ChatScreenProps) {
  const headerHeight = useHeaderHeight();
  return (
    <ConversationThreadPanel
      conversationId={route.params.conversationId}
      title={route.params.title}
      keyboardVerticalOffset={Math.max(headerHeight - 112, 0)}
    />
  );
}
