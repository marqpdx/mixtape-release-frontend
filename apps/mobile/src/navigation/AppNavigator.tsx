// apps/mobile/src/navigation/AppNavigator.tsx

import { useRef, useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useNotifications } from '../hooks/useNotifications';
import { ChatStateManager } from '../components/ChatStateManager';
import LoginScreen from '../screens/LoginScreen';
import NotebookScreen from '../screens/NotebookScreen';
import StudioScreen from '../screens/StudioScreen';
import MyChatsScreen from '../screens/MyChatsScreen';
import GroupListScreen from '../screens/GroupListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GroupConversationsScreen from '../screens/GroupConversationsScreen';
import NewPersonalChatScreen from '../screens/NewPersonalChatScreen';
import NewGroupChatScreen from '../screens/NewGroupChatScreen';
import { ChatScreen } from '../screens/ChatScreen';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type MainTabParamList = {
  Notebook: undefined;
  Studio: undefined;
  Messages: undefined;
  Groups: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Chat: { conversationId: string; title?: string };
  NewPersonalChat: undefined;
  GroupConversations: { groupSlug: string; groupName: string };
  NewGroupChat: { groupSlug: string; groupName: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// ============================================================================
// BOTTOM TAB NAVIGATOR
// ============================================================================

function MainTabs() {
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0E5AA7',
        tabBarInactiveTintColor: '#6B8499',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E8F0',
          borderTopWidth: 1,
          paddingBottom: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Notebook: ['book', 'book-outline'],
            Studio: ['color-palette', 'color-palette-outline'],
            Messages: ['chatbubble', 'chatbubble-outline'],
            Groups: ['people', 'people-outline'],
            Profile: ['person-circle', 'person-circle-outline'],
          };
          const [activeIcon, inactiveIcon] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          const iconName = (focused ? activeIcon : inactiveIcon) as keyof typeof Ionicons.glyphMap;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Notebook" component={NotebookScreen} />
      <Tab.Screen name="Studio" component={StudioScreen} />
      <Tab.Screen
        name="Messages"
        component={MyChatsScreen}
        options={{
          tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined,
        }}
      />
      <Tab.Screen name="Groups" component={GroupListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ============================================================================
// ROOT NAVIGATOR
// ============================================================================

export default function AppNavigator() {
  // Read auth state from the store — LoginScreen calls authStore.setUser() on success,
  // ProfileScreen calls authStore.logout(), and the navigator responds automatically.
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Buffer notification targets that arrive before auth is confirmed (e.g. cold-start tap).
  const pendingNavigationRef = useRef<{ conversationId: string; title?: string } | null>(null);

  useNotifications((target) => {
    if (!target.conversationId) return;

    if (!navigationRef.isReady() || !isAuthenticated) {
      pendingNavigationRef.current = { conversationId: target.conversationId, title: target.title };
      return;
    }

    navigationRef.navigate('Chat', {
      conversationId: target.conversationId,
      title: target.title,
    });
  });

  // Drain buffered navigation target once auth is confirmed.
  useEffect(() => {
    if (!isAuthenticated || !pendingNavigationRef.current) return;

    const target = pendingNavigationRef.current;
    pendingNavigationRef.current = null;

    // Defer one tick to ensure NavigationContainer is ready.
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('Chat', {
          conversationId: target.conversationId,
          title: target.title,
        });
      }
    }, 0);
  }, [isAuthenticated]);

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated && <ChatStateManager />}

      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Login">
            {() => <LoginScreen onLoginSuccess={() => {}} />}
          </RootStack.Screen>
        ) : (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabs} />
            <RootStack.Screen
              name="Chat"
              component={ChatScreen}
              options={({ route }) => ({
                headerShown: true,
                title: route.params?.title || 'Chat',
                presentation: 'card',
              })}
            />
            <RootStack.Screen
              name="NewPersonalChat"
              component={NewPersonalChatScreen}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <RootStack.Screen
              name="GroupConversations"
              component={GroupConversationsScreen}
              options={({ route }) => ({
                headerShown: true,
                title: route.params?.groupName || 'Group Conversations',
                presentation: 'card',
              })}
            />
            <RootStack.Screen
              name="NewGroupChat"
              component={NewGroupChatScreen}
              options={{ headerShown: false, presentation: 'modal' }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
