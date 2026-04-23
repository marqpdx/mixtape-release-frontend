import { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useInitiativesStore } from '../../stores/initiativesStore';
import { useInitiativesCommand } from '../../hooks/useInitiativesCommand';
import { useInitiativesVoiceInput } from '../../hooks/useInitiativesVoiceInput';

interface UniversalActionFieldProps {
  kicker?: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  helperLeft?: string;
  helperRight?: string;
  onFocusChange?: (focused: boolean) => void;
}

export function UniversalActionField({
  kicker = 'Intentions',
  title = 'Universal Action Field',
  subtitle = 'Type or speak one command, then confirm before execution.',
  placeholder = 'note supplier called about a Q3 price increase',
  helperLeft,
  helperRight = '8 verbs, one action per submission',
  onFocusChange,
}: UniversalActionFieldProps) {
  const draftText = useInitiativesStore((state) => state.draftText);
  const composerState = useInitiativesStore((state) => state.composerState);
  const pendingParse = useInitiativesStore((state) => state.pendingParse);
  const {
    editableGeneratedText,
    setEditableGeneratedText,
    hydrateDraft,
    handleDraftChange,
    submitDraft,
    returnToEdit,
    confirmParsedCommand,
    appendVoiceSample,
    hasBackendTarget,
  } = useInitiativesCommand();
  const voice = useInitiativesVoiceInput();

  const hasDraft = draftText.trim().length > 0;
  const isGeneratedEditVerb =
    pendingParse?.verb === 'draft' || pendingParse?.verb === 'summarize';

  useEffect(() => {
    hydrateDraft();
  }, [hydrateDraft]);

  return (
    <View style={styles.container}>
      <View style={styles.composerCard}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <TextInput
          style={styles.input}
          multiline
          textAlignVertical="top"
          value={draftText}
          onChangeText={handleDraftChange}
          placeholder={placeholder}
          placeholderTextColor="#738292"
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
        />

        <View style={styles.helperRow}>
          <Text style={styles.helperText}>
            {helperLeft ?? `Composer state: ${composerState}${hasBackendTarget ? '' : ' • missing sponsor group'}`}
          </Text>
          <Text style={styles.helperText}>{helperRight}</Text>
        </View>

        <View style={styles.voiceRow}>
          {!voice.isRecording && !voice.isPaused ? (
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  void voice.startVoiceCapture();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>
                  {voice.isPreparing ? 'Starting…' : 'Record Voice'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={appendVoiceSample} activeOpacity={0.85}>
                <Text style={styles.secondaryButtonText}>Append STT Demo</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  void (voice.isPaused ? voice.resumeVoiceCapture() : voice.pauseVoiceCapture());
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>
                  {voice.isPaused ? 'Resume' : 'Pause'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  void voice.submitVoiceCapture();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Send to Fallback</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {(voice.isRecording || voice.isPaused || voice.isPreparing) ? (
          <View style={styles.voiceStatusRow}>
            <Text style={styles.helperText}>
              {voice.isPreparing
                ? 'Preparing microphone...'
                : voice.isPaused
                  ? `Voice paused at ${voice.recordingSeconds}s`
                  : `Recording voice command: ${voice.recordingSeconds}s`}
            </Text>
            <TouchableOpacity
              onPress={() => {
                void voice.cancelVoiceCapture();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelLink}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {voice.micError ? <Text style={styles.errorText}>{voice.micError}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, !hasDraft && styles.buttonDisabled]}
          onPress={submitDraft}
          disabled={!hasDraft}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Parse Command</Text>
        </TouchableOpacity>
      </View>

      {pendingParse ? (
        <View style={styles.confirmCard}>
          <Text style={styles.confirmKicker}>
            {pendingParse.confidence === 'low' ? 'Generic Confirm' : 'Confirm Action'}
          </Text>
          <Text style={styles.confirmTitle}>{pendingParse.title}</Text>
          <Text style={styles.confirmSummary}>{pendingParse.summary}</Text>
          {pendingParse.needsClarification && pendingParse.clarificationReason ? (
            <Text style={styles.clarificationText}>{pendingParse.clarificationReason}</Text>
          ) : null}

          {pendingParse.fields.map((field) => (
            <View key={`${field.label}-${field.value}`} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <Text style={styles.fieldValue}>{field.value}</Text>
            </View>
          ))}

          {isGeneratedEditVerb ? (
            <TextInput
              style={styles.generatedInput}
              multiline
              textAlignVertical="top"
              value={editableGeneratedText}
              onChangeText={setEditableGeneratedText}
              placeholder="Generated output appears here."
              placeholderTextColor="#738292"
            />
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={returnToEdit} activeOpacity={0.85}>
              <Text style={styles.secondaryButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButtonInline} onPress={confirmParsedCommand} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export const universalActionFieldStyles = StyleSheet.create({
  container: {
    gap: 14,
  },
  composerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 12,
  },
  kicker: {
    color: '#315E87',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0D2235',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5F6E7D',
  },
  input: {
    minHeight: 120,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#C9D4DE',
    color: '#13293D',
    fontSize: 16,
    lineHeight: 22,
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  helperText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#6A7785',
  },
  voiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  voiceStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0E5AA7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonInline: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0E5AA7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#9DB6CC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FBFD',
    paddingHorizontal: 10,
  },
  secondaryButtonText: {
    color: '#244867',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  cancelLink: {
    color: '#8A5A00',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  errorText: {
    color: '#B3261E',
    fontSize: 13,
    lineHeight: 18,
  },
  confirmCard: {
    backgroundColor: '#FFF9F0',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E4D2A5',
    gap: 10,
  },
  confirmKicker: {
    color: '#8A5A00',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3A2A00',
  },
  confirmSummary: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6C5A32',
  },
  clarificationText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8A5A00',
    backgroundColor: '#FFF6E5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldRow: {
    gap: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A5A00',
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 15,
    lineHeight: 21,
    color: '#3A2A00',
  },
  generatedInput: {
    minHeight: 140,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFCF5',
    borderWidth: 1,
    borderColor: '#DCC38A',
    color: '#2C2414',
    fontSize: 15,
    lineHeight: 21,
  },
});

const styles = universalActionFieldStyles;
