// My Chats Screen - Personal conversations list

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ConversationListPanel } from '../components/messages/ConversationListPanel';

type MyChatsScreenProps = NativeStackScreenProps<RootStackParamList, 'Messages'>;

export default function MyChatsScreen({ navigation }: MyChatsScreenProps) {
  return (
    <ConversationListPanel
      onOpenConversation={(conversationId, title) => {
        navigation.navigate('Chat', {
          conversationId,
          title,
        });
      }}
      onOpenNewChat={() => navigation.navigate('NewPersonalChat')}
    />
  );
}
