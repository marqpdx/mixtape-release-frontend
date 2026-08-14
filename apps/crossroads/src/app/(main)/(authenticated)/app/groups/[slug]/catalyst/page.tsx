"use client";

import { use, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import NextLink from "next/link";

type MemberPreview = {
  username: string;
  display_name: string;
  avatar_url: string;
};

type GroupDetail = {
  title: string;
  slug: string;
  quick_intro?: string;
  description?: string;
  member_preview?: MemberPreview[];
};

const BRAND = "#1a1a2e";

export default function GroupCatalystPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bodyBg = useColorModeValue("#f9fafb", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const startHereBg = useColorModeValue("#eef4ff", "#1e2a40");
  const startHereBorder = useColorModeValue("#c3d9ff", "#2a4070");

  useEffect(() => {
    axiosInstance
      .get(`/api/public/groups/${slug}`)
      .then((res) => setGroup(res.data))
      .catch(() => setError("Could not load your workspace. Please try again or contact support."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Box className="cat-loading" minH="100vh" display="flex" alignItems="center" justifyContent="center" bg={bodyBg}>
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="cat-error" maxW="560px" mx="auto" px={6} py={16} textAlign="center">
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  const members = group?.member_preview ?? [];

  return (
    <Box className="cat-root" bg={bodyBg} minH="100vh">
      {/* Hero */}
      <Box
        className="cat-hero"
        bg={BRAND}
        color="white"
        px={{ base: 6, md: 12 }}
        py={{ base: 10, md: 14 }}
      >
        <Box maxW="720px" mx="auto">
          <Text
            className="cat-hero-label"
            fontSize="xs"
            fontWeight="600"
            letterSpacing="0.12em"
            opacity={0.55}
            textTransform="uppercase"
            mb={4}
          >
            Catalyst · Foundation
          </Text>
          <Heading
            className="cat-hero-title"
            as="h1"
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="700"
            letterSpacing="-0.02em"
            mb={3}
          >
            {group?.title}
          </Heading>
          {group?.quick_intro && (
            <Text
              className="cat-hero-intro"
              fontSize="md"
              opacity={0.7}
              maxW="540px"
            >
              {group.quick_intro}
            </Text>
          )}
        </Box>
      </Box>

      {/* Body */}
      <Box className="cat-body" maxW="720px" mx="auto" px={{ base: 6, md: 12 }} py={10}>
        <VStack gap={8} align="stretch">

          {/* Status bar */}
          <HStack
            className="cat-status"
            gap={3}
            px={4}
            py={3}
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="md"
          >
            <Box w={2} h={2} borderRadius="full" bg="green.400" flexShrink={0} />
            <Text fontSize="sm" fontWeight="500">
              Your Catalyst Codex is active and indexed.
            </Text>
          </HStack>

          {/* START-HERE */}
          <Box
            className="cat-start-here"
            bg={startHereBg}
            border="1px solid"
            borderColor={startHereBorder}
            borderRadius="lg"
            p={6}
          >
            <HStack gap={3} mb={2}>
              <Text fontSize="lg">📍</Text>
              <Text fontWeight="700" fontSize="md">
                Start here
              </Text>
            </HStack>
            <Text fontSize="sm" color={mutedText} mb={4}>
              Open <strong>START-HERE.md</strong> in your Codex to orient yourself — it maps out your knowledge structure, key files, and what to build first.
            </Text>
            {group?.slug && (
              <ChakraLink asChild>
                <NextLink href={`/group/${group.slug}`}>
                  <Button
                    size="sm"
                    bg={BRAND}
                    color="white"
                    _hover={{ opacity: 0.88 }}
                  >
                    Open your Codex →
                  </Button>
                </NextLink>
              </ChakraLink>
            )}
          </Box>

          {/* Three pillars */}
          <Box className="cat-pillars">
            <Text
              fontSize="xs"
              fontWeight="600"
              letterSpacing="0.1em"
              textTransform="uppercase"
              color={labelColor}
              mb={4}
            >
              What's in your Codex
            </Text>
            <VStack gap={3} align="stretch">
              {[
                {
                  icon: "📚",
                  title: "Knowledge Base",
                  body: "Seeded with the Catalyst CORE library — the foundational types, patterns, and structure your team will build on.",
                },
                {
                  icon: "🗂",
                  title: "Context Files",
                  body: "Who you are, how you work, what you offer. These are the files Beryl draws from when it helps your team.",
                },
                {
                  icon: "⚙️",
                  title: "Operational Files",
                  body: "Procedures, playbooks, and workflows. Active knowledge — not archive, not notes. Living documents your team acts on.",
                },
              ].map(({ icon, title, body }) => (
                <HStack
                  key={title}
                  className="cat-pillar"
                  align="start"
                  gap={4}
                  p={4}
                  bg={cardBg}
                  border="1px solid"
                  borderColor={cardBorder}
                  borderRadius="md"
                >
                  <Text fontSize="xl" flexShrink={0} mt="1px">{icon}</Text>
                  <Box>
                    <Text fontWeight="600" fontSize="sm" mb={1}>{title}</Text>
                    <Text fontSize="sm" color={mutedText}>{body}</Text>
                  </Box>
                </HStack>
              ))}
            </VStack>
          </Box>

          {/* Team preview */}
          {members.length > 0 && (
            <Box className="cat-team">
              <Text
                fontSize="xs"
                fontWeight="600"
                letterSpacing="0.1em"
                textTransform="uppercase"
                color={labelColor}
                mb={3}
              >
                Your team
              </Text>
              <HStack gap={3} flexWrap="wrap">
                {members.map((m) => (
                  <HStack key={m.username} gap={2}>
                    <Avatar.Root size="sm">
                      <Avatar.Image src={m.avatar_url || undefined} />
                      <Avatar.Fallback>
                        {(m.display_name || m.username).charAt(0).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <Text fontSize="sm">{m.display_name || m.username}</Text>
                  </HStack>
                ))}
              </HStack>
            </Box>
          )}

          {/* Support note */}
          <Text className="cat-support" fontSize="xs" color={mutedText}>
            Questions or need a walkthrough? Reply to your activation email — we're here.
          </Text>

        </VStack>
      </Box>
    </Box>
  );
}
