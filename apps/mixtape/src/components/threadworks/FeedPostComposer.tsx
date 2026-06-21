// src/components/threadworks/FeedPostComposer.tsx
// Rich composer for FeedPost (D4). Borrows kind selector, useVoiceRecorder,
// and image upload patterns from Storyline Leaf Composer.

import { useRef, useState } from 'react'
import {
  Box, Button, HStack, Input, Text, Textarea, VStack, Badge,
} from '@chakra-ui/react'
import {
  IconPhoto, IconMicrophone, IconLink, IconX, IconSend, IconTag,
  IconCalendar,
} from '@tabler/icons-react'
import { useColorModeValue } from '@components/ui/color-mode'
import { Forum, FeedPostKind, CreationSignal, VisibilityScope } from '@mixtape/core/types/threadworksTypes'
import { useVoiceRecorder } from '@mixtape/api/hooks/useVoiceRecorder'
import { useFeedPostMutations } from '@hooks/threadworks/useThreadworks'

interface FeedPostComposerProps {
  forumSlug: string
  groupSlug?: string
  forum: Forum
  onCreated?: () => void
  onCancel?: () => void
}

const SIGNAL_LABELS: Record<CreationSignal, string> = {
  low: 'Low signal',
  medium: 'Medium signal',
  high: 'High signal',
}

const SIGNAL_COLORS: Record<CreationSignal, string> = {
  low: 'gray',
  high: 'orange',
  medium: 'blue',
}

