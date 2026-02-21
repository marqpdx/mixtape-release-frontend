// apps/mixtape/src/components/earthlab/CourseDetailWorkArea.tsx

'use client';

import { useState } from 'react';
import { Box, Button, HStack, VStack, Text, Spinner } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { fetchCourseDetail } from '@mixtape/api/clients/earthlab/earthlabApi';
import { CourseEditForm } from './CourseEditForm';
import { CourseOutlineEditor } from './CourseOutlineEditor';

interface CourseDetailWorkAreaProps {
  groupSlug: string;
  courseSlug: string;
  onBack: () => void;
}

export function CourseDetailWorkArea({ groupSlug, courseSlug, onBack }: CourseDetailWorkAreaProps) {
  const [tab, setTab] = useState<'details' | 'outline'>('details');

  const { data: course, isLoading } = useQuery({
    queryKey: ['earthlab', 'course', groupSlug, courseSlug],
    queryFn: () => fetchCourseDetail(groupSlug, courseSlug),
  });

  if (isLoading || !course) {
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
          Back to Courses
        </Button>
        <Text fontSize="lg" fontWeight="bold">{course.title}</Text>
      </HStack>

      {/* Tabs */}
      <HStack gap={2} borderBottom="1px" borderColor="gray.200" pb={2}>
        <Button
          variant={tab === 'details' ? 'solid' : 'ghost'}
          onClick={() => setTab('details')}
          size="sm"
        >
          Details
        </Button>
        <Button
          variant={tab === 'outline' ? 'solid' : 'ghost'}
          onClick={() => setTab('outline')}
          size="sm"
        >
          Outline ({course.items?.length || 0})
        </Button>
      </HStack>

      {/* Tab Content */}
      {tab === 'details' && (
        <CourseEditForm groupSlug={groupSlug} course={course} />
      )}

      {tab === 'outline' && (
        <CourseOutlineEditor
          groupSlug={groupSlug}
          courseSlug={courseSlug}
          items={course.items || []}
        />
      )}
    </VStack>
  );
}
