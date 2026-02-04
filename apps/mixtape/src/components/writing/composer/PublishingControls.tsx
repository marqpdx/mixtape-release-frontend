// src/components/write/composer/PublishingControls.tsx

'use client'

import { useState } from 'react'
import { Button, SimpleGrid, VStack } from '@chakra-ui/react'
import { SimplePublishDialog } from './SimplePublishDialog'
import { useWritingMutations } from '@hooks/useWriting'
import { toaster } from '@mixtape/core/lib/toaster'
import { IconChevronDown, IconSend } from '@tabler/icons-react'

interface SponsorConfig {
  type: 'group' | 'member'
  id: string
  slug?: string
  name?: string
  displayName?: string
}

interface PublishingControlsProps {
  pieceId: string
  piece: { id: string; title: string }
  pieceStatus?: string
  sponsor: SponsorConfig
  hasUnsavedChanges: boolean
  saveNow: (data: PublishSavePayload) => Promise<unknown>
  titleRef: React.RefObject<string>
  docJSONRef: React.RefObject<DocumentJSON | null>
  excerptRef: React.RefObject<string>
  onPublished?: (piece: Record<string, unknown>) => void
  onSaved?: (piece: Record<string, unknown>) => void
  onUnpublished?: (piece: Record<string, unknown>) => void
  publishLabel?: string
}

type DocumentJSON = Record<string, unknown>
type PublishSavePayload = {
  title: string
  body_json: DocumentJSON | null
  excerpt: string
}

export function PublishingControls({
  pieceId,
  piece,
  pieceStatus,
  sponsor,
  hasUnsavedChanges,
  saveNow,
  titleRef,
  docJSONRef,
  excerptRef,
  onPublished,
  onSaved,
  onUnpublished,
  publishLabel
}: PublishingControlsProps) {
  void pieceId
  void hasUnsavedChanges
  void saveNow
  void onSaved
  const [dialogOpen, setDialogOpen] = useState(false)
  const isPublished = pieceStatus === 'published'
  const { unpublishPiece, publishPiece } = useWritingMutations(sponsor.type, sponsor.slug || 'unknown')
  const canPublish = Boolean(
    titleRef.current?.trim() ||
      excerptRef.current?.trim() ||
      docJSONRef.current
  )
  const primaryLabel = isPublished ? 'Send updates' : 'Send out'
  const dialogLabel = publishLabel ?? (isPublished ? 'Publish updates' : 'Publish')

  const getErrorMessage = (error: unknown): string | undefined => {
    if (error && typeof error === 'object') {
      const data = (error as { response?: { data?: { error?: string } } }).response?.data
      if (data?.error) return data.error
    }
    if (error instanceof Error) return error.message
    return undefined
  }

  const handleUnpublish = async () => {
    try {
      const response = await unpublishPiece.mutateAsync(piece.id)
      toaster.create({
        title: 'Returned to draft',
        description: 'This piece is now a draft and no longer public.',
        type: 'success'
      })
      onUnpublished?.(response.piece || response)
    } catch (error: unknown) {
      toaster.create({
        title: 'Unpublish failed',
        description: getErrorMessage(error),
        type: 'error'
      })
    }
  }

  const handlePublishNow = async () => {
    try {
      await saveNow({
        title: titleRef.current,
        body_json: docJSONRef.current,
        excerpt: excerptRef.current,
      })
      const destinations = sponsor.type === 'group'
        ? { groups: [sponsor.id] }
        : { members: [sponsor.id] }
      const response = await publishPiece.mutateAsync({
        pieceId: piece.id,
        payload: {
          title: titleRef.current,
          body_json: docJSONRef.current,
          excerpt: excerptRef.current,
          destinations,
          placement_options: {
            visibility: 'public',
            is_excerpt: false,
            follow_updates: true,
          }
        }
      })
      toaster.create({
        title: 'Published!',
        description: `Published to ${response.placements_created} destination(s)`,
        type: 'success'
      })
      onPublished?.(response.piece || response)
    } catch (error: unknown) {
      toaster.create({
        title: 'Publish failed',
        description: getErrorMessage(error),
        type: 'error'
      })
    }
  }

  return (
    <>
      <VStack gap={3} align="stretch">
        <SimpleGrid columns={2} gap={3} gridTemplateColumns="repeat(2, 43%)" justifyContent="space-between">
        <Button
          colorScheme="green"
          variant="solid"
          onClick={handlePublishNow}
          disabled={!canPublish}
          size="sm"
          w="100%"
        >
          <IconSend size={14} style={{ marginRight: '6px' }} />
          {primaryLabel}
        </Button>
        <Button
          colorScheme="green"
          variant="outline"
          onClick={() => setDialogOpen(true)}
          disabled={!canPublish}
          size="sm"
          w="100%"
        >
          <IconChevronDown size={14} style={{ marginRight: '6px' }} />
          {`${dialogLabel}...`}
        </Button>
        </SimpleGrid>
        {isPublished && (
          <Button
            variant="outline"
            colorScheme="orange"
            onClick={handleUnpublish}
            size="sm"
            w="100%"
          >
            Unpublish / Return to draft
          </Button>
        )}
      </VStack>

      <SimplePublishDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        piece={piece}
        sponsorId={sponsor.id}
        sponsorSlug={sponsor.slug}  // Pass slug for cache invalidation
        sponsorType={sponsor.type}
        titleRef={titleRef}
        docJSONRef={docJSONRef}
        excerptRef={excerptRef}
        isUpdate={isPublished}
        onPublished={(publishedPiece) => {
          setDialogOpen(false)
          onPublished?.(publishedPiece)
        }}
      />
    </>
  )
}
