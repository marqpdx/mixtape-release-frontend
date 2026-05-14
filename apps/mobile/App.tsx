// IMPORTANT: Import env config first to set up environment variables
import './src/config/env';

import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { checkAuth, initializeCsrf } from '@mixtape/api/clients/auth/api';
import AppNavigator from './src/navigation/AppNavigator';
import { QueryProvider } from './src/providers/QueryProvider';
import { useAuthStore } from './src/stores/authStore';

export default function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const [isBootstrappingAuth, setIsBootstrappingAuth] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrapAuth = async () => {
      try {
        await initializeCsrf();
        const user = await checkAuth();

        if (!active) return;
        setUser(user);
      } catch (error) {
        console.error('Error bootstrapping auth:', error);
        if (!active) return;
        setUser(null);
      } finally {
        if (active) {
          setIsBootstrappingAuth(false);
        }
      }
    };

    void bootstrapAuth();

    return () => {
      active = false;
    };
  }, [setUser]);

  try {
    return (
      <QueryProvider>
        <SafeAreaProvider>
          {isBootstrappingAuth ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Loading Mixtape…</Text>
            </View>
          ) : (
            <View style={styles.container}>
              <AppNavigator />
            </View>
          )}
        </SafeAreaProvider>
      </QueryProvider>
    );
  } catch (error) {
    console.error('Error rendering AppNavigator:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading app. Check console.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001f3f', // Dark blue background
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#001f3f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#001f3f', // Dark blue background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
  },
});
