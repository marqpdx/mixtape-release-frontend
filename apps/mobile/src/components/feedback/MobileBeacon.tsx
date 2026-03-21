import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createFeedbackItem } from '@mixtape/api/clients/feedback/feedbackApi';

interface MobileBeaconProps {
  canUseLighthouse: boolean;
  isSuperuser: boolean;
  routeLabel: string;
}

export function MobileBeacon({
  canUseLighthouse,
  isSuperuser,
  routeLabel,
}: MobileBeaconProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canUseLighthouse) {
    return null;
  }

  const handleSubmit = async () => {
    if (!message.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createFeedbackItem({
        beacon_key: 'lighthouse',
        kind: 'idea',
        message: message.trim(),
        page_url: routeLabel,
      });
      setOpen(false);
      setMessage('');
      Alert.alert('Got it. Thank you.');
    } catch (submitError) {
      const err = submitError as Error | undefined;
      setError(err?.message || 'Unable to send feedback right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const accentColor = isSuperuser ? '#0E8C92' : '#2E7D32';
  const buttonLabel = isSuperuser ? 'Lighthouse' : 'Help';

  return (
    <>
      <View style={styles.triggerWrap} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.trigger, { backgroundColor: accentColor }]}
          onPress={() => setOpen(true)}
          activeOpacity={0.88}
        >
          {isSuperuser ? (
            <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
          ) : (
            <Ionicons name="lifebuoy-outline" size={16} color="#FFFFFF" />
          )}
          <Text style={styles.triggerText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Share feedback</Text>
                <Text style={styles.subtitle}>
                  Bugs, ideas, reactions - anything that would make Mixtape better.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} activeOpacity={0.8}>
                <Text style={styles.cancelTop}>Close</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              multiline
              placeholder="What's on your mind?"
              placeholderTextColor="#738292"
              value={message}
              onChangeText={(value) => {
                setMessage(value);
                if (error) {
                  setError(null);
                }
              }}
              textAlignVertical="top"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setOpen(false)} activeOpacity={0.8}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: accentColor },
                  (!message.trim() || submitting) && styles.sendButtonDisabled,
                ]}
                onPress={() => {
                  void handleSubmit();
                }}
                disabled={!message.trim() || submitting}
                activeOpacity={0.88}
              >
                <Text style={styles.sendText}>{submitting ? 'Sending...' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerWrap: {
    position: 'absolute',
    left: 18,
    bottom: 28,
    zIndex: 50,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    shadowColor: '#0B1F30',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  triggerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 34, 53, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 28,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#0D2235',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#526170',
    fontSize: 13,
    lineHeight: 18,
  },
  cancelTop: {
    color: '#526170',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 120,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#C9D4DE',
    color: '#13293D',
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    color: '#8F3341',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cancel: {
    color: '#526170',
    fontSize: 14,
    fontWeight: '600',
  },
  sendButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
