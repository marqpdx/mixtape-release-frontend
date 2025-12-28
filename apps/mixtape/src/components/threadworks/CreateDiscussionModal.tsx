// src/components/threadworks/CreateDiscussionModal.tsx

import { VStack, Text, Input, Textarea, HStack } from '@chakra-ui/react'
import AdminModal from '@components/admin/AdminModal'
import { useState } from 'react'
import { CreateDiscussionData } from '@mixtape/core/types/threadworksTypes'

interface CreateDiscussionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateDiscussionData) => Promise<void>
  isSubmitting: boolean
}

export default function CreateDiscussionModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateDiscussionModalProps) {
  const [formData, setFormData] = useState<CreateDiscussionData>({
    title: '',
    description: '',
    content: '',
  })

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return
    try {
      await onSubmit(formData)
      setFormData({ title: '', description: '', content: '' })
    } catch (error) {
      console.error('Error creating discussion:', error)
    }
  }

  return (
    <AdminModal
      title="Start a New Discussion"
      isOpen={isOpen}
      onClose={() => {
        onClose()
        setFormData({ title: '', description: '', content: '' })
      }}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitText="Create Discussion"
    >
      <VStack gap={4}>
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