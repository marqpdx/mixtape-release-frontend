// src/components/workbench/compose/RichTextInput.tsx
'use client';

import { useState, useMemo } from 'react';
import { Box, Input, Textarea, VStack, Button, Text, Select, createListCollection } from '@chakra-ui/react';
import { useCreateMillDraft } from '@mixtape/api/hooks/workbench';
import { useContentProfiles } from '@mixtape/api/hooks/workbench';
import { toaster } from '@mixtape/core/lib/toaster';

interface RichTextInputProps {
  groupId: string;
  onDraftCreated?: (draftId: string) => void;
}

export function RichTextInput({ groupId, onDraftCreated }: RichTextInputProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [contentProfile, setContentProfile] = useState('writing');

  const { profiles } = useContentProfiles();
  const { mutate: createDraft, isPending } = useCreateMillDraft();

  // Create collection for Select component
  const profilesCollection = useMemo(
    () =>
      createListCollection({
        items: profiles.map((profile) => ({
          label: profile.display_name,
          value: profile.profile_name,
        })),
      }),
    [profiles]
  );

  const handleCreateDraft = () => {
    if (!title.trim()) {
      toaster.create({
        title: 'Title Required',
        description: 'Please enter a title for your draft',
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    createDraft(
      {
        sponsor_type: 'group',
        sponsor_id: groupId,
        content_profile: contentProfile,
        title: title.trim(),
        summary: summary.trim(),
        grist_body: content.trim(),
        source_type: 'manual',
        source_id: `manual-${Date.now()}`,
      },
      {
        onSuccess: (draft) => {
          toaster.create({
            title: 'Draft Created',
            description: 'Opening in editor...',
            type: 'success',
            duration: 2000,
          });

          // Clear form
          setTitle('');
          setSummary('');
          setContent('');

          // Notify parent to switch tabs and open editor
          if (onDraftCreated) {
            onDraftCreated(draft.id);
          }
        },
        onError: (error: Error) => {
          toaster.create({
            title: 'Failed to Create Draft',
            description: error.message,
            type: 'error',
            duration: 5000,
          });
        },
      }
    );
  };

  return (
    <VStack align="stretch" gap={4}>
      {/* Info */}
      <Box>
        <Text fontSize="lg" fontWeight="semibold" mb={2}>
          Rich Text Input
        </Text>
        <Text fontSize="sm" color="gray.600">
          Create a new draft with traditional title, summary, and content fields.
        </Text>
      </Box>

      {/* Content Profile */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          Content Type
        </Text>
        <Select.Root
          value={[contentProfile]}
          onValueChange={(e) => setContentProfile(e.value[0])}
          collection={profilesCollection}
          size="sm"
        >
          <Select.Trigger>
            <Select.ValueText placeholder="Select content type" />
          </Select.Trigger>
          <Select.Content>
            {profilesCollection.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Box>

      {/* Title */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          Title <Text as="span" color="red.500">*</Text>
        </Text>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter draft title"
          size="md"
        />
      </Box>

      {/* Summary */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          Summary
        </Text>
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Brief summary or excerpt"
          rows={3}
          size="sm"
        />
      </Box>

      {/* Content */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          Content
        </Text>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Main content goes here..."
          rows={12}
          size="sm"
        />
      </Box>

      {/* Actions */}
      <Button
        onClick={handleCreateDraft}
        loading={isPending}
        colorScheme="blue"
        disabled={!title.trim()}
      >
        Create Draft & Edit →
      </Button>
    </VStack>
  );
}
