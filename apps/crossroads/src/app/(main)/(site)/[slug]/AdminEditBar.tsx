"use client";

// AdminEditBar — Steward-only floating bar at the top of the Crossroads Page.
// Shows page status, lifecycle controls, and layout picker.
// Rendered by CrossroadsPageClient when isSteward is true.

import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  HStack,
  Text,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import type { LayoutTemplate } from "@mixtape/api/clients/public/publicApi";

interface PageState {
  status: string;
  layout_template: LayoutTemplate;
  needs_review: boolean;
}

interface AdminEditBarProps {
  groupSlug: string;
  pageState: PageState;
  onPageStateChange: (next: Partial<PageState>) => void;
}

const LAYOUT_LABELS: Record<LayoutTemplate, string> = {
  standard: "Standard",
  hero: "Hero",
  focus: "Focus",
  directory: "Directory",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "gray",
  pending_approval: "yellow",
  published: "green",
  archived: "red",
};

export default function AdminEditBar({ groupSlug, pageState, onPageStateChange }: AdminEditBarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const barBg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const base = `/api/groups/${groupSlug}/public-page`;

  async function call(endpoint: string, method: "post" | "patch" = "post", data?: object) {
    setLoading(endpoint);
    setMessage(null);
    try {
      const res = await axiosInstance[method](endpoint, data ?? {});
      return res.data;
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Request failed.";
      setMessage(msg);
      return null;
    } finally {
      setLoading(null);
    }
  }

  async function handlePublish() {
    const data = await call(`${base}/publish`);
    if (data) onPageStateChange({ status: "published" });
  }

  async function handleUnpublish() {
    const data = await call(`${base}/unpublish`);
    if (data) onPageStateChange({ status: "draft" });
  }

  async function handleSubmit() {
    const data = await call(`${base}/submit`);
    if (data) onPageStateChange({ status: "pending_approval" });
  }

  async function handleNeedsReview(val: boolean) {
    const data = await call(`${base}/draft`, "patch", { needs_review: val });
    if (data) onPageStateChange({ needs_review: val });
  }

  async function handleLayoutChange(template: LayoutTemplate) {
    const data = await call(`${base}/draft`, "patch", { layout_template: template });
    if (data) onPageStateChange({ layout_template: template });
  }

  const { status, layout_template, needs_review } = pageState;

  return (
    <Box
      className="cp-admin-bar"
      position="sticky"
      top="0"
      zIndex={100}
      bg={barBg}
      borderBottom="1px solid"
      borderColor={borderColor}
      px="4"
      py="2"
      boxShadow="sm"
    >
      <HStack gap="3" flexWrap="wrap" align="center">
        <Text fontSize="xs" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="0.05em">
          Steward View
        </Text>

        <Badge colorScheme={STATUS_COLORS[status] ?? "gray"} variant="subtle" borderRadius="full" px="2">
          {status.replace("_", " ")}
        </Badge>

        {needs_review && (
          <Badge colorScheme="orange" variant="solid" borderRadius="full" px="2" fontSize="xs">
            Needs review
          </Badge>
        )}

        {/* Lifecycle controls */}
        {status === "draft" && (
          <Button size="xs" colorScheme="blue" variant="outline" onClick={handleSubmit} disabled={!!loading}>
            Submit for Approval
          </Button>
        )}
        {status === "pending_approval" && (
          <Button size="xs" colorScheme="green" onClick={handlePublish} disabled={!!loading}>
            {loading === `${base}/publish` ? "Publishing..." : "Publish"}
          </Button>
        )}
        {status === "published" && (
          <Button size="xs" colorScheme="orange" variant="outline" onClick={handleUnpublish} disabled={!!loading}>
            Unpublish
          </Button>
        )}
        {status === "published" && !needs_review && (
          <Button size="xs" variant="ghost" onClick={() => handleNeedsReview(true)} disabled={!!loading}>
            Flag for Review
          </Button>
        )}
        {needs_review && (
          <Button size="xs" variant="ghost" colorScheme="green" onClick={() => handleNeedsReview(false)} disabled={!!loading}>
            Clear Review Flag
          </Button>
        )}

        {/* Layout picker */}
        <HStack gap="1" align="center">
          <Text fontSize="xs" color={mutedColor}>Layout:</Text>
          <select
            value={layout_template}
            onChange={(e) => handleLayoutChange(e.target.value as LayoutTemplate)}
            style={{ fontSize: "12px", padding: "2px 6px", borderRadius: "4px" }}
          >
            {(Object.keys(LAYOUT_LABELS) as LayoutTemplate[]).map((t) => (
              <option key={t} value={t}>{LAYOUT_LABELS[t]}</option>
            ))}
          </select>
        </HStack>

        {message && (
          <Text fontSize="xs" color="red.500">{message}</Text>
        )}
      </HStack>
    </Box>
  );
}
