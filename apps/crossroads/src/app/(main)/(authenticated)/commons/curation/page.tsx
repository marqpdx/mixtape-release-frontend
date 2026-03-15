"use client";

// app/(main)/(authenticated)/commons/curation/page.tsx
//
// Curation Station — superuser dashboard for the Commons capture→curate→publish flow.
// Superuser-collapsed: one person can move an item through all stages.

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  createListCollection,
  HStack,
  Input,
  Select,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  listCommonsQueue,
  getCommonsItem,
  updateCommonsItem,
  advanceCommonsItem,
  rejectCommonsItem,
  type CommonsQueueItem,
  type CommonsItemDetail,
  type CommonsItemUpdatePayload,
  type CurationStatus,
  type ItemType,
} from "@mixtape/api/clients/commons/commonsApi";

// --- Status config ---

const STATUS_TABS: { value: CurationStatus | "active"; label: string }[] = [
  { value: "active", label: "Active Queue" },
  { value: "captured", label: "Captured" },
  { value: "in_curation", label: "In Curation" },
  { value: "ready", label: "Ready" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_COLORS: Record<CurationStatus, string> = {
  captured: "gray",
  in_curation: "blue",
  ready: "yellow",
  approved: "orange",
  published: "green",
  rejected: "red",
};

// What the advance button says and targets per status
const ADVANCE_ACTION: Record<
  CurationStatus,
  { label: string; target: CurationStatus } | null
> = {
  captured: { label: "Start Curating", target: "in_curation" },
  in_curation: { label: "Mark Ready", target: "ready" },
  ready: { label: "Approve", target: "approved" },
  approved: { label: "Publish", target: "published" },
  published: { label: "Unpublish", target: "approved" },
  rejected: { label: "Reopen", target: "captured" },
};

const BACK_ACTION: Record<CurationStatus, { label: string; target: CurationStatus } | null> = {
  captured: null,
  in_curation: null,
  ready: { label: "Back to Curation", target: "in_curation" },
  approved: { label: "Back to Ready", target: "ready" },
  published: null,
  rejected: null,
};

const ITEM_TYPE_OPTIONS = [
  { value: "", label: "— type —" },
  { value: "person", label: "Person" },
  { value: "organization", label: "Organization" },
  { value: "group", label: "Group" },
  { value: "project", label: "Project" },
  { value: "place", label: "Place" },
  { value: "event", label: "Event" },
];

const itemTypeCollection = createListCollection({ items: ITEM_TYPE_OPTIONS });

// --- Main page ---

export default function CurationStationPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<CurationStatus | "active">("active");
  const [items, setItems] = useState<CommonsQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const headerBorderColor = useColorModeValue("gray.200", "gray.700");

  const isSuperuser = !!(user as { is_superuser?: boolean })?.is_superuser;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // "active" = all non-published non-rejected items
      const status = activeTab === "active" ? undefined : activeTab;
      let data = await listCommonsQueue(status);
      if (activeTab === "active") {
        data = data.filter(
          (i) => i.curation_status !== "published" && i.curation_status !== "rejected"
        );
      }
      setItems(data);
    } catch {
      setError("Failed to load queue. Superuser access required.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      load();
    }
  }, [authLoading, isAuthenticated, load]);

  if (authLoading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!isAuthenticated || !isSuperuser) {
    return (
      <Box maxW="600px" mx="auto" px={6} py={16} textAlign="center">
        <Text color={mutedColor}>Superuser access required.</Text>
      </Box>
    );
  }

  return (
    <Box maxW="860px" mx="auto" px={{ base: 4, md: 6 }} py={8}>
      {/* Header */}
      <HStack justify="space-between" mb={6} pb={4} borderBottom="1px solid" borderColor={headerBorderColor}>
        <VStack align="start" gap={0}>
          <Text fontSize="xl" fontWeight="bold">
            Curation Station
          </Text>
          <Text fontSize="sm" color={mutedColor}>
            Commons capture → curate → publish
          </Text>
        </VStack>
        <Text fontSize="xs" color={mutedColor}>
          {items.length} item{items.length !== 1 ? "s" : ""}
        </Text>
      </HStack>

      {/* Status tabs */}
      <HStack gap={1} mb={6} wrap="wrap">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            size="sm"
            variant={activeTab === tab.value ? "solid" : "ghost"}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </HStack>

      {/* Content */}
      {loading ? (
        <Box textAlign="center" py={16}>
          <Spinner size="lg" />
        </Box>
      ) : error ? (
        <Text color="red.500" fontSize="sm">
          {error}
        </Text>
      ) : items.length === 0 ? (
        <Box textAlign="center" py={16}>
          <Text fontSize="sm" color={mutedColor}>
            No items in this queue.
          </Text>
        </Box>
      ) : (
        <VStack align="stretch" gap={4}>
          {items.map((item) => (
            <CurationCard key={item.id} summary={item} onChanged={load} />
          ))}
        </VStack>
      )}
    </Box>
  );
}

