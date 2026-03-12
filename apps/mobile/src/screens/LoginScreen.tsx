import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '@mixtape/api/clients/auth/api';
import { useAuthStore } from '../stores/authStore';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LAST_IDENTIFIER_KEY = 'mixtape.mobile.lastIdentifier';

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const passwordInputRef = useRef<TextInput | null>(null);
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('boston99');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    void AsyncStorage.getItem(LAST_IDENTIFIER_KEY).then((value) => {
      if (!active || !value) {
        return;
      }

      setEmail(value);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Please enter email/username and password');
        return;
      }

      // Real authentication using shared API
      console.log('[Login] Attempting login for:', email);
      const user = await login({
        identifier: email,
        password: password,
      });

      void AsyncStorage.setItem(LAST_IDENTIFIER_KEY, email.trim());
      Keyboard.dismiss();
      console.log('[Login] Success! User:', user.username);
      setUser(user);
      onLoginSuccess();
    } catch (err: any) {
      console.error('[Login] Failed:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="auto" />

      <View style={styles.content}>
        <Text style={styles.title}>Mixtape</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email or username"
          placeholderTextColor="#7A8694"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          keyboardType="default"
          returnKeyType="next"
          importantForAutofill="yes"
          textContentType="username"
          editable={!isLoading}
          selectionColor="#0E5AA7"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
        />

        <View style={styles.passwordRow}>
          <TextInput
            ref={passwordInputRef}
            style={[styles.input, styles.passwordInput]}
            placeholder="Password"
            placeholderTextColor="#7A8694"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            importantForAutofill="yes"
            editable={!isLoading}
            selectionColor="#0E5AA7"
            blurOnSubmit={false}
            onSubmitEditing={() => {
              void handleLogin();
            }}
          />

          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword((value) => !value)}
            activeOpacity={0.75}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.passwordToggleText}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          Using shared packages from @mixtape/* 🚀
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#13293D',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
  },
  passwordToggle: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  passwordToggleText: {
    color: '#0E5AA7',
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  error: {
    color: '#ff3b30',
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    marginTop: 24,
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },
});
