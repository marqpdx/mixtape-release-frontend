// IMPORTANT: Import env config first to set up environment variables
import './src/config/env';

import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { QueryProvider } from './src/providers/QueryProvider';

export default function App() {
  console.log('App.tsx rendering...');

  try {
    return (
      <QueryProvider>
        <SafeAreaProvider>
          <View style={styles.container}>
            <AppNavigator />
          </View>
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
