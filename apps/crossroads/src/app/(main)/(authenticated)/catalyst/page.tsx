"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Spinner,
  Text,
  VStack,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import NextLink from "next/link";

type GroupSummary = {
  title: string;
  slug: string;
  quick_intro?: string;
};

function getTenantSlug(): string | null {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname; // e.g. mindful-brilliance-test.localhost
  const parts = hostname.split(".");
  // subdomain present if more than one part (localhost counts as one)
  if (parts.length >= 2 && parts[0] !== "localhost" && parts[0] !== "127") {
    return parts[0];
  }
  return null;
}

export default function CatalystLandingPage() {
  const [group, setGroup] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const cardBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    const slug = getTenantSlug();
    if (!slug) {
      setError("No tenant context found. This page is only accessible via a tenant subdomain.");
      setLoading(false);
      return;
    }

    axiosInstance
      .get(`/api/public/groups/${slug}`)
      .then((res) => setGroup(res.data))
      .catch(() => setError("Could not load workspace. You may not have access."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box maxW="560px" mx="auto" px={6} py={16} textAlign="center">
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box className="cat-root" maxW="600px" mx="auto" px={6} py={16}>
      <VStack gap={8} align="start">
        {/* Header */}
        <Box>
          <Text fontSize="sm" fontWeight="500" color="blue.500" mb={2} letterSpacing="wide">
            CATALYST WORKSPACE
          </Text>
          <Heading size="xl" mb={3}>
            Welcome, {group?.title}
          </Heading>
          {group?.quick_intro && (
            <Text color={mutedColor} fontSize="md">
              {group.quick_intro}
            </Text>
          )}
        </Box>

        {/* What's here */}
        <Box
          className="cat-intro"
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="lg"
          p={6}
          w="full"
        >
          <Text fontWeight="600" mb={2}>Your Catalyst Codex is active.</Text>
          <Text fontSize="sm" color={mutedColor}>
            Catalyst gives your team a structured knowledge workspace — policies, processes,
            contacts, and everything else your people need to find fast. Your Codex is
            ready and indexed.
          </Text>
        </Box>

        {/* Actions */}
        <VStack gap={3} align="start">
          {group?.slug && (
            <ChakraLink asChild>
              <NextLink href={`/group/${group.slug}`}>
                <Button size="md">Go to your group workspace →</Button>
              </NextLink>
            </ChakraLink>
          )}
          <Text fontSize="xs" color={mutedColor}>
            Questions? Reply to your activation email or contact your Mixtape administrator.
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}
