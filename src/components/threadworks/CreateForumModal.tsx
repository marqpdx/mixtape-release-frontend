// src/components/threadworks/CreateForumModal.tsx

import { VStack, Text, Input, Textarea, HStack, Button } from '@chakra-ui/react'
import { useState } from 'react'
import { CreateForumData, ForumVisibility } from '@/types/threadworksTypes'
import AdminModal from '@components/admin/AdminModal'

interface CreateForumModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateForumData) => Promise<void>
  isSubmitting: boolean
}

export default function CreateForumModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateForumModalProps) {
  const [formData, setFormData] = useState<CreateForumData>({
    title: '',
    description: '',
    visibility: 'public',
  })

  const handleSubmit = async () => {
    if (!formData.title.trim()) return
    try {
      await onSubmit(formData)
      setFormData({ title: '', description: '', visibility: 'public' })
    } catch (error) {
      console.error('Error creating forum:', error)
    }
  }

  return (
    <AdminModal
      title="Create New Forum"
      isOpen={isOpen}
      onClose={() => {
        onClose()
        setFormData({ title: '', description: '', visibility: 'public' })
      }}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitText="Create Forum"
    >
      <VStack gap={4}>
        <VStack align="start" gap={2} w="100%">
          <Text fontWeight="semibold">Forum Title</Text>
          <Input
            placeholder="Enter forum title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </VStack>

        <VStack align="start" gap={2} w="100%">
          <Text fontWeight="semibold">Description</Text>
          <Textarea
            placeholder="Describe the purpose of this forum"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            resize="vertical"
            minH="100px"
          />
        </VStack>

        <VStack align="start" gap={2} w="100%">
          <Text fontWeight="semibold">Visibility</Text>
          <HStack gap={4} w="100%">
            {(['public', 'members', 'group'] as ForumVisibility[]).map((vis) => (
              <Button
                key={vis}
                variant={formData.visibility === vis ? 'solid' : 'outline'}
                colorScheme={formData.visibility === vis ? 'green' : 'gray'}
                onClick={() => setFormData({ ...formData, visibility: vis })}
                size="sm"
              >
                {vis.charAt(0).toUpperCase() + vis.slice(1)}
              </Button>
            ))}
          </HStack>
        </VStack>
      </VStack>
    </AdminModal>
  )
}