// --- Curation card ---

function CurationCard({
  summary,
  onChanged,
}: {
  summary: CommonsQueueItem;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(
    summary.curation_status === "in_curation"
  );
  const [detail, setDetail] = useState<CommonsItemDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit state — mirrors detail fields
  const [form, setForm] = useState<CommonsItemUpdatePayload>({});
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const quoteBorderColor = useColorModeValue("gray.300", "gray.600");
  const inputBg = useColorModeValue("gray.50", "gray.700");

  async function expand() {
    if (detail) {
      setExpanded((e) => !e);
      return;
    }
    setExpanded(true);
    setLoadingDetail(true);
    try {
      const d = await getCommonsItem(summary.id);
      setDetail(d);
      setForm({
        title: d.title,
        summary: d.summary,
        body: d.body,
        item_type: d.item_type,
        why_recommended: d.why_recommended,
        website: d.website,
        location_name: d.location_name,
        founder: d.founder,
        instagram: d.instagram,
        youtube: d.youtube,
        rss: d.rss,
        contact_email: d.contact_email,
      });
    } catch {
      setFeedback("Failed to load item detail.");
      setExpanded(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  function patch(key: keyof CommonsItemUpdatePayload, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await updateCommonsItem(summary.id, form);
      setDetail(updated);
      setFeedback("Saved.");
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedback("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function advance() {
    const action = ADVANCE_ACTION[summary.curation_status];
    if (!action) return;
    setAdvancing(true);
    setFeedback(null);
    try {
      await advanceCommonsItem(summary.id, action.target);
      onChanged();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to advance.";
      setFeedback(msg);
      setAdvancing(false);
    }
  }

  async function goBack() {
    const action = BACK_ACTION[summary.curation_status];
    if (!action) return;
    setAdvancing(true);
    try {
      await advanceCommonsItem(summary.id, action.target);
      onChanged();
    } catch {
      setFeedback("Failed.");
      setAdvancing(false);
    }
  }

  async function reject() {
    setRejecting(true);
    setFeedback(null);
    try {
      await rejectCommonsItem(summary.id);
      onChanged();
    } catch {
      setFeedback("Reject failed.");
      setRejecting(false);
    }
  }

  const advanceAction = ADVANCE_ACTION[summary.curation_status];
  const backAction = BACK_ACTION[summary.curation_status];
  const canReject =
    summary.curation_status !== "published" &&
    summary.curation_status !== "rejected";

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
    >
      {/* Collapsed header — always visible */}
      <Box
        px={5}
        py={4}
        cursor="pointer"
        onClick={expand}
        _hover={{ bg: useColorModeValue("gray.50", "gray.750") }}
      >
        <HStack justify="space-between" align="start" gap={3}>
          <VStack align="start" gap={1} flex={1} minW={0}>
            <HStack gap={2} wrap="wrap">
              <Text fontWeight="semibold" fontSize="sm" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" maxW="400px">
                {summary.title || <Text as="span" color={mutedColor} fontStyle="italic">Untitled</Text>}
              </Text>
              <Badge
                colorPalette={STATUS_COLORS[summary.curation_status]}
                size="sm"
                borderRadius="full"
              >
                {summary.curation_status.replace("_", " ")}
              </Badge>
              {summary.item_type && (
                <Badge size="sm" variant="outline" borderRadius="full">
                  {summary.item_type}
                </Badge>
              )}
            </HStack>
            <HStack gap={3} fontSize="xs" color={mutedColor}>
              {summary.location_name && <Text>{summary.location_name}</Text>}
              {summary.source_url && (
                <Text overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" maxW="260px">{summary.source_url}</Text>
              )}
              {summary.recommended_by_name && (
                <Text>rec. {summary.recommended_by_name}</Text>
              )}
            </HStack>
          </VStack>
          <Text fontSize="xs" color={mutedColor} flexShrink={0}>
            {expanded ? "▲" : "▼"}
          </Text>
        </HStack>
      </Box>

      {/* Expanded edit form */}
      {expanded && (
        <Box px={5} pb={5} borderTop="1px solid" borderColor={borderColor}>
          {loadingDetail ? (
            <Box textAlign="center" py={6}>
              <Spinner size="sm" />
            </Box>
          ) : detail ? (
            <VStack align="stretch" gap={4} pt={4}>
              {/* Why recommended — primary, shown first per UX spec */}
              <Box>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color={mutedColor}
                  textTransform="uppercase"
                  letterSpacing="wide"
                  mb={1}
                >
                  Why Recommended *
                </Text>
                <Textarea
                  bg={inputBg}
                  size="sm"
                  rows={3}
                  value={form.why_recommended ?? ""}
                  onChange={(e) => patch("why_recommended", e.target.value)}
                  placeholder="The human signal — why does this matter?"
                  borderColor={
                    !form.why_recommended
                      ? "orange.300"
                      : quoteBorderColor
                  }
                />
                {!form.why_recommended && (
                  <Text fontSize="xs" color="orange.500" mt={1}>
                    Required before publishing
                  </Text>
                )}
              </Box>

              {/* Core fields */}
              <HStack gap={3} align="start">
                <Box flex={3}>
                  <FieldLabel>Title</FieldLabel>
                  <Input
                    bg={inputBg}
                    size="sm"
                    value={form.title ?? ""}
                    onChange={(e) => patch("title", e.target.value)}
                  />
                </Box>
                <Box flex={1}>
                  <FieldLabel>Type</FieldLabel>
                  <Select.Root
                    size="sm"
                    collection={itemTypeCollection}
                    value={form.item_type ? [form.item_type] : [""]}
                    onValueChange={({ value }) =>
                      patch("item_type", value[0] as ItemType)
                    }
                  >
                    <Select.Control>
                      <Select.Trigger bg={inputBg}>
                        <Select.ValueText />
                      </Select.Trigger>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {ITEM_TYPE_OPTIONS.map((t) => (
                          <Select.Item key={t.value} item={t}>
                            {t.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Box>
              </HStack>

              <Box>
                <FieldLabel>Summary</FieldLabel>
                <Textarea
                  bg={inputBg}
                  size="sm"
                  rows={2}
                  value={form.summary ?? ""}
                  onChange={(e) => patch("summary", e.target.value)}
                />
              </Box>

              <Box>
                <FieldLabel>Body</FieldLabel>
                <Textarea
                  bg={inputBg}
                  size="sm"
                  rows={4}
                  value={form.body ?? ""}
                  onChange={(e) => patch("body", e.target.value)}
                />
              </Box>

              <HStack gap={3}>
                <Box flex={1}>
                  <FieldLabel>Location</FieldLabel>
                  <Input
                    bg={inputBg}
                    size="sm"
                    value={form.location_name ?? ""}
                    onChange={(e) => patch("location_name", e.target.value)}
                    placeholder="City, Region"
                  />
                </Box>
                <Box flex={1}>
                  <FieldLabel>Founder</FieldLabel>
                  <Input
                    bg={inputBg}
                    size="sm"
                    value={form.founder ?? ""}
                    onChange={(e) => patch("founder", e.target.value)}
                  />
                </Box>
              </HStack>

              <HStack gap={3}>
                <Box flex={1}>
                  <FieldLabel>Website</FieldLabel>
                  <Input
                    bg={inputBg}
                    size="sm"
                    value={form.website ?? ""}
                    onChange={(e) => patch("website", e.target.value)}
                    placeholder="https://"
                  />
                </Box>
                <Box flex={1}>
                  <FieldLabel>Instagram</FieldLabel>
                  <Input
                    bg={inputBg}
                    size="sm"
                    value={form.instagram ?? ""}
                    onChange={(e) => patch("instagram", e.target.value)}
                  />
                </Box>
              </HStack>

              {/* Source URL (read-only, for reference) */}
              {detail.source_url && (
                <Box>
                  <FieldLabel>Source URL (submitted)</FieldLabel>
                  <Text fontSize="xs" color={mutedColor} fontFamily="mono">
                    {detail.source_url}
                  </Text>
                </Box>
              )}

              {/* Extracted data preview */}
              {Object.keys(detail.extracted_data).length > 0 && (
                <Box>
                  <FieldLabel>Extracted data</FieldLabel>
                  <Box
                    bg={inputBg}
                    p={3}
                    borderRadius="md"
                    fontSize="xs"
                    fontFamily="mono"
                    maxH="120px"
                    overflowY="auto"
                    color={mutedColor}
                  >
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(detail.extracted_data, null, 2)}
                    </pre>
                  </Box>
                </Box>
              )}

              {/* Save + actions */}
              <HStack justify="space-between" pt={2} wrap="wrap" gap={2}>
                <HStack gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={save}
                    loading={saving}
                  >
                    Save
                  </Button>
                  {feedback && (
                    <Text
                      fontSize="xs"
                      color={
                        feedback === "Saved." ? "green.500" : "red.500"
                      }
                    >
                      {feedback}
                    </Text>
                  )}
                </HStack>

                <HStack gap={2}>
                  {backAction && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={goBack}
                      loading={advancing}
                    >
                      {backAction.label}
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      onClick={reject}
                      loading={rejecting}
                    >
                      Reject
                    </Button>
                  )}
                  {advanceAction && (
                    <Button
                      size="sm"
                      colorPalette={
                        advanceAction.target === "published" ? "green" : "blue"
                      }
                      onClick={advance}
                      loading={advancing}
                    >
                      {advanceAction.label}
                    </Button>
                  )}
                </HStack>
              </HStack>
            </VStack>
          ) : null}
        </Box>
      )}
    </Box>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  const color = useColorModeValue("gray.500", "gray.400");
  return (
    <Text
      fontSize="xs"
      fontWeight="semibold"
      color={color}
      textTransform="uppercase"
      letterSpacing="wide"
      mb={1}
    >
      {children}
    </Text>
  );
}
