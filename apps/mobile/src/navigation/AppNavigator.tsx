// apps/mobile/src/navigation/AppNavigator.tsx

import { useRef, useEffect, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useNotifications } from '../hooks/useNotifications';
import { ChatStateManager } from '../components/ChatStateManager';
import LoginScreen from '../screens/LoginScreen';
import NotebookScreen from '../screens/NotebookScreen';
import StudioScreen from '../screens/StudioScreen';
import MyChatsScreen from '../screens/MyChatsScreen';
import ListsScreen from '../screens/ListsScreen';
import BuildScreen from '../screens/BuildScreen';
import OpsScreen from '../screens/OpsScreen';
import ConsoleScreen from '../screens/ConsoleScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GroupConversationsScreen from '../screens/GroupConversationsScreen';
import NewPersonalChatScreen from '../screens/NewPersonalChatScreen';
import NewGroupChatScreen from '../screens/NewGroupChatScreen';
import { ChatScreen } from '../screens/ChatScreen';
import ThreadDetailScreen from '../screens/ThreadDetailScreen';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Tab order reflects ADR-0048's member-motivation gradient: capture for self →
// share outward → connect with others → don't forget actionables → develop ideas.
export type MainTabParamList = {
  Notebook: undefined;
  Storyline: undefined;
  Connect: undefined;
  Lists: undefined;
  Build: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Profile: undefined;
  Console: undefined;
  Ops: undefined;
  Chat: { conversationId: string; title?: string };
  NewPersonalChat: undefined;
  GroupConversations: { groupSlug: string; groupName: string };
  NewGroupChat: { groupSlug: string; groupName: string };
  ThreadDetail: { forumSlug: string; discussionSlug: string; title: string; forumName: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// ============================================================================
// BOTTOM TAB NAVIGATOR
// ============================================================================

// ADR-0048 D2: the app remembers the last visited primary tab.
const LAST_TAB_KEY = 'mixtape.mobile.lastTab';
const TAB_NAMES = ['Notebook', 'Storyline', 'Connect', 'Lists', 'Build'] as const;
type TabName = (typeof TAB_NAMES)[number];

function isTabName(value: string | null): value is TabName {
  return value !== null && (TAB_NAMES as readonly string[]).includes(value);
}

function persistLastTab(name: TabName) {
  void AsyncStorage.setItem(LAST_TAB_KEY, name);
}

function MainTabs() {
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);
  const [initialRouteName, setInitialRouteName] = useState<TabName | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(LAST_TAB_KEY).then((value) => {
      setInitialRouteName(isTabName(value) ? value : 'Notebook');
    });
  }, []);

  if (!initialRouteName) {
    return null;
  }

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
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
          // Restored original Ionicons (2026-06-24) — kept Lists on Ionicons
          // too (was Lucide sticky-note from MX-V3) so the whole bar stays
          // on one icon set/stroke weight. Revisit once built and reviewed.
          const icons: Record<string, [string, string]> = {
            Notebook: ['book', 'book-outline'],
            Storyline: ['image', 'image-outline'],
            Connect: ['chatbubble', 'chatbubble-outline'],
            Lists: ['list', 'list-outline'],
            Build: ['hammer', 'hammer-outline'],
          };
          const [activeIcon, inactiveIcon] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          const iconName = (focused ? activeIcon : inactiveIcon) as keyof typeof Ionicons.glyphMap;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Notebook"
        component={NotebookScreen}
        listeners={{ focus: () => persistLastTab('Notebook') }}
      />
      <Tab.Screen
        name="Storyline"
        component={StudioScreen}
        listeners={{ focus: () => persistLastTab('Storyline') }}
      />
      <Tab.Screen
        name="Connect"
        component={MyChatsScreen}
        options={{
          tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined,
        }}
        listeners={{ focus: () => persistLastTab('Connect') }}
      />
      <Tab.Screen
        name="Lists"
        component={ListsScreen}
        listeners={{ focus: () => persistLastTab('Lists') }}
      />
      <Tab.Screen
        name="Build"
        component={BuildScreen}
        listeners={{ focus: () => persistLastTab('Build') }}
      />
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
              name="Profile"
              component={ProfileScreen}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            {/* Console/Ops moved off the primary tab bar under ADR-0048 MX-10 — reached from Profile's Tools section */}
            <RootStack.Screen
              name="Console"
              component={ConsoleScreen}
              options={{ headerShown: false, presentation: 'card' }}
            />
            <RootStack.Screen
              name="Ops"
              component={OpsScreen}
              options={{ headerShown: false, presentation: 'card' }}
            />
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
            <RootStack.Screen
              name="ThreadDetail"
              component={ThreadDetailScreen}
              options={{ headerShown: false, presentation: 'card' }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
