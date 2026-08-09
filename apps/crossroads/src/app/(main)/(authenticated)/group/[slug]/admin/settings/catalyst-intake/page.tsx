"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Button,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { getAccessToken, getTokenExpiry } from "@mixtape/auth/tokenStorage";
import NextLink from "next/link";

type CatalystStatus = "none" | "pending" | "ready" | "failed";

type StatusResponse = {
  status: CatalystStatus;
  catalyst_enabled: boolean;
  workspace_url: string | null;
};

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000;

export default function CatalystActivatePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [status, setStatus] = useState<CatalystStatus | null>(null);
  const [workspaceUrl, setWorkspaceUrl] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [activating, setActivating] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const surfaceBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const fetchStatus = useCallback(async (): Promise<CatalystStatus | null> => {
    try {
      const res = await axiosInstance.get<StatusResponse>(
        `/api/groups/${slug}/catalyst/status`
      );
      const { status: s, workspace_url: url } = res.data;
      setStatus(s);
      if (url) setWorkspaceUrl(url);
      return s;
    } catch {
      return null;
    }
  }, [slug]);

  const startPolling = useCallback(() => {
    stopPolling();

    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setTimedOut(true);
    }, POLL_TIMEOUT_MS);

    pollRef.current = setInterval(async () => {
      const s = await fetchStatus();
      if (s === "ready" || s === "failed") {
        stopPolling();
      }
    }, POLL_INTERVAL_MS);
  }, [fetchStatus, stopPolling]);

  // Initial status fetch
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchStatus();
    }
  }, [authLoading, isAuthenticated, fetchStatus]);

  // Start polling when status becomes pending
  useEffect(() => {
    if (status === "pending") startPolling();
    return () => stopPolling();
  }, [status, startPolling, stopPolling]);

  // Redirect to workspace when ready
  useEffect(() => {
    if (status === "ready" && workspaceUrl) {
      const token = getAccessToken() || "";
      const expSec = getTokenExpiry() ? Math.floor(getTokenExpiry()! / 1000) : 0;
      window.location.href = `${workspaceUrl}#at=${encodeURIComponent(token)}&exp=${expSec}`;
    }
  }, [status, workspaceUrl]);

  const handleActivate = async () => {
    setActivating(true);
    setError(null);
    try {
      await axiosInstance.post(`/api/groups/${slug}/catalyst/activate`);
      setStatus("pending");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; status?: string } } };
      if (e.response?.data?.status === "ready") {
        await fetchStatus();
      } else {
        setError(e.response?.data?.detail ?? "Something went wrong. Please try again.");
      }
    } finally {
      setActivating(false);
      setConfirming(false);
    }
  };

  if (authLoading || status === null) {
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

  const backLink = (
    <ChakraLink asChild fontSize="sm" color="blue.500">
      <NextLink href={`/group/${slug}/admin/settings`}>Back to settings</NextLink>
    </ChakraLink>
  );

  // ── Pending: provisioning spinner ──────────────────────────────────────────
  if (status === "pending") {
    if (timedOut) {
      return (
        <Box maxW="520px" mx="auto" px={4} py={10}>
          <Heading size="lg" mb={4}>Taking longer than expected</Heading>
          <Text color={mutedColor} mb={6}>
            Provisioning is still in progress. Refresh this page in a minute or two —
            you&apos;ll be taken to your workspace automatically once it&apos;s ready.
          </Text>
          <Button onClick={() => { setTimedOut(false); startPolling(); }} variant="outline" mr={3}>
            Keep waiting
          </Button>
          {backLink}
        </Box>
      );
    }

    return (
      <Box maxW="520px" mx="auto" px={4} py={10} textAlign="center">
        <Spinner size="xl" mb={6} />
        <Heading size="md" mb={3}>Provisioning your Catalyst workspace…</Heading>
        <Text color={mutedColor} fontSize="sm">
          Seeding your Codex, indexing documents, and generating your START-HERE guide.
          This takes about 20 seconds.
        </Text>
      </Box>
    );
  }

  // ── Failed ─────────────────────────────────────────────────────────────────
  if (status === "failed") {
    return (
      <Box maxW="520px" mx="auto" px={4} py={10}>
        <HStack mb={6} justify="space-between">
          <Heading size="lg">Provisioning failed</Heading>
          {backLink}
        </HStack>
        <Text color={mutedColor} mb={6}>
          Something went wrong while setting up your Catalyst workspace.
          Please contact support and mention your group slug: <strong>{slug}</strong>.
        </Text>
      </Box>
    );
  }

  // ── None: offer activation ─────────────────────────────────────────────────
  return (
    <Box maxW="520px" mx="auto" px={4} py={10} pb={12}>
      <HStack mb={6} justify="space-between" align="center">
        <Heading size="lg">Activate Catalyst</Heading>
        {backLink}
      </HStack>

      <Text mb={6} color={mutedColor}>
        Catalyst gives your group an AI-powered knowledge workspace — structured docs,
        semantic search, and an always-on Codex your team can grow over time.
      </Text>

      <Box
        bg={surfaceBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="md"
        p={5}
        mb={8}
      >
        <Stack gap={2}>
          <HStack justify="space-between">
            <Text fontWeight="600">Catalyst — Foundation</Text>
            <Text fontWeight="700" fontSize="lg">$20 / month</Text>
          </HStack>
          <Text fontSize="sm" color={mutedColor}>
            Codex workspace · Semantic search · Stackroom IR · START-HERE guide
          </Text>
          <Text fontSize="sm" color={mutedColor}>
            Billed monthly. Cancel anytime from group settings.
          </Text>
        </Stack>
      </Box>

      {error && (
        <Text color="red.500" fontSize="sm" mb={4}>{error}</Text>
      )}

      {!confirming ? (
        <Button onClick={() => setConfirming(true)}>
          Enable Catalyst →
        </Button>
      ) : (
        <Box
          bg={surfaceBg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          p={5}
        >
          <Text mb={4} fontWeight="500">
            Confirm: add Catalyst ($20/month) to <strong>{slug}</strong>?
          </Text>
          <HStack gap={3}>
            <Button
              onClick={handleActivate}
              loading={activating}
              colorPalette="blue"
            >
              Yes, activate
            </Button>
            <Button
              variant="ghost"
              onClick={() => setConfirming(false)}
              disabled={activating}
            >
              Cancel
            </Button>
          </HStack>
        </Box>
      )}
    </Box>
  );
}
