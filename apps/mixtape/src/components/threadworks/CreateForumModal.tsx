// src/components/threadworks/CreateForumModal.tsx

import { VStack, Text, Input, Textarea, HStack, Button, Box, Checkbox, Stack } from '@chakra-ui/react'
import { useState, useMemo } from 'react'
import { Switch } from '@chakra-ui/react'
import { CreateForumData, ForumVisibility, ForumAudienceType } from '@mixtape/core/types/threadworksTypes'
import AdminModal from '@components/admin/AdminModal'
import { useMembers } from '@mixtape/api/hooks'

interface CreateForumModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateForumData) => Promise<void>
  isSubmitting: boolean
  groupSlug?: string
}

export default function CreateForumModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  groupSlug,
}: CreateForumModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<ForumVisibility>('group')
  const [audienceType, setAudienceType] = useState<ForumAudienceType>('all_members')
  const [autoAdd, setAutoAdd] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [memberSearch, setMemberSearch] = useState('')

  const { members } = useMembers(groupSlug || '')

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    if (!q) return members
    return members.filter(
      (m) =>
        m.username?.toLowerCase().includes(q) ||
        m.display_name?.toLowerCase().includes(q)
    )
  }, [members, memberSearch])

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const reset = () => {
    setTitle('')
    setDescription('')
    setVisibility('group')
    setAudienceType('all_members')
    setAutoAdd(true)
    setSelectedIds(new Set())
    setMemberSearch('')
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    const data: CreateForumData = {
      title,
      description,
      visibility,
      audience_type: audienceType,
      auto_add_new_members: audienceType === 'all_members' ? autoAdd : false,
      member_ids: audienceType === 'subset' ? Array.from(selectedIds) : undefined,
    }
    try {
      await onSubmit(data)
      reset()
    } catch (error) {
      console.error('Error creating forum:', error)
    }
  }

  return (
    <AdminModal
      title="Create New Conversation"
      isOpen={isOpen}
      onClose={() => { onClose(); reset() }}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitText="Create Conversation"
    >
      <VStack gap={4}>
        {/* Title */}
        <VStack align="start" gap={2} w="100%">
          <Text fontWeight="semibold">Title</Text>
          <Input
            placeholder="Conversation title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </VStack>

        {/* Description */}
        <VStack align="start" gap={2} w="100%">
          <Text fontWeight="semibold">Description</Text>
          <Textarea
            placeholder="Describe the purpose of this conversation"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            resize="vertical"
            minH="80px"
          />
        </VStack>

        {/* Visibility */}
        <VStack align="start" gap={2} w="100%">
          <Text fontWeight="semibold">Visibility</Text>
          <HStack gap={3}>
            {(['public', 'members', 'group'] as ForumVisibility[]).map((vis) => (
              <Button
                key={vis}
                variant={visibility === vis ? 'solid' : 'outline'}
                colorScheme={visibility === vis ? 'green' : 'gray'}
                onClick={() => setVisibility(vis)}
                size="sm"
              >
                {vis.charAt(0).toUpperCase() + vis.slice(1)}
              </Button>
            ))}
          </HStack>
        </VStack>

        {/* Audience */}
        <VStack align="start" gap={3} w="100%">
          <Text fontWeight="semibold">Audience</Text>

          <HStack gap={4}>
            <Button
              variant={audienceType === 'all_members' ? 'solid' : 'outline'}
              colorScheme={audienceType === 'all_members' ? 'green' : 'gray'}
              onClick={() => setAudienceType('all_members')}
              size="sm"
            >
              All Group Members
            </Button>
            <Button
              variant={audienceType === 'subset' ? 'solid' : 'outline'}
              colorScheme={audienceType === 'subset' ? 'green' : 'gray'}
              onClick={() => setAudienceType('subset')}
              size="sm"
            >
              Specific Members
            </Button>
          </HStack>

          {audienceType === 'all_members' && (
            <HStack justify="space-between" w="100%" bg="bg.subtle" p={3} borderRadius="md">
              <Box>
                <Text fontSize="sm" fontWeight="medium">Automatically include new members</Text>
                <Text fontSize="xs" color="fg.muted">
                  New members joining this group will have access to all past postings.
                </Text>
              </Box>
              <Switch.Root
                checked={autoAdd}
                onCheckedChange={(e) => setAutoAdd(e.checked)}
              >
                <Switch.HiddenInput />
                <Switch.Control><Switch.Thumb /></Switch.Control>
              </Switch.Root>
            </HStack>
          )}

          {audienceType === 'subset' && (
            <Box w="100%" border="1px solid" borderColor="border.default" borderRadius="md" p={3}>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Select members ({selectedIds.size} selected)
              </Text>
              <Input
                placeholder="Search members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                size="sm"
                mb={2}
              />
              <Stack gap={1} maxH="200px" overflowY="auto">
                {filteredMembers.map((m) => (
                  <Checkbox.Root
                    key={m.member_id}
                    checked={selectedIds.has(m.member_id)}
                    onCheckedChange={() => toggleMember(m.member_id)}
                    size="sm"
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>
                      <Text fontSize="sm">
                        {m.display_name || m.username}
                        {m.username && m.display_name && (
                          <Text as="span" fontSize="xs" color="fg.muted" ml={1}>
                            @{m.username}
                          </Text>
                        )}
                      </Text>
                    </Checkbox.Label>
                  </Checkbox.Root>
                ))}
                {filteredMembers.length === 0 && (
                  <Text fontSize="sm" color="fg.muted">No members found</Text>
                )}
              </Stack>
            </Box>
          )}
        </VStack>
      </VStack>
    </AdminModal>
  )
}