export default function FeedPostComposer({
  forumSlug,
  groupSlug,
  forum,
  onCreated,
  onCancel,
}: FeedPostComposerProps) {
  const [kind, setKind] = useState<FeedPostKind>('text')
  const [title, setTitle] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [creationSignal, setCreationSignal] = useState<CreationSignal | null>(null)
  const [timelinessDate, setTimelinessDate] = useState('')
  const [showMeta, setShowMeta] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const bgColor = useColorModeValue('white', 'gray.800')
  const metaColor = useColorModeValue('gray.500', 'gray.500')
  const textColor = useColorModeValue('gray.700', 'gray.300')

  const visibilityScope: VisibilityScope = forum.is_contained_circle ? 'circle' : 'group'

  const { createFeedPost, uploadImage, uploadVoice, isCreating } =
    useFeedPostMutations(forumSlug, groupSlug)

  const handleVoiceComplete = async (blob: Blob) => {
    setKind('voice')
    try {
      await uploadVoice({ blob, title: title || undefined, creation_signal: creationSignal || undefined })
      onCreated?.()
      resetForm()
    } catch {
      setError('Voice upload failed. Please try again.')
    }
  }

  const {
    isRecording,
    isPreparingMic,
    recordingSeconds,
    micError,
    startRecording,
    stopRecording,
  } = useVoiceRecorder(handleVoiceComplete)

  const resetForm = () => {
    setKind('text')
    setTitle('')
    setBodyText('')
    setLinkUrl('')
    setImageFile(null)
    setImagePreview(null)
    setCreationSignal(null)
    setTimelinessDate('')
    setShowMeta(false)
    setError(null)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setKind('image')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (kind === 'image') setKind('text')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    setError(null)
    try {
      if (kind === 'image' && imageFile) {
        await uploadImage({
          file: imageFile,
          title: title || undefined,
          creation_signal: creationSignal || undefined,
        })
      } else if (kind === 'link') {
        if (!linkUrl.trim()) { setError('Link URL is required.'); return }
        await createFeedPost({
          kind: 'link',
          link_url: linkUrl.trim(),
          title: title || undefined,
          visibility_scope: visibilityScope,
          creation_signal: creationSignal || undefined,
          timeliness_date: timelinessDate || undefined,
        })
      } else {
        if (!bodyText.trim()) { setError('Post body is required.'); return }
        await createFeedPost({
          kind: 'text',
          body_text: bodyText.trim(),
          title: title || undefined,
          visibility_scope: visibilityScope,
          creation_signal: creationSignal || undefined,
          timeliness_date: timelinessDate || undefined,
        })
      }
      onCreated?.()
      resetForm()
    } catch {
      setError('Could not post. Please try again.')
    }
  }

  const toggleSignal = (sig: CreationSignal) => {
    setCreationSignal((prev) => (prev === sig ? null : sig))
  }

  const isSubmittable =
    (kind === 'text' && bodyText.trim().length > 0) ||
    (kind === 'image' && imageFile != null) ||
    (kind === 'link' && linkUrl.trim().length > 0)

  return (
    <Box border="1px solid" borderColor={borderColor} borderRadius="md" bg={bgColor} p={4}>
      <VStack align="stretch" gap={3}>
        {/* Optional title */}
        <Input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="sm"
          variant="flushed"
          fontSize="md"
          fontWeight="medium"
        />

        {/* Kind-specific input */}
        {kind === 'image' && imagePreview ? (
          <Box position="relative">
            <img
              src={imagePreview}
              alt="Preview"
              style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '6px' }}
            />
            <Button
              size="xs"
              position="absolute"
              top={2}
              right={2}
              onClick={clearImage}
              colorScheme="blackAlpha"
            >
              <IconX size={14} />
            </Button>
          </Box>
        ) : kind === 'link' ? (
          <HStack>
            <IconLink size={16} color="gray" />
            <Input
              placeholder="Paste a URL…"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              size="sm"
              flex={1}
            />
            <Button size="xs" variant="ghost" onClick={() => { setKind('text'); setLinkUrl('') }}>
              <IconX size={14} />
            </Button>
          </HStack>
        ) : kind === 'voice' && isRecording ? (
          <HStack gap={3}>
            <Box w={2} h={2} borderRadius="full" bg="red.500" animation="pulse 1s infinite" />
            <Text fontSize="sm" color={textColor}>Recording — {recordingSeconds}s</Text>
            <Button size="sm" colorScheme="red" onClick={stopRecording}>Stop</Button>
          </HStack>
        ) : (
          <Textarea
            placeholder="Share something with the group…"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            resize="none"
            minH="80px"
            fontSize="sm"
          />
        )}

        {micError && <Text fontSize="xs" color="red.500">{micError}</Text>}
        {error && <Text fontSize="xs" color="red.500">{error}</Text>}

        {/* Toolbar */}
        <HStack justify="space-between" align="center">
          <HStack gap={1}>
            {/* Image */}
            <>
              <input
                type="file"
                accept="image/*"
                ref={imageInputRef}
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <Button
                size="xs"
                variant="ghost"
                color={kind === 'image' ? 'green.500' : metaColor}
                onClick={() => imageInputRef.current?.click()}
                title="Add image"
              >
                <IconPhoto size={16} />
              </Button>
            </>

            {/* Voice */}
            <Button
              size="xs"
              variant="ghost"
              color={kind === 'voice' && isRecording ? 'red.500' : metaColor}
              onClick={isRecording ? stopRecording : startRecording}
              loading={isPreparingMic}
              title={isRecording ? 'Stop recording' : 'Record voice note'}
            >
              <IconMicrophone size={16} />
            </Button>

            {/* Link */}
            <Button
              size="xs"
              variant="ghost"
              color={kind === 'link' ? 'green.500' : metaColor}
              onClick={() => setKind(kind === 'link' ? 'text' : 'link')}
              title="Add link"
            >
              <IconLink size={16} />
            </Button>

            {/* Meta toggle */}
            <Button
              size="xs"
              variant="ghost"
              color={showMeta || creationSignal ? 'green.500' : metaColor}
              onClick={() => setShowMeta((v) => !v)}
              title="Creation signal & timeliness"
            >
              <IconTag size={16} />
            </Button>
          </HStack>

          <HStack gap={2}>
            {onCancel && (
              <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
            )}
            <Button
              size="sm"
              colorScheme="green"
              disabled={!isSubmittable || isCreating}
              loading={isCreating}
              onClick={handleSubmit}
            >
              <IconSend size={14} />
              Post
            </Button>
          </HStack>
        </HStack>

        {/* Meta panel — creation signal + timeliness date */}
        {showMeta && (
          <Box
            borderTop="1px solid"
            borderTopColor={borderColor}
            pt={3}
          >
            <VStack align="stretch" gap={3}>
              <Box>
                <Text fontSize="xs" fontWeight="semibold" color={metaColor} mb={2}>
                  Signal tag
                </Text>
                <HStack gap={2}>
                  {(['low', 'medium', 'high'] as CreationSignal[]).map((sig) => (
                    <Badge
                      key={sig}
                      colorScheme={SIGNAL_COLORS[sig]}
                      variant={creationSignal === sig ? 'solid' : 'outline'}
                      cursor="pointer"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      onClick={() => toggleSignal(sig)}
                      userSelect="none"
                    >
                      {SIGNAL_LABELS[sig]}
                    </Badge>
                  ))}
                </HStack>
              </Box>

              <HStack gap={2} align="center">
                <IconCalendar size={14} color="gray" />
                <Text fontSize="xs" color={metaColor}>Timeliness date</Text>
                <Input
                  type="date"
                  value={timelinessDate}
                  onChange={(e) => setTimelinessDate(e.target.value)}
                  size="xs"
                  w="auto"
                />
              </HStack>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
