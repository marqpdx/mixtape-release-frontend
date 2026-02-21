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
import { useColorModeValue } from "@components/ui/color-mode";
import { fetchPublicGroupCourses } from "@mixtape/api/clients/public/publicApi";
import type { PublicCourseListItem } from "@mixtape/api/clients/public/publicApi";
import NextLink from "next/link";

const DELIVERY_LABELS: Record<string, string> = {
  online: "Online",
  self_paced: "Self-Paced",
  hybrid: "Hybrid",
  in_person: "In Person",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "green",
  intermediate: "yellow",
  advanced: "red",
};

export default function GroupCoursesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [courses, setCourses] = useState<PublicCourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    fetchPublicGroupCourses(slug)
      .then(setCourses)
      .catch(() => setError("Could not load courses."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Text color={mutedColor}>{error}</Text>
      </Box>
    );
  }

  return (
    <Box maxW="3xl" mx="auto" px="6" py="8">
      <VStack align="stretch" gap="2" mb="6">
        <ChakraLink asChild fontSize="sm" color="blue.500">
          <NextLink href={`/group/${slug}`}>Back to group</NextLink>
        </ChakraLink>
        <Heading size="xl">Courses</Heading>
      </VStack>

      {courses.length === 0 ? (
        <Text color={mutedColor}>No published courses yet.</Text>
      ) : (
        <VStack align="stretch" gap="4">
          {courses.map((course) => (
            <ChakraLink
              asChild
              key={course.id}
              _hover={{ textDecoration: "none" }}
            >
              <NextLink href={`/group/${slug}/courses/${course.slug}`}>
                <Box
                  p="5"
                  bg={cardBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="lg"
                  _hover={{ boxShadow: "md", borderColor: "blue.200" }}
                  transition="all 0.2s"
                >
                  <HStack justify="space-between" mb="2">
                    <Text fontWeight="bold" fontSize="lg">
                      {course.title}
                    </Text>
                    <HStack gap="2">
                      {course.difficulty_level && (
                        <Badge
                          colorScheme={DIFFICULTY_COLORS[course.difficulty_level] || "gray"}
                          size="sm"
                        >
                          {course.difficulty_level}
                        </Badge>
                      )}
                      {course.delivery_type && (
                        <Badge variant="subtle" size="sm">
                          {DELIVERY_LABELS[course.delivery_type] || course.delivery_type}
                        </Badge>
                      )}
                    </HStack>
                  </HStack>

                  {course.summary && (
                    <Text fontSize="sm" color={mutedColor} mb="2" lineClamp={2}>
                      {course.summary}
                    </Text>
                  )}

                  <HStack gap="4" fontSize="xs" color={mutedColor}>
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
