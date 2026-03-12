import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCreateLeaf } from '@mixtape/api/hooks/useLeaf';

interface HomeComposerProps {
  onPosted?: () => void;
}

export function HomeComposer({ onPosted }: HomeComposerProps) {
  const createLeaf = useCreateLeaf();
  const [text, setText] = useState('');
  const hasContent = text.trim().length > 0;

  const handlePost = async () => {
    const bodyText = text.trim();
    if (!bodyText) {
      return;
    }

    await createLeaf.mutateAsync({
      body_text: bodyText,
      kind: 'text',
      publish: true,
    });

    setText('');
    onPosted?.();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Composer</Text>
        <Text style={styles.subtitle}>
          Mobile composer is intentionally narrow for now: quick text capture into your Storyline.
        </Text>

        <TextInput
          style={styles.input}
          multiline
          placeholder="Capture a thought, scene, or note..."
          placeholderTextColor="#738292"
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
          editable={!createLeaf.isPending}
        />

        <View style={styles.actions}>
          <Text style={styles.helper}>Starts as text-only. Images, voice, and richer composition can come later.</Text>
          <TouchableOpacity
            style={[styles.button, (!hasContent || createLeaf.isPending) && styles.buttonDisabled]}
            onPress={handlePost}
            disabled={!hasContent || createLeaf.isPending}
            activeOpacity={0.85}
          >
            {createLeaf.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Post to Storyline</Text>
            )}
          </TouchableOpacity>
        </View>

        {createLeaf.isError ? (
          <Text style={styles.errorText}>Posting failed. Try again.</Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D2235',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5F6E7D',
  },
  input: {
    minHeight: 180,
    borderWidth: 1,
    borderColor: '#C9D4DE',
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    lineHeight: 22,
    color: '#13293D',
    backgroundColor: '#F8FBFD',
  },
  actions: {
    gap: 12,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6A7785',
  },
  button: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0E5AA7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: '#B3261E',
    fontSize: 13,
  },
});
