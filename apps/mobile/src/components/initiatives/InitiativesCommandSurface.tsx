import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useInitiativesStore } from '../../stores/initiativesStore';
import { UniversalActionField, universalActionFieldStyles } from './UniversalActionField';
import { navigationRef } from '../../navigation/AppNavigator';
import type { InitiativeResultRouting, InitiativeSessionItem } from '../../types/initiatives';
import type { MainTabParamList } from '../../navigation/AppNavigator';

function navigateFromRouting(routing: InitiativeResultRouting) {
  if (routing.deep_link_type === 'external_url' && routing.external_url) {
    void Linking.openURL(routing.external_url);
    return;
  }

  if (!navigationRef.isReady()) return;

  if (routing.deep_link_type === 'tab' && routing.target_screen) {
    navigationRef.navigate('MainTabs', {
      screen: routing.target_screen as keyof MainTabParamList,
    });
  } else if (routing.deep_link_type === 'chat' && routing.target_params?.conversationId) {
    navigationRef.navigate('Chat', {
      conversationId: routing.target_params.conversationId,
      title: routing.target_params.title,
    });
  } else if (routing.deep_link_type === 'group_conversations' && routing.target_params?.groupSlug) {
    navigationRef.navigate('GroupConversations', {
      groupSlug: routing.target_params.groupSlug,
      groupName: routing.target_params.groupName ?? '',
    });
  }
}

function handleItemPress(item: InitiativeSessionItem) {
  if (item.kind === 'result' && item.routing) {
    navigateFromRouting(item.routing);
  }
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

interface InitiativesCommandSurfaceProps {
  onFocusChange?: (focused: boolean) => void;
}

export function InitiativesCommandSurface({
  onFocusChange,
}: InitiativesCommandSurfaceProps) {
  const sessionHistory = useInitiativesStore((state) => state.sessionHistory);

  return (
    <View style={styles.container}>
      <UniversalActionField
        kicker="Initiatives"
        title="Record and do"
        subtitle="This surface is operational, not archival. Type or append voice into one shared command draft, then confirm before execution."
        placeholder="note supplier called about a Q3 price increase"
        onFocusChange={onFocusChange}
      />

      <ScrollView contentContainerStyle={styles.historyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Session History</Text>
          <Text style={styles.historySubtitle}>Operational, lightweight, and recent.</Text>
        </View>

        {sessionHistory.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No command history yet</Text>
            <Text style={styles.emptyBody}>
              The shell is ready for IM-7. Parse and confirm now use the live mobile command contract for supported verbs, while voice fallback and the remaining verbs are still follow-on work.
            </Text>
          </View>
        ) : (
          sessionHistory.map((item) => {
            const isRoutable = item.kind === 'result' && Boolean(item.routing);
            return (
              <Pressable
                key={item.id}
                onPress={isRoutable ? () => handleItemPress(item) : undefined}
                style={({ pressed }) => [
                  styles.historyCard,
                  item.tone === 'success' && styles.historyCardSuccess,
                  item.tone === 'info' && styles.historyCardInfo,
                  item.tone === 'error' && styles.historyCardError,
                  isRoutable && pressed && styles.historyCardPressed,
                ]}
              >
                <View style={styles.historyMeta}>
                  <Text style={styles.historyItemTitle}>{item.title}</Text>
                  <View style={styles.historyMetaRight}>
                    {isRoutable ? <Text style={styles.historyOpenHint}>Open →</Text> : null}
                    <Text style={styles.historyTime}>{formatTime(item.createdAt)}</Text>
                  </View>
                </View>
                <Text style={styles.historyBody}>{item.body}</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: universalActionFieldStyles.container,
  historyContent: {
    gap: 12,
    paddingBottom: 24,
  },
  historyHeader: {
    gap: 4,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#13293D',
  },
  historySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6A7785',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#13293D',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#627181',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 8,
  },
  historyCardSuccess: {
    borderColor: '#9BC8AE',
    backgroundColor: '#F5FBF7',
  },
  historyCardInfo: {
    borderColor: '#9DB6CC',
    backgroundColor: '#F4F8FB',
  },
  historyCardError: {
    borderColor: '#E1A5A5',
    backgroundColor: '#FFF5F5',
  },
  historyCardPressed: {
    opacity: 0.75,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyItemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#13293D',
  },
  historyOpenHint: {
    fontSize: 12,
    color: '#0E5AA7',
    fontWeight: '600',
  },
  historyTime: {
    fontSize: 12,
    color: '#6A7785',
  },
  historyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#435261',
  },
});
