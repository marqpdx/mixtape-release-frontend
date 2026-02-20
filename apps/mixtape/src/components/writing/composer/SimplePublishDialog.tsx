// apps/mixtape/src/components/write/composer/SimplePublishDialog.tsx

'use client'

import { useState } from 'react'
import {
  Dialog,
  VStack,
  HStack,
  Button,
  Text,
  Heading,
  Checkbox,
  RadioGroup,
  Box,
  Spinner,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { toaster } from '@mixtape/core/lib/toaster'
import { useWritingMutations } from '@hooks/useWriting'
import * as stackroomApi from '@mixtape/api/clients/stackroom/stackroomApi'

interface SimplePublishDialogProps {
  isOpen: boolean
  onClose: () => void
  piece: { id: string; title: string }
  sponsorId: string
  sponsorSlug?: string
  sponsorType: 'group' | 'member'
  titleRef: React.RefObject<string>
  docJSONRef: React.RefObject<DocumentJSON | null>
  excerptRef: React.RefObject<string>
  isUpdate?: boolean
  onPublished?: (piece: Record<string, unknown>) => void
}

type DocumentJSON = Record<string, unknown>
type AudienceChoice = 'just_me' | 'readers'

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
  sponsorId,
  sponsorSlug,
  sponsorType,
  titleRef,
  docJSONRef,
  excerptRef,
  isUpdate = false,
  onPublished
}: SimplePublishDialogProps) {
  const [audience, setAudience] = useState<AudienceChoice>('just_me')
  const [selectedShelves, setSelectedShelves] = useState<string[]>([])
  const [postToGroup, setPostToGroup] = useState(false)
  const [pinAsWelcome, setPinAsWelcome] = useState(false)

  const { publishPiece } = useWritingMutations(sponsorType, sponsorSlug || 'unknown')

  const isMemberSponsor = sponsorType === 'member'
  const shouldShowShelves = audience === 'readers' && isMemberSponsor
  const shouldShowGroup = audience === 'readers' && sponsorType === 'group'

  const {
    data: shelves = [],
    isLoading: shelvesLoading,
    refetch: refetchShelves,
  } = useQuery({
    queryKey: ['stackroom', 'libraries', 'writing', sponsorId],
    queryFn: () => stackroomApi.fetchLibraries({
      scope: 'writing',
      sponsor_type: 'user',
      sponsor_id: sponsorId,
    }),
    enabled: isOpen && isMemberSponsor,
  })

  const toggleShelf = (shelfId: string, checked: boolean) => {
    setSelectedShelves((prev) => {
      if (checked) return Array.from(new Set([...prev, shelfId]))
      return prev.filter((id) => id !== shelfId)
    })
  }

  const handleCreateDefaultShelf = async () => {
    try {
      const created = await stackroomApi.createLibrary({
        title: 'My Writing',
        sponsor_type: 'user',
        sponsor_id: sponsorId,
        scope: 'writing',
        visibility: 'public',
      })
      await refetchShelves()
      if (created?.id) {
        setSelectedShelves([created.id])
      }
    } catch (error: unknown) {
      toaster.create({
        title: 'Could not create shelf',
        description: getErrorMessage(error),
        type: 'error',
      })
    }
  }

  const handlePublish = async () => {
    if (audience === 'readers') {
      const hasDestinations = (isMemberSponsor && selectedShelves.length > 0) || (sponsorType === 'group' && postToGroup)
      if (!hasDestinations) {
        toaster.create({
          title: 'Choose a destination',
          description: 'Select where readers should find this piece.',
          type: 'warning',
        })
        return
      }
    }

    try {
      const destinations = isMemberSponsor
        ? { shelves: selectedShelves }
        : { groups: postToGroup ? [sponsorId] : [] }

      const groupOverrides = !isMemberSponsor && postToGroup && pinAsWelcome
        ? {
            [sponsorId]: {
              overrides: {
                pin_kind: "welcome",
                pin_audience: "group",
              },
            },
          }
        : undefined

      const response = await publishPiece.mutateAsync({
        pieceId: piece.id,
        payload: {
          title: titleRef.current,
          body_json: docJSONRef.current,
          excerpt: excerptRef.current,
          audience,
          destinations,
          group_overrides: groupOverrides,
          placement_options: {
            follow_updates: true,
          },
        },
      })

      toaster.create({
        title: 'Published',
        description:
          audience === 'just_me'
            ? 'This piece is published and visible only to you.'
            : 'This piece is published and placed where you selected.',
        type: 'success',
      })

      onPublished?.(response.piece)
      onClose()
    } catch (error: unknown) {
      toaster.create({
        title: 'Publish failed',
        description: getErrorMessage(error),
        type: 'error',
      })
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={({ open }: { open: boolean }) => !open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="520px">
          <Dialog.Header>
            <Heading size="md">{isUpdate ? 'Publish updates' : 'Publish'} "{piece.title}"</Heading>
            <Text fontSize="sm" color="gray.500" mt={2}>
              Finalize this piece and decide where it belongs.
            </Text>
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={6} align="stretch">
              <VStack gap={3} align="stretch">
                <Heading size="sm">Who is this for?</Heading>
                <RadioGroup.Root
                  value={audience}
                  onValueChange={({ value }) => setAudience(value as AudienceChoice)}
                >
                  <VStack align="stretch" gap={3}>
                    <RadioGroup.Item value="just_me">
                      <RadioGroup.ItemHiddenInput />
                      <HStack align="start" gap={3}>
                        <RadioGroup.ItemIndicator />
                        <VStack align="start" gap={1}>
                          <RadioGroup.ItemText fontWeight="semibold">Just me</RadioGroup.ItemText>
                          <Text fontSize="sm" color="gray.500">
                            Keep this finalized but private for now.
                          </Text>
                        </VStack>
                      </HStack>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="readers">
                      <RadioGroup.ItemHiddenInput />
                      <HStack align="start" gap={3}>
                        <RadioGroup.ItemIndicator />
                        <VStack align="start" gap={1}>
                          <RadioGroup.ItemText fontWeight="semibold">Readers</RadioGroup.ItemText>
                          <Text fontSize="sm" color="gray.500">
                            Make this available for others to read.
                          </Text>
                        </VStack>
                      </HStack>
                    </RadioGroup.Item>
                  </VStack>
                </RadioGroup.Root>
              </VStack>

              {audience === 'readers' && (
                <VStack gap={3} align="stretch">
                  <Heading size="sm">Where should readers find it?</Heading>

                  {shouldShowShelves && (
                    <VStack gap={3} align="stretch">
                      {shelvesLoading && (
                        <HStack gap={2} color="gray.500">
                          <Spinner size="sm" />
                          <Text fontSize="sm">Loading shelves...</Text>
                        </HStack>
                      )}

                      {!shelvesLoading && shelves.length === 0 && (
                        <Box borderWidth="1px" borderRadius="md" p={3}>
                          <Text fontSize="sm" color="gray.600" mb={3}>
                            Create your main writing shelf to start sharing with readers.
                          </Text>
                          <Button size="sm" onClick={handleCreateDefaultShelf}>
                            Create “My Writing” shelf
                          </Button>
                        </Box>
                      )}

                      {!shelvesLoading && shelves.length > 0 && (
                        <VStack gap={2} align="stretch">
                          {shelves.map((shelf) => {
                            const checked = selectedShelves.includes(shelf.id)
                            const label = shelf.title === 'My Writing' ? 'My Library' : shelf.title
                            const helper = shelf.title === 'My Writing'
                              ? 'Your main writing shelf — a good default.'
                              : 'Place this alongside related writing.'
                            return (
                              <Checkbox.Root
                                key={shelf.id}
                                checked={checked}
                                onCheckedChange={({ checked: next }: { checked: boolean | string }) =>
                                  toggleShelf(shelf.id, !!next)
                                }
                              >
                                <Checkbox.HiddenInput />
                                <HStack align="start" gap={2}>
                                  <Checkbox.Control>
                                    <Checkbox.Indicator />
                                  </Checkbox.Control>
                                  <VStack align="start" gap={0}>
                                    <Checkbox.Label fontWeight="semibold" fontSize="sm">
                                      {label}
                                    </Checkbox.Label>
                                    <Text fontSize="xs" color="gray.500">
                                      {helper}
                                    </Text>
                                  </VStack>
                                </HStack>
                              </Checkbox.Root>
                            )
                          })}
                        </VStack>
                      )}
                    </VStack>
                  )}

                  {shouldShowGroup && (
                    <VStack align="stretch" gap={2}>
                      <Checkbox.Root
                        checked={postToGroup}
                        onCheckedChange={({ checked }: { checked: boolean | string }) => {
                          const next = !!checked
                          setPostToGroup(next)
                          if (!next) setPinAsWelcome(false)
                        }}
                      >
                        <Checkbox.HiddenInput />
                        <HStack align="start" gap={2}>
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <VStack align="start" gap={0}>
                            <Checkbox.Label fontWeight="semibold" fontSize="sm">
                              Group noticeboard
                            </Checkbox.Label>
                            <Text fontSize="xs" color="gray.500">
                              Place this on your group’s noticeboard.
                            </Text>
                          </VStack>
                        </HStack>
                      </Checkbox.Root>

                      <Checkbox.Root
                        checked={pinAsWelcome}
                        disabled={!postToGroup}
                        onCheckedChange={({ checked }: { checked: boolean | string }) => setPinAsWelcome(!!checked)}
                        pl={6}
                      >
                        <Checkbox.HiddenInput />
                        <HStack align="start" gap={2}>
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <VStack align="start" gap={0}>
                            <Checkbox.Label fontWeight="semibold" fontSize="sm">
                              Set as welcome pin
                            </Checkbox.Label>
                            <Text fontSize="xs" color="gray.500">
                              Show this as the group’s welcome note.
                            </Text>
                          </VStack>
                        </HStack>
                      </Checkbox.Root>
                    </VStack>
                  )}

                  <Text fontSize="xs" color="gray.500">
                    You can always move or reorganize this later.
                  </Text>
                </VStack>
              )}
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <HStack justify="space-between" w="100%">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button colorScheme="green" onClick={handlePublish}>
                Publish
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
