// apps/mixtape/src/components/earthlab/LessonEditForm.tsx

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box, Button, HStack, VStack, Input, Textarea, Text, Spinner,
  Fieldset, Select, Field, Portal,
  createListCollection,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLessonDetail, updateLesson } from '@mixtape/api/clients/earthlab/earthlabApi';
import type { LessonFormData } from '@mixtape/api/clients/earthlab/earthlabApi';
import { toaster } from '@/components/ui/toaster';
import TipTapEditor from '@/components/editor/TipTapEditor';
import type { JSONContent } from '@tiptap/react';

const statusCollection = createListCollection({
  items: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
    { label: 'Archived', value: 'archived' },
  ],
});

const difficultyCollection = createListCollection({
  items: [
    { label: '(None)', value: '' },
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
  ],
});

interface LessonEditFormProps {
  groupSlug: string;
  lessonSlug: string;
  onBack: () => void;
}

export function LessonEditForm({ groupSlug, lessonSlug, onBack }: LessonEditFormProps) {
  const queryClient = useQueryClient();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['earthlab', 'lesson', groupSlug, lessonSlug],
    queryFn: () => fetchLessonDetail(groupSlug, lessonSlug),
  });

  const { register, handleSubmit, setValue, watch, reset } = useForm<LessonFormData>({
    defaultValues: {
      title: '',
      summary: '',
      status: 'draft',
      difficulty_level: '',
      estimated_duration: null,
    },
  });

  useEffect(() => {
    if (lesson) {
      reset({
        title: lesson.title,
        summary: lesson.summary,
        status: lesson.status,
        difficulty_level: lesson.difficulty_level,
        estimated_duration: lesson.estimated_duration,
      });
    }
  }, [lesson, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<LessonFormData>) =>
      updateLesson(groupSlug, lessonSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earthlab', 'lessons', groupSlug] });
      queryClient.invalidateQueries({ queryKey: ['earthlab', 'lesson', groupSlug, lessonSlug] });
    },
  });

  const saveMetadata = useMutation({
    mutationFn: (data: Partial<LessonFormData>) =>
      updateLesson(groupSlug, lessonSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earthlab', 'lessons', groupSlug] });
      queryClient.invalidateQueries({ queryKey: ['earthlab', 'lesson', groupSlug, lessonSlug] });
      toaster.create({ title: 'Lesson saved', type: 'success' });
    },
    onError: () => {
      toaster.create({ title: 'Failed to save', type: 'error' });
    },
  });

  const debouncedContentSave = useCallback((content: JSONContent) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveMutation.mutate({ tiptap_json: content as Record<string, unknown> });
    }, 2500);
  }, [saveMutation]);

  const onSubmitMetadata = (data: LessonFormData) => {
    saveMetadata.mutate(data);
  };

  if (isLoading || !lesson) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={6}>
      <HStack justify="space-between">
        <Button variant="ghost" onClick={onBack} size="sm">
          Back to Lessons
        </Button>
        <Text fontSize="sm" color="gray.500">
          {saveMutation.isPending ? 'Saving...' : saveMutation.isSuccess ? 'Saved' : ''}
        </Text>
      </HStack>

      {/* Metadata Form */}
      <Box as="form" onSubmit={handleSubmit(onSubmitMetadata)}>
        <Fieldset.Root>
          <Fieldset.Legend fontSize="lg" fontWeight="bold">Lesson Details</Fieldset.Legend>
          <Fieldset.Content>
            <VStack align="stretch" gap={4}>
              <Field.Root>
                <Field.Label>Title</Field.Label>
                <Input {...register('title', { required: true })} />
              </Field.Root>

              <Field.Root>
                <Field.Label>Summary</Field.Label>
                <Textarea {...register('summary')} rows={2} />
              </Field.Root>

              <HStack gap={4} align="start">
                <Field.Root flex={1}>
                  <Field.Label>Status</Field.Label>
                  <Select.Root
                    collection={statusCollection}
                    value={[watch('status') || 'draft']}
                    onValueChange={(e) => setValue('status', e.value[0])}
                  >
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select status" />
                      </Select.Trigger>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {statusCollection.items.map((item) => (
                            <Select.Item item={item} key={item.value}>
                              {item.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>

                <Field.Root flex={1}>
                  <Field.Label>Difficulty</Field.Label>
                  <Select.Root
                    collection={difficultyCollection}
                    value={[watch('difficulty_level') || '']}
                    onValueChange={(e) => setValue('difficulty_level', e.value[0])}
                  >
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select difficulty" />
                      </Select.Trigger>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {difficultyCollection.items.map((item) => (
                            <Select.Item item={item} key={item.value}>
                              {item.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>

                <Field.Root flex={1}>
                  <Field.Label>Duration (min)</Field.Label>
                  <Input
                    type="number"
                    {...register('estimated_duration', { valueAsNumber: true })}
                  />
                </Field.Root>
              </HStack>

              <HStack justify="flex-end">
                <Button type="submit" colorScheme="blue" loading={saveMetadata.isPending} size="sm">
                  Save Details
                </Button>
              </HStack>
            </VStack>
          </Fieldset.Content>
        </Fieldset.Root>
      </Box>

      {/* TipTap Content Editor */}
      <Fieldset.Root>
        <Fieldset.Legend fontSize="lg" fontWeight="bold">Lesson Content</Fieldset.Legend>
        <Fieldset.Content>
          <Box border="1px" borderColor="gray.200" borderRadius="md" minH="300px">
            <TipTapEditor
              initialContent={lesson.tiptap_json as JSONContent | undefined}
              onContentChange={debouncedContentSave}
              placeholder="Write your lesson content here..."
            />
          </Box>
        </Fieldset.Content>
      </Fieldset.Root>
    </VStack>
  );
}
