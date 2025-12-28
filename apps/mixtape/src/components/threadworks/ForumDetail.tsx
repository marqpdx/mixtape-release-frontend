// src/components/threadworks/ForumDetail.tsx

import { useEffect, useState } from 'react'
import { Box, Text, VStack, Input, InputGroup, Button, useDisclosure, HStack, Heading } from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import { Divider } from '@components/common/Divider'
import { IconSearch, IconPlus, IconBrandMastodon } from '@tabler/icons-react'
import { Forum, CreateDiscussionData } from '@mixtape/core/types/threadworksTypes'
import { useThreadworksMutations } from '@hooks/threadworks/useThreadworks'
import DiscussionList from './DiscussionList'
import DiscussionDetail from './DiscussionDetail'
import CreateDiscussionModal from './CreateDiscussionModal'
import { useRealtimeEvents } from '@hooks/threadworks/useRealtimeEvents'

interface ForumDetailProps {
  forum: Forum
  groupSlug?: string
  setActiveSection: (section: string, params?: Record<string, string>) => void
  onDiscussionCreated?: () => void
}

export default function ForumDetail({
  forum,
  groupSlug,
  setActiveSection,
  onDiscussionCreated,
}: ForumDetailProps) {
  const [searchFilter, setSearchFilter] = useState('')
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null)
  const [newDiscussionCreators, setNewDiscussionCreators] = useState<Set<string>>(new Set())

  const { joinRoom, leaveRoom, subscribe } = useRealtimeEvents()
  const textColor = useColorModeValue('gray.600', 'gray.300')

  const { open, onOpen, onClose } = useDisclosure()
  const mutations = useThreadworksMutations(groupSlug)

  const discussions = forum.discussions || []
  const selectedDiscussion = selectedDiscussionId
    ? discussions.find((d) => d.id === selectedDiscussionId)
    : null

  useEffect(() => {
    const saved = sessionStorage.getItem(`lastDiscussion-${forum.slug}`)
    if (saved) {
      setSelectedDiscussionId(saved)
    }
  }, [forum.slug])

  // Join forum room on mount
  useEffect(() => {
    joinRoom('forum', forum.slug)

    // Subscribe to new discussion events
    const unsubscribeDiscussion = subscribe(
      'forum',
      forum.slug,
      'discussion_created',
      (payload, user) => {
        // Show "X is creating a discussion..." indicator
        setNewDiscussionCreators((prev) => new Set([...prev, user]))
        setTimeout(() => {
          setNewDiscussionCreators((prev) => {
            const next = new Set(prev)
            next.delete(user)
            return next
          })
        }, 2000)
      }
    )

    return () => {
      leaveRoom('forum', forum.slug)
      unsubscribeDiscussion()
    }
  }, [forum.slug, joinRoom, leaveRoom, subscribe])

  const handleSelectDiscussion = (id: string) => {
    setSelectedDiscussionId(id)
    sessionStorage.setItem(`lastDiscussion-${forum.slug}`, id)
  }

  const handleCreateDiscussion = async (data: CreateDiscussionData) => {
    try {
      await mutations.createDiscussion(forum.slug, data)
      onClose()
      // Refresh discussions list
      if (onDiscussionCreated) {
        onDiscussionCreated()
      }
    } catch (error) {
      console.error('Failed to create discussion:', error)
    }
  }

  return (
    <VStack align="stretch" gap={0}>
      {!selectedDiscussion ? (
        <>
          {/* Forum Description */}
          {/* {forum.description && (
            <Text fontSize="sm" color={textColor}>
              {forum.description}
            </Text>
          )} */}

          {/* New discussion indicator */}
          {newDiscussionCreators.size > 0 && (
            <Text fontSize="xs" color="gray.500" fontStyle="italic">
              {Array.from(newDiscussionCreators).join(', ')} {newDiscussionCreators.size === 1 ? 'is' : 'are'} creating a discussion...
            </Text>
          )}

          {/* Discussions Header with New Discussion Button */}
          <HStack justify="space-between" align="center" my={0} mb={2}>
            <Heading as="h3" size="lg" fontWeight="bold">
              <HStack>
                <Text fontStyle={'italic'}>{forum.title}</Text> <Text fontWeight={'normal'}>discussions</Text>
              </HStack>
            </Heading>
            <Button
              size="sm"
              colorScheme="green"
              onClick={onOpen}
              disabled={mutations.isCreatingDiscussion}
              p={2}
              variant="ghost"
            >
              <IconPlus size={18} />
            </Button>
          </HStack>

          {/* <Divider my={3} /> */}

          {/* Search Bar */}
          {discussions.length > 5 && (
            <InputGroup startElement={<IconSearch size={16} />}>
              <Input
                placeholder="Search discussions..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                size="sm"
              />
            </InputGroup>
          )}

          {/* Discussions List */}
          <DiscussionList
            discussions={discussions}
            searchFilter={searchFilter}
            onDiscussionSelect={handleSelectDiscussion}
          />
        </>
      ) : (
        <DiscussionDetail
          discussion={selectedDiscussion}
          onBack={() => setSelectedDiscussionId(null)}
          forumSlug={forum.slug}
          groupSlug={groupSlug}
        />
      )}

      {/* Create Discussion Modal */}
      <CreateDiscussionModal
        isOpen={open}
        onClose={onClose}
        onSubmit={handleCreateDiscussion}
        isSubmitting={mutations.isCreatingDiscussion}
      />
    </VStack>
  )
}