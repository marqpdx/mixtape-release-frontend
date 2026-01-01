import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from '../screens/LoginScreen';
import MyChatsScreen from '../screens/MyChatsScreen';
import GroupListScreen from '../screens/GroupListScreen';
import GroupConversationsScreen from '../screens/GroupConversationsScreen';
import NewPersonalChatScreen from '../screens/NewPersonalChatScreen';
import NewGroupChatScreen from '../screens/NewGroupChatScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ChatStateManager } from '../components/ChatStateManager';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Chat: { conversationId: string; title?: string };
  NewPersonalChat: undefined;
  GroupConversations: { groupSlug: string; groupName: string };
  NewGroupChat: { groupSlug: string; groupName: string };
};

export type MainTabParamList = {
  MyChats: undefined;
  Groups: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ============================================================================
// TAB NAVIGATOR
// ============================================================================

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="MyChats"
        component={MyChatsScreen}
        options={{
          title: 'My Chats',
          tabBarLabel: 'Chats',
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupListScreen}
        options={{
          title: 'Groups',
          tabBarLabel: 'Groups',
        }}
      />
    </Tab.Navigator>
  );
}

// ============================================================================
// ROOT NAVIGATOR
// ============================================================================

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <NavigationContainer>
      {/* Chat state manager - handles real-time updates when authenticated */}
      {isAuthenticated && <ChatStateManager />}

      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <RootStack.Screen name="Login">
            {() => <LoginScreen onLoginSuccess={handleLoginSuccess} />}
          </RootStack.Screen>
        ) : (
          <>
            <RootStack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
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
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
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
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
