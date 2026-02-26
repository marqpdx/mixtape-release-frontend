// components/crossroads/Composer.tsx

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Textarea,
  Heading,
  Spinner,
} from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { IconMicrophone, IconPlayerStop, IconSend, IconArrowRight } from '@tabler/icons-react';
import { useRecentSeeds, useCreateSeed, useUpdateSeed } from '@mixtape/api/hooks/useSeed';
import { useCreateLeaf } from '@mixtape/api/hooks/useLeaf';
import { useVoiceRecorder } from '@mixtape/api/hooks/useVoiceRecorder';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import SeedCard from './SeedCard';

const AUTO_SAVE_DELAY = 1500;

export default function Composer() {
  const [text, setText] = useState('');
  const [activeSeedId, setActiveSeedId] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: recentSeeds, isLoading: seedsLoading, refetch: refetchSeeds } = useRecentSeeds();
  const createSeed = useCreateSeed();
  const updateSeed = useUpdateSeed();
  const createLeaf = useCreateLeaf();

  const inputBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const recordingColor = useColorModeValue('red.500', 'red.400');

  // Voice recording — upload blob as a voice seed
  const handleVoiceComplete = useCallback(async (blob: Blob) => {
    const form = new FormData();
    form.append('audio_file', blob, 'seed-voice.webm');
    form.append('kind', 'voice');
    form.append('source', 'web');
    try {
      await axiosInstance.post('/api/writing/seeds', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      refetchSeeds();
    } catch {
      // silent fail — voice is optional
    }
  }, [refetchSeeds]);

  const {
    isRecording,
    isPreparingMic,
    recordingSeconds,
    micError,
    startRecording,
    stopRecording,
  } = useVoiceRecorder(handleVoiceComplete);

  // Format recording timer
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Auto-save logic: create seed on first input, then debounced updates
  const scheduleAutoSave = useCallback(
    (value: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(async () => {
        if (!value.trim()) return;

        if (activeSeedId) {
          updateSeed.mutate({ id: activeSeedId, data: { body_text: value } });
        } else {
          const seed = await createSeed.mutateAsync({
            body_text: value,
            kind: 'text',
            source: 'web',
          });
          setActiveSeedId(seed.id);
        }
      }, AUTO_SAVE_DELAY);
    },
    [activeSeedId, createSeed, updateSeed]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    scheduleAutoSave(value);
  };

  // Quick post: Composer → Leaf directly
  const handleQuickPost = async () => {
    if (!text.trim()) return;

    // Cancel pending auto-save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    await createLeaf.mutateAsync({
      body_text: text.trim(),
      kind: 'text',
    });

    // Reset
    setText('');
    setActiveSeedId(null);
  };

  const isPosting = createLeaf.isPending;

  return (
    <VStack gap={5} align="stretch">
      <Heading size="sm" color={useColorModeValue('gray.700', 'gray.300')}>
        Composer
      </Heading>

      {/* Input area */}
      <Box>
        <Textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Capture a thought..."
          bg={inputBg}
          borderColor={borderColor}
          borderRadius="lg"
          rows={4}
          resize="vertical"
          disabled={isPosting || isRecording}
          _focus={{
            borderColor: 'blue.400',
            boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
          }}
        />

        {/* Action buttons */}
        <HStack mt={3} justify="space-between">
          <HStack gap={2}>
            {isRecording ? (
              <Button
                size="sm"
                variant="ghost"
                colorPalette="red"
                onClick={stopRecording}
              >
                <IconPlayerStop size={18} />
                <Text fontSize="sm" color={recordingColor}>
                  {formatTime(recordingSeconds)}
                </Text>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={startRecording}
                disabled={isPreparingMic}
                loading={isPreparingMic}
              >
                <IconMicrophone size={18} />
                <Text fontSize="sm">Voice</Text>
              </Button>
            )}
            {micError && (
              <Text fontSize="xs" color="red.500" maxW="200px">
                {micError}
              </Text>
            )}
          </HStack>

          <HStack gap={2}>
            {activeSeedId && (
              <Text fontSize="xs" color={mutedColor}>
                Auto-saved
              </Text>
            )}
            <Button
              size="sm"
              colorPalette="blue"
              onClick={handleQuickPost}
              disabled={!text.trim() || isPosting || isRecording}
              loading={isPosting}
            >
              <IconSend size={16} />
              Post to Storyline
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Recent Seeds */}
      <Box>
        <HStack justify="space-between" mb={3}>
          <Text fontSize="sm" fontWeight="medium" color={mutedColor}>
            Recent Captures
          </Text>
          <Button
            size="xs"
            variant="ghost"
            color={mutedColor}
            disabled
            title="Draftroom coming soon"
          >
            Expand
            <IconArrowRight size={14} />
          </Button>
        </HStack>

        {seedsLoading ? (
          <Box textAlign="center" py={4}>
            <Spinner size="sm" />
          </Box>
        ) : recentSeeds && recentSeeds.length > 0 ? (
          <VStack gap={2} align="stretch">
            {recentSeeds.map((seed) => (
              <SeedCard key={seed.id} seed={seed} />
            ))}
          </VStack>
        ) : (
          <Text fontSize="sm" color={mutedColor} textAlign="center" py={4}>
            No recent captures. Start typing above.
          </Text>
        )}
      </Box>
    </VStack>
  );
}
