// src/components/write/composer/SimplePublishDialog.tsx

'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  VStack,
  HStack,
  Button,
  Text,
  Heading,
  Checkbox,
  Select,
  Portal,
} from '@chakra-ui/react'
import { toaster } from "@mixtape/core/lib/toaster"
import { useWritingMutations } from '@hooks/useWriting'
import { createListCollection } from '@chakra-ui/react'

interface SimplePublishDialogProps {
  isOpen: boolean
  onClose: () => void
  piece: { id: string; title: string }
  groupId: string
  groupSlug?: string  // For cache invalidation
  titleRef: React.RefObject<string>
  docJSONRef: React.RefObject<DocumentJSON | null>
  excerptRef: React.RefObject<string>
  isUpdate?: boolean
  onPublished?: (piece: Record<string, unknown>) => void
}

type DocumentJSON = Record<string, unknown>

const getErrorMessage = (error: unknown): string | undefined => {
  if (error && typeof error === 'object') {
    const data = (error as { response?: { data?: { error?: string } } }).response?.data
    if (data?.error) return data.error
  }
  if (error instanceof Error) return error.message
  return undefined
}

export function SimplePublishDialog({
  isOpen,
  onClose,
  piece,
  groupId,
  groupSlug,
  titleRef,
  docJSONRef,
  excerptRef,
  isUpdate = false,
  onPublished
}: SimplePublishDialogProps) {
  const [toNoticeboard, setToNoticeboard] = useState(true)
  const [noticeboardExcerpt, setNoticeboardExcerpt] = useState(false)
  const [pinWelcome, setPinWelcome] = useState(false)
  const [pinAudience, setPinAudience] = useState<'group' | 'community' | 'public'>('group')

  const pinAudienceCollection = createListCollection({
    items: [
      { label: 'Group (members only)', value: 'group' },
      { label: 'Community (Crossroads members)', value: 'community' },
      { label: 'Public (anyone)', value: 'public' },
    ],
  })

  // Use mutation hook for automatic cache invalidation
  // Note: groupSlug is optional - if not provided, cache won't be invalidated automatically
  const { publishPiece } = useWritingMutations('group', groupSlug || 'unknown')

  const handlePublish = useCallback(async () => {
    if (!toNoticeboard) {
      toaster.create({
        title: 'Select at least one destination',
        type: 'warning'
      })
      return
    }

    try {
      // Use the mutation which automatically invalidates cache on success
      const response = await publishPiece.mutateAsync({
        pieceId: piece.id,
        payload: {
          // Update piece fields if changed
          title: titleRef.current,
          body_json: docJSONRef.current,
          excerpt: excerptRef.current,

          // Destinations
          destinations: {
            groups: [groupId]  // Publish to the group
          },

          // Options
          placement_options: {
            visibility: 'public',
            is_excerpt: noticeboardExcerpt,  // User chooses full or excerpt
            follow_updates: true,
            overrides: pinWelcome ? {
              pin_kind: 'welcome',
              pin_audience: pinAudience,
            } : undefined,
          }
        }
      })

      toaster.create({
        title: 'Published!',
        description: `Published to ${response.placements_created} destination(s)`,
        type: 'success'
      })

      onPublished?.(response.piece)
      onClose()
    } catch (error: unknown) {
      toaster.create({
        title: 'Publish failed',
        description: getErrorMessage(error),
        type: 'error'
      })
    }
  }, [toNoticeboard, noticeboardExcerpt, pinWelcome, pinAudience, piece.id, groupId, titleRef, docJSONRef, excerptRef, onClose, onPublished, publishPiece])

  return (
    <Dialog.Root open={isOpen} onOpenChange={({ open }: { open: boolean }) => !open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="450px">
          <Dialog.Header>
            <Heading size="md">{isUpdate ? 'Publish updates' : 'Publish'} "{piece.title}"</Heading>
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={4} align="stretch">
              {/* Noticeboard Option */}
              <VStack gap={3} p={4} borderRadius="md" bg="gray.50" borderWidth="1px">
                <Checkbox.Root
                  checked={toNoticeboard}
                  onCheckedChange={({ checked }: { checked: boolean | string }) => setToNoticeboard(!!checked)}
                >
                  <Checkbox.HiddenInput />
                  <HStack align="start" gap={0} ml={0}>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <VStack align="start" gap={0} ml={2}>
                      <Checkbox.Label fontWeight="semibold" fontSize="sm">
                        Post to Group Noticeboard
                      </Checkbox.Label>
                      <Text fontSize="xs" color="gray.500">
                        Shows in your group's activity feed
                      </Text>
                    </VStack>
                  </HStack>
                </Checkbox.Root>

                {toNoticeboard && (
                  <VStack gap={2} pl={6} align="stretch" w="100%">
                    <HStack gap={4}>
                      <Checkbox.Root
                        checked={!noticeboardExcerpt}
                        onCheckedChange={({ checked }: { checked: boolean | string }) => setNoticeboardExcerpt(!checked)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label fontSize="sm">
                          Show full piece
                        </Checkbox.Label>
                      </Checkbox.Root>

                      <Checkbox.Root
                        checked={noticeboardExcerpt}
                        onCheckedChange={({ checked }: { checked: boolean | string }) => setNoticeboardExcerpt(!!checked)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label fontSize="sm">
                          Show excerpt only
                        </Checkbox.Label>
                      </Checkbox.Root>
                    </HStack>
              </VStack>
            )}
          </VStack>

          <VStack gap={3} p={4} borderRadius="md" bg="gray.50" borderWidth="1px">
            <Checkbox.Root
              checked={pinWelcome}
              onCheckedChange={({ checked }: { checked: boolean | string }) => setPinWelcome(!!checked)}
            >
              <Checkbox.HiddenInput />
              <HStack align="start" gap={0} ml={0}>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <VStack align="start" gap={0} ml={2}>
                  <Checkbox.Label fontWeight="semibold" fontSize="sm">
                    Pin as Welcome message
                  </Checkbox.Label>
                  <Text fontSize="xs" color="gray.500">
                    Shows at the top of the Group Overview
                  </Text>
                </VStack>
              </HStack>
            </Checkbox.Root>

            {pinWelcome && (
              <VStack gap={2} pl={6} align="stretch" w="100%">
                <Text fontSize="xs" color="gray.500">
                  Visible to
                </Text>
                <Select.Root
                  value={[pinAudience]}
                  onValueChange={({ value }) => {
                    const nextValue = value[0] as 'group' | 'community' | 'public';
                    if (nextValue) {
                      setPinAudience(nextValue);
                    }
                  }}
                  collection={pinAudienceCollection}
                >
                  <Select.Control>
                    <Select.Trigger />
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                      <Select.ClearTrigger />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {pinAudienceCollection.items.map((item) => (
                          <Select.Item item={item} key={item.value}>
                            {item.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </VStack>
            )}
          </VStack>
        </VStack>
      </Dialog.Body>

          <Dialog.Footer gap={3}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handlePublish}
              loading={publishPiece.isPending}
            >
              {isUpdate ? 'Publish updates' : 'Publish'}
            </Button>
          </Dialog.Footer>

          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
