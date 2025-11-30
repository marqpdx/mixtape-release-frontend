// src/components/write/composer/PublishingControls.tsx

'use client'

import { useState } from 'react'
import { Button, VStack } from '@chakra-ui/react'
import { SimplePublishDialog } from './SimplePublishDialog'

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
  sponsor: SponsorConfig
  hasUnsavedChanges: boolean
  saveNow: (data: any) => Promise<any>
  titleRef: React.RefObject<string>
  docJSONRef: React.RefObject<any>
  excerptRef: React.RefObject<string>
  onPublished?: (piece: any) => void
  onSaved?: (piece: any) => void
}

export function PublishingControls({
  pieceId,
  piece,
  sponsor,
  hasUnsavedChanges,
  saveNow,
  titleRef,
  docJSONRef,
  excerptRef,
  onPublished,
  onSaved
}: PublishingControlsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  // Only show publish button for group sponsors (Use Case #1)
  if (sponsor.type !== 'group') {
    return null
  }

  return (
    <>
      <VStack gap={3} align="stretch">
        <Button
          colorScheme="green"
          onClick={() => setDialogOpen(true)}
          disabled={!piece.title}
        >
          Publish
        </Button>
      </VStack>

      <SimplePublishDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        piece={piece}
        groupId={sponsor.id}
        titleRef={titleRef}
        docJSONRef={docJSONRef}
        excerptRef={excerptRef}
        onPublished={(publishedPiece) => {
          setDialogOpen(false)
          onPublished?.(publishedPiece)
        }}
      />
    </>
  )
}