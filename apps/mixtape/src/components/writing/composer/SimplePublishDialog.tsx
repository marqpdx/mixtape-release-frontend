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
  Textarea,
  Separator,
  Link,
  Input,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { toaster } from '@mixtape/core/lib/toaster'
import { useWritingMutations } from '@hooks/useWriting'
import * as stackroomApi from '@mixtape/api/clients/stackroom/stackroomApi'
import * as writingApi from '@mixtape/api/clients/writing/writingApi'
import {
  fetchDistributionSources,
  distributePiece,
  type DistributionSource,
  type ShareRecordResult,
} from '@mixtape/api/clients/distribution/distributionApi'

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
type PublishTiming = 'now' | 'later'

const getErrorMessage = (error: unknown): string | undefined => {
  if (error && typeof error === 'object') {
    const data = (error as { response?: { data?: { error?: string } } }).response?.data
    if (data?.error) return data.error
  }
  if (error instanceof Error) return error.message
  return undefined
}

// Returns "YYYY-MM-DDTHH:mm" for the datetime-local input minimum
function toDatetimeLocalMin(): string {
  return new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)
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
  const [publishTiming, setPublishTiming] = useState<PublishTiming>('now')
  const [scheduledFor, setScheduledFor] = useState('')
  const [selectedShelves, setSelectedShelves] = useState<string[]>([])
  const [postToGroup, setPostToGroup] = useState(false)
  const [pinAsWelcome, setPinAsWelcome] = useState(false)

  // Distribution state
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [linkedinCopy, setLinkedinCopy] = useState('')
  const [synopsisLoading, setSynopsisLoading] = useState(false)
  const [shareResults, setShareResults] = useState<ShareRecordResult[] | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

  const { publishPiece } = useWritingMutations(sponsorType, sponsorSlug || 'unknown')

  const isMemberSponsor = sponsorType === 'member'
  const shouldShowShelves = audience === 'readers' && isMemberSponsor
  const shouldShowGroup = audience === 'readers' && sponsorType === 'group'
  const isScheduling = publishTiming === 'later'

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

  const {
    data: sources = [],
    isLoading: sourcesLoading,
  } = useQuery<DistributionSource[]>({
    queryKey: ['distribution', 'sources', sponsorSlug],
    queryFn: () => fetchDistributionSources(sponsorType === 'group' ? sponsorSlug : undefined),
    enabled: isOpen && audience === 'readers',
  })

  const linkedinShareUrl = shareResults?.find((r) => r.source_kind === 'linkedin')?.channel_response?.linkedin_share_url as string | undefined

  const toggleShelf = (shelfId: string, checked: boolean) => {
    setSelectedShelves((prev) => {
      if (checked) return Array.from(new Set([...prev, shelfId]))
      return prev.filter((id) => id !== shelfId)
    })
  }

  const toggleSource = (sourceId: string, checked: boolean) => {
    setSelectedSourceIds((prev) => {
      if (checked) return Array.from(new Set([...prev, sourceId]))
      return prev.filter((id) => id !== sourceId)
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

  const handleLoadSynopsis = async () => {
    setSynopsisLoading(true)
    try {
      const result = await writingApi.fetchPieceSynopsis(piece.id)
      if (result?.synopsis) {
        setLinkedinCopy(result.synopsis)
      } else {
        toaster.create({
          title: 'No synopsis available',
          description: 'Generate a synopsis from the editor first.',
          type: 'info',
        })
      }
    } catch {
      toaster.create({ title: 'Could not load synopsis', type: 'error' })
    } finally {
      setSynopsisLoading(false)
    }
  }

  const handlePublish = async () => {
    if (isScheduling && !scheduledFor) {
      toaster.create({
        title: 'Choose a publish date',
        description: 'Set when this piece should go live.',
        type: 'warning',
      })
      return
    }

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

    setIsPublishing(true)
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

      const scheduledForISO = isScheduling && scheduledFor
        ? new Date(scheduledFor).toISOString()
        : undefined

      const response = await publishPiece.mutateAsync({
        pieceId: piece.id,
        payload: {
          title: titleRef.current,
          body_json: docJSONRef.current,
          excerpt: excerptRef.current,
          audience,
          scheduled_for: scheduledForISO ?? null,
          destinations,
          group_overrides: groupOverrides,
          placement_options: {
            follow_updates: true,
          },
        },
      })

      // Fire distribution channels if any selected (only on immediate publish)
      if (!isScheduling && audience === 'readers' && selectedSourceIds.length > 0) {
        try {
          const sourcesConfig = selectedSourceIds.map((sourceId) => {
            const source = sources.find((s) => s.id === sourceId)
            const config: Record<string, unknown> = {}
            if (source?.kind === 'linkedin' && linkedinCopy) {
              config.post_copy = linkedinCopy
            }
            return { source_id: sourceId, config }
          })

          const distributeResult = await distributePiece(piece.id, sourcesConfig)
          setShareResults(distributeResult.results)

          const failed = distributeResult.results.filter((r) => r.status === 'failed')
          if (failed.length > 0) {
            toaster.create({
              title: 'Some channels failed',
              description: failed.map((r) => `${r.source_label}: ${r.failure_reason}`).join('; '),
              type: 'warning',
            })
          }
        } catch (distError: unknown) {
          toaster.create({
            title: 'Distribution partially failed',
            description: getErrorMessage(distError) ?? 'Piece published but some channels could not be reached.',
            type: 'warning',
          })
        }
      }

      if (isScheduling && scheduledFor) {
        toaster.create({
          title: 'Scheduled',
          description: `Will publish on ${format(new Date(scheduledFor), "MMM d, yyyy 'at' h:mm a")}.`,
          type: 'success',
        })
        onPublished?.(response.piece)
        onClose()
      } else {
        toaster.create({
          title: 'Published',
          description:
            audience === 'just_me'
              ? 'This piece is published and visible only to you.'
              : 'This piece is published and placed where you selected.',
          type: 'success',
        })
        onPublished?.(response.piece)
        if (!linkedinShareUrl) {
          onClose()
        }
      }
    } catch (error: unknown) {
      toaster.create({
        title: isScheduling ? 'Schedule failed' : 'Publish failed',
        description: getErrorMessage(error),
        type: 'error',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // Post-publish state: show LinkedIn share link
  if (shareResults && linkedinShareUrl) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={({ open }: { open: boolean }) => !open && onClose()}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="520px">
            <Dialog.Header>
              <Heading size="md">Published</Heading>
              <Text fontSize="sm" color="gray.500" mt={2}>
                Your piece is live. Share it now.
              </Text>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4} align="stretch">
                <Box borderWidth="1px" borderRadius="md" p={4} bg="green.50">
                  <Text fontWeight="semibold" fontSize="sm" mb={1}>LinkedIn</Text>
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    Your post copy is ready. Click to open LinkedIn and share.
                  </Text>
                  <Link
                    href={linkedinShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" colorPalette="blue">
                      Open LinkedIn →
                    </Button>
                  </Link>
                </Box>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <HStack justify="flex-end" w="100%">
                <Button onClick={onClose}>Done</Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    )
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

              {/* Who is this for? */}
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

              {/* When? */}
              <VStack gap={3} align="stretch">
                <Heading size="sm">When?</Heading>
                <RadioGroup.Root
                  value={publishTiming}
                  onValueChange={({ value }) => {
                    setPublishTiming(value as PublishTiming)
                    if (value === 'now') setScheduledFor('')
                  }}
                >
                  <VStack align="stretch" gap={3}>
                    <RadioGroup.Item value="now">
                      <RadioGroup.ItemHiddenInput />
                      <HStack align="start" gap={3}>
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText fontWeight="semibold">Publish now</RadioGroup.ItemText>
                      </HStack>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="later">
                      <RadioGroup.ItemHiddenInput />
                      <HStack align="start" gap={3}>
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText fontWeight="semibold">Schedule for later</RadioGroup.ItemText>
                      </HStack>
                    </RadioGroup.Item>
                  </VStack>
                </RadioGroup.Root>

                {isScheduling && (
                  <Box pl={6}>
                    <Input
                      type="datetime-local"
                      size="sm"
                      value={scheduledFor}
                      min={toDatetimeLocalMin()}
                      onChange={(e) => setScheduledFor(e.target.value)}
                    />
                    {scheduledFor && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {format(new Date(scheduledFor), "EEEE, MMMM d 'at' h:mm a")}
                      </Text>
                    )}
                  </Box>
                )}
              </VStack>

              {/* Where? */}
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
                            Create "My Writing" shelf
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
                              Place this on your group's noticeboard.
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
                              Show this as the group's welcome note.
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

              {/* External channels — only shown for immediate publish */}
              {audience === 'readers' && !isScheduling && (
                <>
                  <Separator />
                  <VStack gap={3} align="stretch">
                    <Heading size="sm">Share externally</Heading>

                    {sourcesLoading && (
                      <HStack gap={2} color="gray.500">
                        <Spinner size="sm" />
                        <Text fontSize="sm">Loading channels...</Text>
                      </HStack>
                    )}

                    {!sourcesLoading && sources.length === 0 && (
                      <Text fontSize="sm" color="gray.500">
                        No external channels configured.
                      </Text>
                    )}

                    {!sourcesLoading && sources.length > 0 && (
                      <VStack gap={3} align="stretch">
                        {sources.map((source) => {
                          const checked = selectedSourceIds.includes(source.id)
                          return (
                            <VStack key={source.id} align="stretch" gap={2}>
                              <Checkbox.Root
                                checked={checked}
                                onCheckedChange={({ checked: next }: { checked: boolean | string }) =>
                                  toggleSource(source.id, !!next)
                                }
                              >
                                <Checkbox.HiddenInput />
                                <HStack align="start" gap={2}>
                                  <Checkbox.Control>
                                    <Checkbox.Indicator />
                                  </Checkbox.Control>
                                  <VStack align="start" gap={0}>
                                    <Checkbox.Label fontWeight="semibold" fontSize="sm">
                                      {source.label}
                                    </Checkbox.Label>
                                    <Text fontSize="xs" color="gray.500">
                                      {source.kind === 'activity_stream' && 'Post to the group activity stream.'}
                                      {source.kind === 'linkedin' && 'Share a link post on LinkedIn.'}
                                      {source.kind === 'email' && 'Send as a newsletter email.'}
                                      {source.kind === 'rss' && 'Include in RSS feed.'}
                                    </Text>
                                  </VStack>
                                </HStack>
                              </Checkbox.Root>

                              {source.kind === 'linkedin' && checked && (
                                <Box pl={6}>
                                  <HStack justify="space-between" mb={1}>
                                    <Text fontSize="xs" color="gray.600">
                                      Post copy (optional)
                                    </Text>
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      colorPalette="blue"
                                      loading={synopsisLoading}
                                      onClick={handleLoadSynopsis}
                                    >
                                      Use synopsis →
                                    </Button>
                                  </HStack>
                                  <Textarea
                                    size="sm"
                                    placeholder="Add a note to accompany the link…"
                                    value={linkedinCopy}
                                    onChange={(e) => setLinkedinCopy(e.target.value)}
                                    rows={4}
                                  />
                                  <Text fontSize="xs" color="gray.400" mt={1}>
                                    LinkedIn will attach a link preview automatically.
                                  </Text>
                                </Box>
                              )}
                            </VStack>
                          )
                        })}
                      </VStack>
                    )}
                  </VStack>
                </>
              )}

              {/* Scheduling note: remind that distribution fires at publish time */}
              {audience === 'readers' && isScheduling && (
                <Text fontSize="xs" color="gray.500">
                  External sharing (LinkedIn, email) will be available after the piece goes live.
                </Text>
              )}

            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <HStack justify="space-between" w="100%">
              <Button variant="ghost" onClick={onClose} disabled={isPublishing}>Cancel</Button>
              <Button colorPalette="green" onClick={handlePublish} loading={isPublishing}>
                {isScheduling ? 'Schedule' : 'Publish'}
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
