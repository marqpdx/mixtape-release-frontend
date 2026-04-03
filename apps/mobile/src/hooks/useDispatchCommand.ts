import { useRef, useState } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createConversation } from '@mixtape/api/clients/chat/chatApi';
import { socketService } from '../services/socket/socketService';

// ─── Parse result ────────────────────────────────────────────────────────────

export interface DispatchParseResult {
  /** A valid /msg command line is present with a blank line above it */
  isDispatchMode: boolean;
  /** Double-return was pressed after the command line — ready to fire */
  shouldFire: boolean;
  /** Line index of the /msg command within the split lines array */
  commandLineIndex: number;
  /** Resolved @mention usernames */
  recipients: string[];
  /** Message body (everything after the last @mention) */
  messageBody: string;
  /** Partial username being typed after an @ (null when not mid-mention) */
  mentionQuery: string | null;
  /** Seed content that was in the input before the command */
  preSeedContent: string;
}

const EMPTY_RESULT: DispatchParseResult = {
  isDispatchMode: false,
  shouldFire: false,
  commandLineIndex: -1,
  recipients: [],
  messageBody: '',
  mentionQuery: null,
  preSeedContent: '',
};

/**
 * Parse capture text for /msg dispatch commands.
 *
 * Activation pattern (from spec):
 *   previous text
 *                    ← blank line above signals mode shift
 *   /msg @user body
 *                    ← double-return fires
 */
export function parseDispatchText(text: string): DispatchParseResult {
  const lines = text.split('\n');

  // Find the /msg command line that has a blank line above it
  let commandLineIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (/^\/msg\s+/i.test(lines[i].trim()) && lines[i - 1].trim() === '') {
      commandLineIndex = i;
    }
  }

  if (commandLineIndex === -1) {
    return EMPTY_RESULT;
  }

  const commandLine = lines[commandLineIndex].trim();

  // Double-return: command line must be the last non-empty line, and text
  // must end with two newlines (\n\n → two trailing empty strings after split)
  let lastNonEmptyIndex = lines.length - 1;
  while (lastNonEmptyIndex > 0 && lines[lastNonEmptyIndex].trim() === '') {
    lastNonEmptyIndex--;
  }
  const shouldFire =
    lastNonEmptyIndex === commandLineIndex &&
    lines.length - commandLineIndex >= 3 &&
    lines[lines.length - 1] === '' &&
    lines[lines.length - 2] === '';

  // Parse recipients: /msg @user1 @user2 message body
  const withoutCmd = commandLine.replace(/^\/msg\s+/i, '');
  const recipients: string[] = [];
  let remaining = withoutCmd;
  const mentionRe = /^@(\w+)\s*/;
  let match: RegExpExecArray | null;
  while ((match = mentionRe.exec(remaining)) !== null) {
    recipients.push(match[1]);
    remaining = remaining.slice(match[0].length);
  }
  const messageBody = remaining.trim();

  // Detect active mention being typed: command line ends with @partial (no space after)
  const mentionQueryMatch = /@(\w*)$/.exec(commandLine);
  const mentionQuery = mentionQueryMatch ? mentionQueryMatch[1] : null;

  // Seed content: everything before the blank line that precedes the command
  const preSeedContent = lines
    .slice(0, commandLineIndex - 1)
    .join('\n')
    .trimEnd();

  return {
    isDispatchMode: true,
    shouldFire,
    commandLineIndex,
    recipients,
    messageBody,
    mentionQuery,
    preSeedContent,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDispatchCommand() {
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const confirmationOpacity = useRef(new Animated.Value(0)).current;

  const clearError = () => setDispatchError(null);

  const fire = async (
    result: DispatchParseResult,
    draftStorageKey: string,
    onSuccess: (newText: string) => void
  ) => {
    const { recipients, messageBody, preSeedContent } = result;

    if (recipients.length === 0) {
      setDispatchError('No recipient — add @username after /msg');
      return;
    }
    if (!messageBody) {
      setDispatchError('Message is empty');
      return;
    }

    // Flush autosave of seed content before dispatching
    if (preSeedContent) {
      await AsyncStorage.setItem(draftStorageKey, preSeedContent);
    } else {
      await AsyncStorage.removeItem(draftStorageKey);
    }

    setIsDispatching(true);
    setDispatchError(null);

    try {
      // find-or-create the DM thread for these participants
      const conversation = await createConversation(recipients);
      const slug = (conversation as any).slug || (conversation as any).id;

      // join the room and send
      socketService.emit('join_conversation', { conversationSlug: slug });
      socketService.emit('send_message', { conversationSlug: slug, message: messageBody });

      // fade-in ✓ confirmation then fade-out
      setConfirmationVisible(true);
      Animated.sequence([
        Animated.timing(confirmationOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(confirmationOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setConfirmationVisible(false);
        confirmationOpacity.setValue(0);
        onSuccess(preSeedContent);
      });
    } catch {
      setDispatchError('Failed to send — tap to retry');
    } finally {
      setIsDispatching(false);
    }
  };

  return {
    fire,
    isDispatching,
    dispatchError,
    clearError,
    confirmationVisible,
    confirmationOpacity,
  };
}
