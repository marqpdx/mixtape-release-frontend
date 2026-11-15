// apps/crossroads/src/app/(main)/(site)/group/[slug]/courses/[courseSlug]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Badge,
  Box,
  Heading,
  HStack,
  List,
  Spinner,
  Text,
  VStack,
  Link as ChakraLink,
  Button,
} from "@chakra-ui/react";
import { fetchPublicCourseDetail } from "@mixtape/api/clients/public/publicApi";
import type { PublicCourseDetail } from "@mixtape/api/clients/public/publicApi";
import NextLink from "next/link";

const DELIVERY_LABELS: Record<string, string> = {
  online: "Online",
  self_paced: "Self-Paced",
  hybrid: "Hybrid",
  in_person: "In Person",
};

const courseLinkStyles = {
  color: "theme.text",
  textDecoration: "underline",
  _hover: { color: "theme.text" },
  _focusVisible: {
    outline: "3px solid",
    outlineColor: "ui.borderControl",
    outlineOffset: "2px",
  },
} as const;

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const courseSlug = params.courseSlug as string;

  const [course, setCourse] = useState<PublicCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicCourseDetail(slug, courseSlug)
      .then(setCourse)
      .catch(() => setError("Course not found."))
      .finally(() => setLoading(false));
  }, [slug, courseSlug]);

  if (loading) {
    return (
      <Box className="gcdt-loading" bg="theme.bg" color="theme.textMuted" role="status" aria-label="Loading courses" px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error || !course) {
    return (
      <Box className="gcdt-error" bg="theme.bg" color="theme.text" px="6" py="20" textAlign="center">
        <Text role="alert" color="status.danger.fg">{error || "Course not found."}</Text>
      </Box>
    );
  }

  return (
    <Box className="gcdt-root" bg="theme.bg" color="theme.text" maxW="3xl" mx="auto" px="6" py="8">
      {/* Breadcrumbs */}
      <HStack className="gcdt-breadcrumbs" gap="2" mb="4" fontSize="sm">
        <ChakraLink asChild {...courseLinkStyles}>
          <NextLink href={`/group/${slug}`}>Group</NextLink>
        </ChakraLink>
        <Text color="theme.textMuted">/</Text>
        <ChakraLink asChild {...courseLinkStyles}>
          <NextLink href={`/group/${slug}/courses`}>Courses</NextLink>
        </ChakraLink>
      </HStack>

      {/* Title + badges */}
      <VStack className="gcdt-header" align="stretch" gap="3" mb="6">
        <Heading size="2xl">{course.title}</Heading>
        <HStack className="gcdt-badges" gap="2" flexWrap="wrap">
          {course.difficulty_level && (
            <Badge
              bg="ui.surfaceSubtle" color="theme.text"
            >
              {course.difficulty_level}
            </Badge>
          )}
          {course.delivery_type && (
            <Badge bg="ui.surfaceSubtle" color="theme.text" variant="subtle">
              {DELIVERY_LABELS[course.delivery_type] || course.delivery_type}
            </Badge>
          )}
          {course.estimated_duration && (
            <Badge bg="ui.surfaceSubtle" color="theme.text" borderColor="ui.borderSubtle" variant="outline">{course.estimated_duration} min</Badge>
          )}
        </HStack>
      </VStack>

      {/* Summary */}
      {course.summary && (
        <Text fontSize="lg" color="theme.textMuted" mb="6">
          {course.summary}
        </Text>
      )}

      {/* Body / description */}
      {course.body && (
        <Box className="gcdt-body" mb="6">
          <Text whiteSpace="pre-wrap">{course.body}</Text>
        </Box>
      )}

      {/* Learning Objectives */}
      {course.learning_objectives.length > 0 && (
        <Box className="gcdt-objectives" mb="6" p="5" bg="ui.surfaceSubtle" color="theme.text" borderRadius="lg">
          <Heading size="md" mb="3">
            Learning Objectives
          </Heading>
          <List.Root gap="2">
            {course.learning_objectives.map((obj, i) => (
              <List.Item key={i} fontSize="sm">
                {obj}
              </List.Item>
            ))}
          </List.Root>
        </Box>
      )}

      {/* Course Outline */}
      {course.items.length > 0 && (
        <Box className="gcdt-outline" mb="6">
          <Heading size="md" mb="3">
            Course Outline
          </Heading>
          <VStack className="gcdt-items" align="stretch" gap="2">
            {course.items.map((item) => (
              <HStack
                className="gcdt-item"
                color="theme.text"
                wrap="wrap"
                key={item.id}
                p="3"
                bg="theme.surface"
                border="1px solid"
                borderColor="ui.borderSubtle"
                borderRadius="md"
                gap="3"
              >
                <Text
                  fontSize="sm"
                  color="theme.textMuted"
                  fontWeight="bold"
                  w="28px"
                  textAlign="right"
                  flexShrink={0}
                >
                  {item.position}.
                </Text>
                <Badge
                  size="sm"
                  bg="ui.surfaceSubtle" color="theme.text"
                >
                  {item.content_type === "library" ? "Module" : "Lesson"}
                </Badge>
                <Text fontSize="sm" fontWeight="medium" flex="1">
                  {item.content_title}
                </Text>
                {item.estimated_duration && (
                  <Text fontSize="xs" color="theme.textMuted">
                    {item.estimated_duration} min
                  </Text>
                )}
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {/* Enroll placeholder */}
      <Box
        className="gcdt-enrollment"
        p="5"
        bg="ui.surfaceSubtle" color="theme.text"
        borderRadius="lg"
        textAlign="center"
      >
        <Text fontSize="sm" color="theme.textMuted" mb="3">
          Enrollment opens when a course run is scheduled.
        </Text>
        <Button variant="outline" size="sm" disabled>
          Enroll (Coming Soon)
        </Button>
      </Box>
    </Box>
  );
}
