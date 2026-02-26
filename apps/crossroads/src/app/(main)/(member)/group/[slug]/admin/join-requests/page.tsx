"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Badge,
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
import { useAuth } from "@/lib/auth/AuthContext";
import {
  fetchJoinRequests,
  respondToJoinRequest,
} from "@mixtape/api/clients/group/groupApi";
import type { JoinRequest } from "@mixtape/api/clients/group/groupApi";
import NextLink from "next/link";

export default function JoinRequestsAdminPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const loadRequests = useCallback(async () => {
    try {
      const data = await fetchJoinRequests(slug);
      setRequests(data);
      setError(null);
    } catch {
      setError("Could not load join requests. You may not have permission.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadRequests();
    }
  }, [slug, authLoading, isAuthenticated, loadRequests]);

  if (authLoading || loading) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Text color={mutedColor}>You must be logged in to view this page.</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box maxW="3xl" mx="auto" px="6" py="10">
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box maxW="3xl" mx="auto" px="6" py="10">
      <HStack mb="6" justify="space-between" align="center">
        <Heading size="lg">Join Requests</Heading>
        <ChakraLink asChild fontSize="sm" color="blue.500">
          <NextLink href={`/group/${slug}`}>Back to group</NextLink>
        </ChakraLink>
      </HStack>

      {requests.length === 0 ? (
        <Box
          p="6"
          borderRadius="md"
          border="1px solid"
          borderColor={borderColor}
          bg={cardBg}
          textAlign="center"
        >
          <Text color={mutedColor}>No pending join requests.</Text>
        </Box>
      ) : (
        <VStack gap="3" align="stretch">
          {requests.map((req) => (
            <JoinRequestCard
              key={req.id}
              request={req}
              groupSlug={slug}
              cardBg={cardBg}
              borderColor={borderColor}
              mutedColor={mutedColor}
              onResponded={loadRequests}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
}

function JoinRequestCard({
  request,
  groupSlug,
  cardBg,
  borderColor,
  mutedColor,
  onResponded,
}: {
  request: JoinRequest;
  groupSlug: string;
  cardBg: string;
  borderColor: string;
  mutedColor: string;
  onResponded: () => void;
}) {
  const [responding, setResponding] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleRespond(action: "accept" | "decline") {
    setResponding(true);
    try {
      await respondToJoinRequest(groupSlug, request.id, action);
      setResult(action === "accept" ? "Accepted" : "Declined");
      setTimeout(onResponded, 1000);
    } catch {
      setResult("Failed to process request.");
    } finally {
      setResponding(false);
    }
  }

  return (
    <Box
      p="4"
      borderRadius="md"
      border="1px solid"
      borderColor={borderColor}
      bg={cardBg}
    >
      <HStack justify="space-between" align="start">
        <VStack align="start" gap="1">
          <Text fontWeight="500">
            {request.invited_user || request.invited_email || "Unknown user"}
          </Text>
          {request.message && (
            <Text fontSize="sm" color={mutedColor}>
              {request.message}
            </Text>
          )}
        </VStack>

        {result ? (
          <Badge
            colorScheme={result === "Accepted" ? "green" : result === "Declined" ? "red" : "gray"}
            px="3"
            py="1"
            borderRadius="full"
          >
            {result}
          </Badge>
        ) : (
          <HStack gap="2">
            <Button
              size="sm"
              colorScheme="green"
              onClick={() => handleRespond("accept")}
              disabled={responding}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              onClick={() => handleRespond("decline")}
              disabled={responding}
            >
              Decline
            </Button>
          </HStack>
        )}
      </HStack>
    </Box>
  );
}
