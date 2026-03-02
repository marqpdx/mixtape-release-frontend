// components/crossroads/Composer.tsx

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Textarea,
  Heading,
  Spinner,
  Image,
  IconButton,
} from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import {
  IconMicrophone,
  IconPlayerStop,
  IconSend,
  IconArrowRight,
  IconPhoto,
  IconX,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { useRecentSeeds, useCreateSeed, useUpdateSeed } from '@mixtape/api/hooks/useSeed';
import { useCreateLeaf, useUploadLeafImage } from '@mixtape/api/hooks/useLeaf';
import { useVoiceRecorder } from '@mixtape/api/hooks/useVoiceRecorder';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import SeedCard from './SeedCard';
import { useComposerDraft } from './ComposerContext';

const AUTO_SAVE_DELAY = 1500;

interface ComposerProps {
  onPosted?: () => void;
}

export default function Composer({ onPosted }: ComposerProps) {
  const [text, setText] = useState('');
  const [activeSeedId, setActiveSeedId] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ id: string; url: string } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const { data: recentSeeds, isLoading: seedsLoading, refetch: refetchSeeds } = useRecentSeeds(20);
  const createSeed = useCreateSeed();
  const updateSeed = useUpdateSeed();
  const createLeaf = useCreateLeaf();
  const uploadImage = useUploadLeafImage();

  // Live preview context (optional — only present when wrapped in ComposerProvider)
  const draft = useComposerDraft();

  const inputBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const recordingColor = useColorModeValue('red.500', 'red.400');

  // Sync text + image to live preview context
  useEffect(() => {
    draft?.setDraft({
      text,
      imageUrl: uploadedImage?.url ?? null,
      kind: uploadedImage ? 'image' : 'text',
    });
  }, [text, uploadedImage]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Image upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadImage.mutateAsync(file);
      setUploadedImage(result);
    } catch {
      alert('Failed to upload image.');
    }
    // Reset input so same file can be re-selected
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const clearImage = () => {
    setUploadedImage(null);
  };

  const resetComposer = () => {
    setText('');
    setActiveSeedId(null);
    setUploadedImage(null);
    draft?.setDraft({ text: '', imageUrl: null, kind: 'text' });
    onPosted?.();
  };

  // Quick post: Composer → Leaf directly
  const handleQuickPost = async () => {
    if (!text.trim() && !uploadedImage) return;

    // Cancel pending auto-save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    await createLeaf.mutateAsync({
      body_text: text.trim(),
      kind: uploadedImage ? 'image' : 'text',
      ...(uploadedImage ? { image_file: uploadedImage.id } : {}),
    });

    resetComposer();
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!text.trim() && !uploadedImage) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    await createLeaf.mutateAsync({
      body_text: text.trim(),
      kind: uploadedImage ? 'image' : 'text',
      ...(uploadedImage ? { image_file: uploadedImage.id } : {}),
      publish: false,
    });

    resetComposer();
  };

  const [showCaptures, setShowCaptures] = useState(true);
  const [showSeeds, setShowSeeds] = useState(true);

  const filteredSeeds = useMemo(() => {
    if (!recentSeeds) return [];
    return recentSeeds.filter((seed) => {
      const isSeed = seed.source === 'web';
      if (isSeed) return showSeeds;
      return showCaptures;
    });
  }, [recentSeeds, showCaptures, showSeeds]);

  const isPosting = createLeaf.isPending;
  const isUploading = uploadImage.isPending;
  const hasContent = text.trim().length > 0 || !!uploadedImage;

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

        {/* Image preview */}
        {uploadedImage && (
          <Box mt={2} position="relative" display="inline-block">
            <Image
              src={uploadedImage.url}
              alt="Upload preview"
              maxH="120px"
              borderRadius="md"
              objectFit="cover"
            />
            <IconButton
              aria-label="Remove image"
              size="xs"
              variant="solid"
              colorPalette="red"
              borderRadius="full"
              position="absolute"
              top={-1}
              right={-1}
              onClick={clearImage}
            >
              <IconX size={12} />
            </IconButton>
          </Box>
        )}

        {/* Hidden file input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />

        {/* Action buttons */}
        <HStack mt={3} justify="space-between">
          <HStack gap={2}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading || isPosting || isRecording}
              loading={isUploading}
            >
              <IconPhoto size={18} />
              <Text fontSize="sm">Image</Text>
            </Button>
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
              variant="ghost"
              onClick={handleSaveDraft}
              disabled={!hasContent || isPosting || isRecording}
              title="Save as draft"
            >
              <IconDeviceFloppy size={16} />
              Draft
            </Button>
            <Button
              size="sm"
              colorPalette="blue"
              onClick={handleQuickPost}
              disabled={!hasContent || isPosting || isRecording}
              loading={isPosting}
            >
              <IconSend size={16} />
              Post
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Recent Captures & Seeds */}
      <Box>
        <HStack justify="space-between" mb={2}>
          <Text fontSize="sm" fontWeight="medium" color={mutedColor}>
            Recent
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

        <HStack gap={4} mb={3}>
          <HStack gap={1} as="label" cursor="pointer">
            <input
              type="checkbox"
              checked={showCaptures}
              onChange={(e) => setShowCaptures(e.target.checked)}
            />
            <Text fontSize="xs" color={mutedColor}>Captures</Text>
          </HStack>
          <HStack gap={1} as="label" cursor="pointer">
            <input
              type="checkbox"
              checked={showSeeds}
              onChange={(e) => setShowSeeds(e.target.checked)}
            />
            <Text fontSize="xs" color={mutedColor}>Seeds</Text>
          </HStack>
        </HStack>

        {seedsLoading ? (
          <Box textAlign="center" py={4}>
            <Spinner size="sm" />
          </Box>
        ) : filteredSeeds.length > 0 ? (
          <VStack gap={2} align="stretch">
            {filteredSeeds.map((seed) => (
              <SeedCard key={seed.id} seed={seed} />
            ))}
          </VStack>
        ) : (
          <Text fontSize="sm" color={mutedColor} textAlign="center" py={4}>
            {!showCaptures && !showSeeds
              ? 'Select a filter above to see items.'
              : 'No recent items. Start typing above.'}
          </Text>
        )}
      </Box>
    </VStack>
  );
}
