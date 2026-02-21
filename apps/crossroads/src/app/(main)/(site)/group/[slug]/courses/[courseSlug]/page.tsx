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
import { useColorModeValue } from "@components/ui/color-mode";
import { fetchPublicCourseDetail } from "@mixtape/api/clients/public/publicApi";
import type { PublicCourseDetail } from "@mixtape/api/clients/public/publicApi";
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

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const courseSlug = params.courseSlug as string;

  const [course, setCourse] = useState<PublicCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const sectionBg = useColorModeValue("gray.50", "gray.900");

  useEffect(() => {
    fetchPublicCourseDetail(slug, courseSlug)
      .then(setCourse)
      .catch(() => setError("Course not found."))
      .finally(() => setLoading(false));
  }, [slug, courseSlug]);

  if (loading) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error || !course) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Text color={mutedColor}>{error || "Course not found."}</Text>
      </Box>
    );
  }

  return (
    <Box maxW="3xl" mx="auto" px="6" py="8">
      {/* Breadcrumbs */}
      <HStack gap="2" mb="4" fontSize="sm">
        <ChakraLink asChild color="blue.500">
          <NextLink href={`/group/${slug}`}>Group</NextLink>
        </ChakraLink>
        <Text color={mutedColor}>/</Text>
        <ChakraLink asChild color="blue.500">
          <NextLink href={`/group/${slug}/courses`}>Courses</NextLink>
        </ChakraLink>
      </HStack>

      {/* Title + badges */}
      <VStack align="stretch" gap="3" mb="6">
        <Heading size="2xl">{course.title}</Heading>
        <HStack gap="2" flexWrap="wrap">
          {course.difficulty_level && (
            <Badge
              colorScheme={DIFFICULTY_COLORS[course.difficulty_level] || "gray"}
            >
              {course.difficulty_level}
            </Badge>
          )}
          {course.delivery_type && (
            <Badge variant="subtle">
              {DELIVERY_LABELS[course.delivery_type] || course.delivery_type}
            </Badge>
          )}
          {course.estimated_duration && (
            <Badge variant="outline">{course.estimated_duration} min</Badge>
          )}
        </HStack>
      </VStack>

      {/* Summary */}
      {course.summary && (
        <Text fontSize="lg" color={mutedColor} mb="6">
          {course.summary}
        </Text>
      )}

      {/* Body / description */}
      {course.body && (
        <Box mb="6">
          <Text whiteSpace="pre-wrap">{course.body}</Text>
        </Box>
      )}

      {/* Learning Objectives */}
      {course.learning_objectives.length > 0 && (
        <Box mb="6" p="5" bg={sectionBg} borderRadius="lg">
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
        <Box mb="6">
          <Heading size="md" mb="3">
            Course Outline
          </Heading>
          <VStack align="stretch" gap="2">
            {course.items.map((item) => (
              <HStack
                key={item.id}
                p="3"
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="md"
                gap="3"
              >
                <Text
                  fontSize="sm"
                  color={mutedColor}
                  fontWeight="bold"
                  w="28px"
                  textAlign="right"
                  flexShrink={0}
                >
                  {item.position}.
                </Text>
                <Badge
                  size="sm"
                  colorScheme={item.content_type === "library" ? "purple" : "blue"}
                >
                  {item.content_type === "library" ? "Module" : "Lesson"}
                </Badge>
                <Text fontSize="sm" fontWeight="medium" flex="1">
                  {item.content_title}
                </Text>
                {item.estimated_duration && (
                  <Text fontSize="xs" color={mutedColor}>
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
        p="5"
        bg={sectionBg}
        borderRadius="lg"
        textAlign="center"
      >
        <Text fontSize="sm" color={mutedColor} mb="3">
          Enrollment opens when a course run is scheduled.
        </Text>
        <Button variant="outline" size="sm" disabled>
          Enroll (Coming Soon)
        </Button>
      </Box>
    </Box>
  );
}
