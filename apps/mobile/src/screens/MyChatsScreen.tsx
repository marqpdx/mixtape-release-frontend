import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { ConversationListPanel } from '../components/messages/ConversationListPanel';
import { CrossroadsHeader } from '../components/CrossroadsHeader';

export default function MyChatsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <CrossroadsHeader routeLabel="messages" />
      </View>
      <ConversationListPanel
        onOpenConversation={(conversationId, title) => {
          navigation.navigate('Chat', { conversationId, title });
        }}
        onOpenNewChat={() => navigation.navigate('NewPersonalChat')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4F8',
  },
  headerWrap: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
});
