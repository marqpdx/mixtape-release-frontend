// src/components/threadworks/CreateDiscussionModal.tsx

import { VStack, Text, Input, Textarea } from '@chakra-ui/react'
import AdminModal from '@components/admin/AdminModal'
import { useState } from 'react'
import { CreateDiscussionData, Forum } from '@mixtape/core/types/threadworksTypes'

interface CreateDiscussionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (forumSlug: string, data: CreateDiscussionData) => Promise<void>
  isSubmitting: boolean
  forums?: Forum[]
  defaultForumSlug?: string
}

export default function CreateDiscussionModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  forums,
  defaultForumSlug,
}: CreateDiscussionModalProps) {
  const [selectedForumSlug, setSelectedForumSlug] = useState(defaultForumSlug || forums?.[0]?.slug || '')
  const [formData, setFormData] = useState<CreateDiscussionData>({
    title: '',
    description: '',
    content: '',
  })

  const showForumPicker = forums && forums.length > 1

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return
    if (showForumPicker && !selectedForumSlug) return
    try {
      await onSubmit(selectedForumSlug, formData)
      setFormData({ title: '', description: '', content: '' })
    } catch (error) {
      console.error('Error creating discussion:', error)
    }
  }

  const handleClose = () => {
    onClose()
    setFormData({ title: '', description: '', content: '' })
  }

  return (
    <AdminModal
      title="Start a New Discussion"
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitText="Create Discussion"
    >
      <VStack gap={4}>
        {showForumPicker && (
          <VStack align="start" gap={2} w="100%">
            <Text fontWeight="semibold">Forum</Text>
            <select
              style={{ width: '100%', fontSize: '0.875rem', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--chakra-colors-border-muted)' }}
              value={selectedForumSlug}
              onChange={(e) => setSelectedForumSlug(e.target.value)}
            >
              <option value="">Select a forum…</option>
              {forums.map((f) => (
                <option key={f.slug} value={f.slug}>{f.title}</option>
              ))}
            </select>
          </VStack>
        )}

        <VStack align="start" gap={2} w="100%">
          <Text fontWeight="semibold">Discussion Title</Text>
          <Input
            placeholder="What's this discussion about?"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </VStack>

        <VStack align="start" gap={2} w="100%">
          <Text fontWeight="semibold">Description (optional)</Text>
          <Textarea
            placeholder="Add context or details about this discussion..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            resize="vertical"
            minH="60px"
          />
        </VStack>

        <VStack align="start" gap={2} w="100%">
          <Text fontWeight="semibold">Your First Post</Text>
          <Textarea
            placeholder="Start the conversation..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            resize="vertical"
            minH="100px"
          />
          <Text fontSize="xs" color="gray.500">
            Required
          </Text>
        </VStack>
      </VStack>
    </AdminModal>
  )
}
