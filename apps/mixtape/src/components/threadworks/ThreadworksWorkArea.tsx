// src/components/threadworks/ThreadworksWorkArea.tsx

"use client"

import { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Flex,
  Spinner,
  HStack,
  Link,
} from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import WorkAreaWrapper from '@components/dashboard/shared/WorkAreaWrapper'
import { Tooltip } from "@components/ui/tooltip"
import { IconPlus, IconMessages, IconAdjustmentsCancel } from '@tabler/icons-react'
import {
  useThreadworks,
  useThreadworksMutations,
} from '@hooks/threadworks/useThreadworks'
import { CreateForumData } from '@mixtape/core/types/threadworksTypes'
import ForumList from './ForumList'
import CreateForumModal from './CreateForumModal'
import { useMyPermissions } from '@mixtape/api/hooks/groups/useGroupPermissions'
import NextLink from 'next/link'

interface ThreadworksWorkAreaProps {
  section: string
  sectionParams?: Record<string, string>
  setActiveSection: (section: string, params?: Record<string, string>) => void
  groupSlug?: string
}

export default function ThreadworksWorkArea({
  section,
  setActiveSection,
  groupSlug,
}: ThreadworksWorkAreaProps) {
  void section
  const [expandedForums, setExpandedForums] = useState<string[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const bgColor = useColorModeValue('transparent', 'gray.900')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const { data: myPermissions } = useMyPermissions(groupSlug || '')
  const canManageThreadworks =
    !!groupSlug &&
    (myPermissions?.is_admin || myPermissions?.decorators?.includes('can__ManageThreadworks') || false)
  const adminThreadworksHref = groupSlug
    ? `/groups/${groupSlug}?view=admin&section=threadworks-landing`
    : '/app/dashboard'

  // Fetch forums - include refreshTrigger in dependencies to refetch on demand
  const { forums, isLoading, error, refetch } = useThreadworks(groupSlug)
  const mutations = useThreadworksMutations(groupSlug)

  // Load last viewed forum from session storage
  useEffect(() => {
    const lastViewedForumId = sessionStorage.getItem('lastViewedForumId')
    if (lastViewedForumId) {
      setExpandedForums([lastViewedForumId])
    }
  }, [])

  const handleForumToggle = (forumIds: string[]) => {
    setExpandedForums(forumIds)
    if (forumIds.length > 0) {
      sessionStorage.setItem('lastViewedForumId', forumIds[forumIds.length - 1])
    }
  }

  const handleCreateForum = async (data: CreateForumData) => {
    try {
      await mutations.createForum(data)
      setCreateModalOpen(false)
      // Refetch forums after creating new one
      refetch()
    } catch (err) {
      console.error('Failed to create forum:', err)
    }
  }

  // Callback when discussion is created - refetch the forum
  // if (section !== 'threadworks') {
  //   return (
  //     <WorkAreaWrapper>
  //       <Text>Threadworks section not found</Text>
  //     </WorkAreaWrapper>
  //   )
  // }

  if (isLoading) {
    return (
      <WorkAreaWrapper>
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" color="green.500" />
        </Flex>
      </WorkAreaWrapper>
    )
  }

  return (
    <WorkAreaWrapper>
      <Box bg={bgColor} py={4}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="start" gap={2}>
            <Heading size="2xl" color="green.500">
              Threadworks Conversations
            </Heading>
            <Text color={textColor} fontSize="sm">
              Community forums for long-ranging discussion
            </Text>
          </VStack>

          <HStack>
            {/* Close All Discussions Button */}
            {expandedForums.length > 1 && (
              <Button
                variant="ghost"
                // size="sm"
                // mb={4}
                onClick={() => setExpandedForums([])}
              >
                <Tooltip content="Close all open forums">
                  <IconAdjustmentsCancel size={18} />
                </Tooltip>
              </Button>
            )}
            {canManageThreadworks && (
              <Button
                colorScheme="green"
                onClick={() => setCreateModalOpen(true)}
                disabled={mutations.isCreatingForum}
              >
                <IconPlus size={18} />
                New Forum
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Empty State */}
        {forums.length === 0 ? (
          <Box textAlign="center" py={12}>
            <IconMessages size={48} style={{ margin: '0 auto 16px', color: 'var(--chakra-colors-gray-500)' }} />
            <Heading size="md" mb={2}>
              No forums yet
            </Heading>
            <Text color={textColor} mb={4}>
              {canManageThreadworks ? (
                <Link as={NextLink} href={adminThreadworksHref} color="green.500" textDecoration="underline">
                  Click here to create your first forum
                </Link>
              ) : (
                'Ask a group steward to create your first forum'
              )}
            </Text>
            {canManageThreadworks && (
              <Link as={NextLink} href={adminThreadworksHref}>
                <Button colorScheme="green">
                  Create Forum
                </Button>
              </Link>
            )}
          </Box>
        ) : (
          <>
            {/* Close All Discussions Button
            {expandedForums.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                mb={4}
                onClick={() => setExpandedForums([])}
              >
                Close all discussions
              </Button>
            )} */}

            {/* Forums Accordion */}
            <ForumList
              forums={forums}
              expandedForums={expandedForums}
              onForumToggle={handleForumToggle}
              groupSlug={groupSlug}
              setActiveSection={setActiveSection}
              onDiscussionCreated={refetch}
            />
          </>
        )}

        {/* Error Display */}
        {error && (
          <Box mt={4} p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
            <Text color="red.600" fontSize="sm">
              Error loading forums: {error.message}
            </Text>
          </Box>
        )}

        {/* Create Forum Modal */}
        <CreateForumModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateForum}
          isSubmitting={mutations.isCreatingForum}
          groupSlug={groupSlug}
        />
      </Box>
    </WorkAreaWrapper>
  )
}
