// apps/mobile/src/navigation/AppNavigator.tsx

import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import MyChatsScreen from '../screens/MyChatsScreen';
import GroupListScreen from '../screens/GroupListScreen';
import GroupConversationsScreen from '../screens/GroupConversationsScreen';
import NewPersonalChatScreen from '../screens/NewPersonalChatScreen';
import NewGroupChatScreen from '../screens/NewGroupChatScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ChatStateManager } from '../components/ChatStateManager';
import LandingScreen from '../screens/LandingScreen';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type RootStackParamList = {
  Login: undefined;
  Landing: undefined;
  Messages: undefined;
  Groups: undefined;
  Chat: { conversationId: string; title?: string };
  NewPersonalChat: undefined;
  GroupConversations: { groupSlug: string; groupName: string };
  NewGroupChat: { groupSlug: string; groupName: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

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
              name="Landing"
              component={LandingScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="Messages"
              component={MyChatsScreen}
              options={{
                headerShown: true,
                title: 'Messages',
              }}
            />
            <RootStack.Screen
              name="Groups"
              component={GroupListScreen}
              options={{
                headerShown: true,
                title: 'Groups',
              }}
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
