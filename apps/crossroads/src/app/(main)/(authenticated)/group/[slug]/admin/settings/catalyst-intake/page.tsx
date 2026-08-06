"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Button,
  Field,
  Heading,
  HStack,
  Input,
  Spinner,
  Stack,
  Text,
  Textarea,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";
import NextLink from "next/link";

type GroupSummary = {
  title: string;
  slug: string;
};

type ApiError = {
  response?: { data?: { detail?: string }; status?: number };
};

export default function CatalystIntakePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [group, setGroup] = useState<GroupSummary | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [orgDescription, setOrgDescription] = useState("");
  const [knowledgeGoal, setKnowledgeGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const infoBoxBg = useColorModeValue("gray.50", "gray.800");
  const infoBoxBorder = useColorModeValue("gray.200", "gray.700");

  const loadGroup = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/groups/${slug}`);
      setGroup({ title: res.data.title, slug: res.data.slug });
    } catch {
      setError("Could not load group. You may not have permission.");
    } finally {
      setLoadingGroup(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadGroup();
    }
  }, [slug, authLoading, isAuthenticated, loadGroup]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await axiosInstance.post(`/api/groups/${slug}/catalyst-intake`, {
        org_description: orgDescription.trim(),
        knowledge_goal: knowledgeGoal.trim(),
      });
      setSubmitted(true);
      toaster.create({
        title: "Request received",
        description: "A Mixtape administrator will activate Catalyst for your group.",
        type: "success",
        duration: 6000,
      });
    } catch (err: unknown) {
      const e = err as ApiError;
      const msg = e.response?.data?.detail ?? "Something went wrong. Please try again.";
      setError(msg);
      toaster.create({ title: "Submission failed", description: msg, type: "error", duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loadingGroup) {
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

  if (submitted) {
    return (
      <Box className="ci-root" maxW="560px" mx="auto" px={4} py={10}>
        <Heading size="lg" mb={4}>Request submitted.</Heading>
        <Text color={mutedColor} mb={6}>
          A Mixtape administrator will activate Catalyst for <strong>{group?.title}</strong> and
          be in touch at {user?.email}.
        </Text>
        <ChakraLink asChild fontSize="sm" color="blue.500">
          <NextLink href={`/group/${slug}/admin/settings`}>Back to settings</NextLink>
        </ChakraLink>
      </Box>
    );
  }

  return (
    <Box className="ci-root" maxW="560px" mx="auto" px={4} py={10} pb={12}>
      <HStack mb={6} justify="space-between" align="center">
        <Heading size="lg">Activate Catalyst</Heading>
        <ChakraLink asChild fontSize="sm" color="blue.500">
          <NextLink href={`/group/${slug}/admin/settings`}>Back to settings</NextLink>
        </ChakraLink>
      </HStack>

      <Text mb={2} color={mutedColor}>
        Your group already lives in Mixtape — these answers help us configure your Catalyst
        workspace so it&apos;s set up correctly from day one.
      </Text>
      <Text mb={8} fontSize="sm" color={mutedColor}>
        Once you submit, a Mixtape administrator will complete activation and reach out to confirm.
      </Text>

      {/* Pre-filled context (read-only) */}
      <Box
        className="ci-context"
        bg={infoBoxBg}
        border="1px solid"
        borderColor={infoBoxBorder}
        borderRadius="md"
        p={4}
        mb={6}
      >
        <Stack gap={2}>
          <HStack gap={3}>
            <Text fontSize="sm" fontWeight="500" minW="100px">Group</Text>
            <Text fontSize="sm" color={mutedColor}>{group?.title}</Text>
          </HStack>
          <HStack gap={3}>
            <Text fontSize="sm" fontWeight="500" minW="100px">Contact email</Text>
            <Text fontSize="sm" color={mutedColor}>{user?.email}</Text>
          </HStack>
        </Stack>
      </Box>

      <form onSubmit={handleSubmit}>
        <Stack gap={6}>
          <Field.Root>
            <Field.Label>What does your organization do?</Field.Label>
            <Textarea
              className="ci-desc-input"
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              placeholder="A sentence or two is fine."
              rows={3}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>
              What&apos;s one thing your team should always be able to find quickly?
            </Field.Label>
            <Input
              className="ci-goal-input"
              value={knowledgeGoal}
              onChange={(e) => setKnowledgeGoal(e.target.value)}
              placeholder="e.g. our supplier contacts, how we handle returns, who to call when X breaks"
            />
          </Field.Root>

          {error && (
            <Text color="red.500" fontSize="sm">{error}</Text>
          )}

          <Button type="submit" loading={submitting}>
            Request Catalyst activation
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
