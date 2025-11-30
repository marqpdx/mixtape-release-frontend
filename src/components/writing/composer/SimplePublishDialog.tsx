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
} from '@chakra-ui/react'
import { toaster } from "@/components/ui/toaster"
import { axiosInstance } from '@providers/auth-provider/axiosInstance'

interface SimplePublishDialogProps {
  isOpen: boolean
  onClose: () => void
  piece: { id: string; title: string }
  groupId: string
  titleRef: React.RefObject<string>
  docJSONRef: React.RefObject<any>
  excerptRef: React.RefObject<string>
  onPublished?: (piece: any) => void
}

export function SimplePublishDialog({
  isOpen,
  onClose,
  piece,
  groupId,
  titleRef,
  docJSONRef,
  excerptRef,
  onPublished
}: SimplePublishDialogProps) {
  const [toNoticeboard, setToNoticeboard] = useState(true)
  const [noticeboardExcerpt, setNoticeboardExcerpt] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const handlePublish = useCallback(async () => {
    try {
      if (!toNoticeboard) {
        toaster.create({
          title: 'Select at least one destination',
          type: 'warning'
        })
        return
      }

      setIsPublishing(true)

      // Call your existing endpoint
      const response = await axiosInstance.post(
        `/api/writing/pieces/${piece.id}/publish`,
        {
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
            follow_updates: true
          }
        }
      )

      toaster.create({
        title: 'Published!',
        description: `Published to ${response.data.placements_created} destination(s)`,
        type: 'success'
      })

      onPublished?.(response.data.piece)
      onClose()
    } catch (error: any) {
      toaster.create({
        title: 'Publish failed',
        description: error?.response?.data?.error || error?.message,
        type: 'error'
      })
    } finally {
      setIsPublishing(false)
    }
  }, [toNoticeboard, noticeboardExcerpt, piece.id, groupId, titleRef, docJSONRef, excerptRef, onClose, onPublished])

  return (
    <Dialog.Root open={isOpen} onOpenChange={({ open }) => !open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="450px">
          <Dialog.Header>
            <Heading size="md">Publish "{piece.title}"</Heading>
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={4} align="stretch">
              {/* Noticeboard Option */}
              <VStack gap={3} p={4} borderRadius="md" bg="gray.50" borderWidth="1px">
                <Checkbox.Root
                  checked={toNoticeboard}
                  onCheckedChange={(e) => setToNoticeboard(!!e.checked)}
                >
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
                        onCheckedChange={(e) => setNoticeboardExcerpt(!e.checked)}
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
                        onCheckedChange={(e) => setNoticeboardExcerpt(!!e.checked)}
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
            </VStack>
          </Dialog.Body>

          <Dialog.Footer gap={3}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handlePublish}
              loading={isPublishing}
            >
              Publish
            </Button>
          </Dialog.Footer>

          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}