// apps/mixtape/src/components/earthlab/EarthLabWorkArea.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Button, HStack, VStack, Text, Badge } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchGroupCourses, fetchGroupLessons,
  createCourse, createLesson,
} from '@mixtape/api/clients/earthlab/earthlabApi';
import type { CourseListItem, LessonListItem } from '@mixtape/api/clients/earthlab/earthlabApi';
import { CourseDetailWorkArea } from './CourseDetailWorkArea';
import { LessonEditForm } from './LessonEditForm';
import { toaster } from '@/components/ui/toaster';

interface EarthLabWorkAreaProps {
  groupSlug: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'yellow',
  published: 'green',
  archived: 'gray',
};

const DELIVERY_LABELS: Record<string, string> = {
  online: 'Online',
  self_paced: 'Self-Paced',
  hybrid: 'Hybrid',
  in_person: 'In Person',
};

export function EarthLabWorkArea({ groupSlug }: EarthLabWorkAreaProps) {
  const queryClient = useQueryClient();
  const storageKey = useMemo(() => `earthlab-view:${groupSlug}`, [groupSlug]);

  const [view, setView] = useState<'courses' | 'lessons'>(() => {
    if (typeof window === 'undefined') return 'courses';
    const stored = window.localStorage.getItem(storageKey);
    if (stored === 'courses' || stored === 'lessons') return stored;
    return 'courses';
  });

  // Navigation state for detail views
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string | null>(null);
  const [selectedLessonSlug, setSelectedLessonSlug] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, view);
  }, [storageKey, view]);

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['earthlab', 'courses', groupSlug],
    queryFn: () => fetchGroupCourses(groupSlug),
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['earthlab', 'lessons', groupSlug],
    queryFn: () => fetchGroupLessons(groupSlug),
  });

  const createCourseMutation = useMutation({
    mutationFn: () => createCourse(groupSlug, { title: 'Untitled Course' }),
    onSuccess: (newCourse) => {
      queryClient.invalidateQueries({ queryKey: ['earthlab', 'courses', groupSlug] });
      setSelectedCourseSlug(newCourse.slug);
      toaster.create({ title: 'Course created', type: 'success' });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: () => createLesson(groupSlug, { title: 'Untitled Lesson' }),
    onSuccess: (newLesson) => {
      queryClient.invalidateQueries({ queryKey: ['earthlab', 'lessons', groupSlug] });
      setSelectedLessonSlug(newLesson.slug);
      toaster.create({ title: 'Lesson created', type: 'success' });
    },
  });

  // Detail views
  if (selectedCourseSlug) {
    return (
      <CourseDetailWorkArea
        groupSlug={groupSlug}
        courseSlug={selectedCourseSlug}
        onBack={() => setSelectedCourseSlug(null)}
      />
    );
  }

  if (selectedLessonSlug) {
    return (
      <LessonEditForm
        groupSlug={groupSlug}
        lessonSlug={selectedLessonSlug}
        onBack={() => setSelectedLessonSlug(null)}
      />
    );
  }

  // List view
  return (
    <VStack align="stretch" gap={6}>
      <HStack justify="space-between">
        <Text fontSize="2xl" fontWeight="bold">EarthLab</Text>
        <HStack gap={2}>
          {view === 'courses' && (
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => createCourseMutation.mutate()}
              loading={createCourseMutation.isPending}
            >
              New Course
            </Button>
          )}
          {view === 'lessons' && (
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => createLessonMutation.mutate()}
              loading={createLessonMutation.isPending}
            >
              New Lesson
            </Button>
          )}
        </HStack>
      </HStack>

      {/* Tabs */}
      <HStack gap={2} borderBottom="1px" borderColor="gray.200" pb={2}>
        <Button
          variant={view === 'courses' ? 'solid' : 'ghost'}
          onClick={() => setView('courses')}
          size="sm"
        >
          Courses{courses ? ` (${courses.length})` : ''}
        </Button>
        <Button
          variant={view === 'lessons' ? 'solid' : 'ghost'}
          onClick={() => setView('lessons')}
          size="sm"
        >
          Lessons{lessons ? ` (${lessons.length})` : ''}
        </Button>
      </HStack>

      {/* Courses List */}
      {view === 'courses' && (
        <VStack align="stretch" gap={3}>
          {coursesLoading && <Text color="gray.500">Loading courses...</Text>}
          {courses && courses.length === 0 && (
            <EmptyState
              title="No courses yet"
              hint='Create a course using "New Course" above or "/course Your Title" in the Grist Mill'
            />
          )}
          {courses?.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => setSelectedCourseSlug(course.slug)}
            />
          ))}
        </VStack>
      )}

      {/* Lessons List */}
      {view === 'lessons' && (
        <VStack align="stretch" gap={3}>
          {lessonsLoading && <Text color="gray.500">Loading lessons...</Text>}
          {lessons && lessons.length === 0 && (
            <EmptyState
              title="No lessons yet"
              hint='Create a lesson using "New Lesson" above or "/lesson Your Title" in the Grist Mill'
            />
          )}
          {lessons?.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onClick={() => setSelectedLessonSlug(lesson.slug)}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
}

function CourseCard({ course, onClick }: { course: CourseListItem; onClick: () => void }) {
  return (
    <Box
      border="1px" borderColor="gray.200" p={4} borderRadius="md"
      cursor="pointer" _hover={{ borderColor: 'blue.300', bg: 'gray.50' }}
      onClick={onClick}
    >
      <HStack justify="space-between" mb={1}>
        <Text fontWeight="bold">{course.title}</Text>
        <Badge colorScheme={STATUS_COLORS[course.status] || 'gray'}>
          {course.status}
        </Badge>
      </HStack>
      <HStack gap={4} fontSize="sm" color="gray.600">
        {course.delivery_type && (
          <Text>{DELIVERY_LABELS[course.delivery_type] || course.delivery_type}</Text>
        )}
        {course.difficulty_level && <Text>{course.difficulty_level}</Text>}
        {course.estimated_duration && <Text>{course.estimated_duration} min</Text>}
      </HStack>
    </Box>
  );
}

function LessonCard({ lesson, onClick }: { lesson: LessonListItem; onClick: () => void }) {
  return (
    <Box
      border="1px" borderColor="gray.200" p={4} borderRadius="md"
      cursor="pointer" _hover={{ borderColor: 'blue.300', bg: 'gray.50' }}
      onClick={onClick}
    >
      <HStack justify="space-between" mb={1}>
        <Text fontWeight="bold">{lesson.title}</Text>
        <Badge colorScheme={STATUS_COLORS[lesson.status] || 'gray'}>
          {lesson.status}
        </Badge>
      </HStack>
      <HStack gap={4} fontSize="sm" color="gray.600">
        {lesson.difficulty_level && <Text>{lesson.difficulty_level}</Text>}
        {lesson.estimated_duration && <Text>{lesson.estimated_duration} min</Text>}
      </HStack>
    </Box>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <Box textAlign="center" py={10} color="gray.500">
      <Text fontSize="lg" mb={2}>{title}</Text>
      <Text fontSize="sm">{hint}</Text>
    </Box>
  );
}
