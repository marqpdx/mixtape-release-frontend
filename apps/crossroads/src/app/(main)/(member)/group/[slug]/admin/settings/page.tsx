"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
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
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import NextLink from "next/link";

const ADMISSION_OPTIONS = [
  { value: "open", label: "Open to All", description: "Anyone can join immediately." },
  { value: "open_parent_members", label: "Open to Parent Group Members", description: "Members of the parent group can join immediately." },
  { value: "application", label: "Application Required", description: "Anyone can request to join; admins approve." },
  { value: "application_parent_members", label: "Application from Parent Members", description: "Parent group members can request to join; admins approve." },
  { value: "invite_only", label: "Invite Only", description: "Only people invited by admins can join." },
  { value: "closed", label: "Closed", description: "No new members can join." },
];

export default function GroupSettingsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [currentPolicy, setCurrentPolicy] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cardBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const selectedBg = useColorModeValue("blue.50", "blue.900");
  const selectedBorder = useColorModeValue("blue.300", "blue.600");

  const loadGroup = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/api/groups/${slug}`);
      const policy = response.data.admission_policy || "open";
      setCurrentPolicy(policy);
      setSelectedPolicy(policy);
      setError(null);
    } catch {
      setError("Could not load group settings. You may not have permission.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadGroup();
    }
  }, [slug, authLoading, isAuthenticated, loadGroup]);

  async function handleSave() {
    if (!selectedPolicy || selectedPolicy === currentPolicy) return;
    setSaving(true);
    setMessage(null);
    try {
      await axiosInstance.patch(`/api/groups/${slug}`, {
        admission_policy: selectedPolicy,
      });
      setCurrentPolicy(selectedPolicy);
      setMessage("Admission policy updated.");
    } catch {
      setMessage("Failed to update. You may not have permission.");
    } finally {
      setSaving(false);
    }
  }

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
        <Heading size="lg">Group Settings</Heading>
        <ChakraLink asChild fontSize="sm" color="blue.500">
          <NextLink href={`/group/${slug}`}>Back to group</NextLink>
        </ChakraLink>
      </HStack>

      <Text fontWeight="600" mb="3">
        Admission Policy
      </Text>
      <Text fontSize="sm" color={mutedColor} mb="4">
        Controls how new members can join this group.
      </Text>

      <VStack gap="2" align="stretch" mb="6">
        {ADMISSION_OPTIONS.map((opt) => (
          <Box
            key={opt.value}
            p="3"
            borderRadius="md"
            border="1px solid"
            borderColor={selectedPolicy === opt.value ? selectedBorder : borderColor}
            bg={selectedPolicy === opt.value ? selectedBg : cardBg}
            cursor="pointer"
            onClick={() => setSelectedPolicy(opt.value)}
            transition="all 0.15s"
          >
            <Text fontWeight="500" fontSize="sm">
              {opt.label}
            </Text>
            <Text fontSize="xs" color={mutedColor}>
              {opt.description}
            </Text>
          </Box>
        ))}
      </VStack>

      {message && (
        <Text
          fontSize="sm"
          mb="3"
          color={message.includes("Failed") ? "red.500" : "green.600"}
        >
          {message}
        </Text>
      )}

      <Button
        size="sm"
        colorScheme="blue"
        onClick={handleSave}
        disabled={saving || selectedPolicy === currentPolicy}
      >
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </Box>
  );
}
