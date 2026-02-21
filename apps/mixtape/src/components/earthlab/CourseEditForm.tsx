// apps/mixtape/src/components/earthlab/CourseEditForm.tsx

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box, Button, HStack, VStack, Input, Textarea,
  Fieldset, Select, Field, Portal,
  createListCollection,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCourse } from '@mixtape/api/clients/earthlab/earthlabApi';
import type { CourseDetail, CourseFormData } from '@mixtape/api/clients/earthlab/earthlabApi';
import { toaster } from '@/components/ui/toaster';

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

const deliveryCollection = createListCollection({
  items: [
    { label: 'Online', value: 'online' },
    { label: 'Self-Paced', value: 'self_paced' },
    { label: 'Hybrid', value: 'hybrid' },
    { label: 'In Person', value: 'in_person' },
  ],
});

interface CourseEditFormProps {
  groupSlug: string;
  course: CourseDetail;
}

export function CourseEditForm({ groupSlug, course }: CourseEditFormProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, watch, reset } = useForm<CourseFormData>({
    defaultValues: {
      title: course.title,
      summary: course.summary,
      body: course.body,
      status: course.status,
      difficulty_level: course.difficulty_level,
      delivery_type: course.delivery_type,
      estimated_duration: course.estimated_duration,
      learning_objectives: course.learning_objectives || [],
    },
  });

  useEffect(() => {
    reset({
      title: course.title,
      summary: course.summary,
      body: course.body,
      status: course.status,
      difficulty_level: course.difficulty_level,
      delivery_type: course.delivery_type,
      estimated_duration: course.estimated_duration,
      learning_objectives: course.learning_objectives || [],
    });
  }, [course, reset]);

  const objectives = watch('learning_objectives') || [];

  const mutation = useMutation({
    mutationFn: (data: Partial<CourseFormData>) =>
      updateCourse(groupSlug, course.slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earthlab', 'courses', groupSlug] });
      queryClient.invalidateQueries({ queryKey: ['earthlab', 'course', groupSlug, course.slug] });
      toaster.create({ title: 'Course saved', type: 'success' });
    },
    onError: () => {
      toaster.create({ title: 'Failed to save course', type: 'error' });
    },
  });

  const onSubmit = (data: CourseFormData) => {
    mutation.mutate(data);
  };

  const addObjective = () => {
    setValue('learning_objectives', [...objectives, '']);
  };

  const removeObjective = (index: number) => {
    setValue('learning_objectives', objectives.filter((_, i) => i !== index));
  };

  const updateObjective = (index: number, value: string) => {
    const updated = [...objectives];
    updated[index] = value;
    setValue('learning_objectives', updated);
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <VStack align="stretch" gap={6}>
        <Fieldset.Root>
          <Fieldset.Legend fontSize="lg" fontWeight="bold">Course Details</Fieldset.Legend>
          <Fieldset.Content>
            <VStack align="stretch" gap={4}>
              <Field.Root>
                <Field.Label>Title</Field.Label>
                <Input {...register('title', { required: true })} />
              </Field.Root>

              <Field.Root>
                <Field.Label>Summary</Field.Label>
                <Textarea {...register('summary')} rows={3} />
              </Field.Root>

              <Field.Root>
                <Field.Label>Description</Field.Label>
                <Textarea {...register('body')} rows={6} />
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
              </HStack>

              <HStack gap={4} align="start">
                <Field.Root flex={1}>
                  <Field.Label>Delivery Type</Field.Label>
                  <Select.Root
                    collection={deliveryCollection}
                    value={[watch('delivery_type') || 'self_paced']}
                    onValueChange={(e) => setValue('delivery_type', e.value[0])}
                  >
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select delivery" />
                      </Select.Trigger>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {deliveryCollection.items.map((item) => (
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
                  <Field.Label>Duration (minutes)</Field.Label>
                  <Input
                    type="number"
                    {...register('estimated_duration', { valueAsNumber: true })}
                  />
                </Field.Root>
              </HStack>
            </VStack>
          </Fieldset.Content>
        </Fieldset.Root>

        <Fieldset.Root>
          <Fieldset.Legend fontSize="lg" fontWeight="bold">Learning Objectives</Fieldset.Legend>
          <Fieldset.Content>
            <VStack align="stretch" gap={2}>
              {objectives.map((obj, i) => (
                <HStack key={i} gap={2}>
                  <Input
                    value={obj}
                    onChange={(e) => updateObjective(i, e.target.value)}
                    placeholder={`Objective ${i + 1}`}
                    flex={1}
                  />
                  <Button size="sm" variant="ghost" onClick={() => removeObjective(i)}>
                    Remove
                  </Button>
                </HStack>
              ))}
              <Button size="sm" variant="outline" onClick={addObjective} alignSelf="start">
                Add Objective
              </Button>
            </VStack>
          </Fieldset.Content>
        </Fieldset.Root>

        <HStack justify="flex-end">
          <Button
            type="submit"
            colorScheme="blue"
            loading={mutation.isPending}
          >
            Save Course
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
