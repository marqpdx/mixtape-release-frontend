// apps/crossroads/src/app/(main)/(site)/group/[slug]/courses/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Badge,
  Box,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { fetchPublicGroupCourses } from "@mixtape/api/clients/public/publicApi";
import type { PublicCourseListItem } from "@mixtape/api/clients/public/publicApi";
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

export default function GroupCoursesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [courses, setCourses] = useState<PublicCourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicGroupCourses(slug)
      .then(setCourses)
      .catch(() => setError("Could not load courses."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Box className="gcls-loading" bg="theme.bg" color="theme.textMuted" role="status" aria-label="Loading courses" px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="gcls-error" bg="theme.bg" color="theme.text" px="6" py="20" textAlign="center">
        <Text role="alert" color="status.danger.fg">{error}</Text>
      </Box>
    );
  }

  return (
    <Box className="gcls-root" bg="theme.bg" color="theme.text" maxW="3xl" mx="auto" px="6" py="8">
      <VStack className="gcls-header" align="stretch" gap="2" mb="6">
        <ChakraLink asChild fontSize="sm" {...courseLinkStyles}>
          <NextLink href={`/group/${slug}`}>Back to group</NextLink>
        </ChakraLink>
        <Heading size="xl">Courses</Heading>
      </VStack>

      {courses.length === 0 ? (
        <Text color="theme.textMuted">No published courses yet.</Text>
      ) : (
        <VStack className="gcls-list" align="stretch" gap="4">
          {courses.map((course) => (
            <ChakraLink
              asChild
              key={course.id}
              {...courseLinkStyles}
              display="block"
              textDecoration="none"
              _hover={{ color: "theme.text", textDecoration: "none" }}
            >
              <NextLink href={`/group/${slug}/courses/${course.slug}`}>
                <Box
                  className="gcls-card"
                  color="theme.text"
                  p="5"
                  bg="theme.surface"
                  borderWidth="1px"
                  borderStyle="solid"
                  borderColor="ui.borderSubtle"
                  borderRadius="lg"
                  _hover={{ boxShadow: "var(--ui-shadow-raised)", borderColor: "ui.borderControl" }}
                  transition="all 0.2s"
                >
                  <HStack className="gcls-card-heading" justify="space-between" mb="2" wrap="wrap">
                    <Text fontWeight="bold" fontSize="lg" textDecoration="underline">
                      {course.title}
                    </Text>
                    <HStack className="gcls-badges" gap="2" wrap="wrap">
                      {course.difficulty_level && (
                        <Badge
                          bg="ui.surfaceSubtle" color="theme.text"
                          size="sm"
                        >
                          {course.difficulty_level}
                        </Badge>
                      )}
                      {course.delivery_type && (
                        <Badge bg="ui.surfaceSubtle" color="theme.text" variant="subtle" size="sm">
                          {DELIVERY_LABELS[course.delivery_type] || course.delivery_type}
                        </Badge>
                      )}
                    </HStack>
                  </HStack>

                  {course.summary && (
                    <Text fontSize="sm" color="theme.textMuted" mb="2" lineClamp={2}>
                      {course.summary}
                    </Text>
                  )}

                  <HStack className="gcls-meta" gap="4" wrap="wrap" fontSize="xs" color="theme.textMuted">
                    {course.estimated_duration && (
                      <Text>{course.estimated_duration} min</Text>
                    )}
                    {course.learning_objectives.length > 0 && (
                      <Text>
                        {course.learning_objectives.length} objective{course.learning_objectives.length !== 1 ? "s" : ""}
                      </Text>
                    )}
                  </HStack>
                </Box>
              </NextLink>
            </ChakraLink>
          ))}
        </VStack>
      )}
    </Box>
  );
}
