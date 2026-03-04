"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, CloseButton, HStack, NativeSelect, Spinner, Text, Textarea, VStack } from "@chakra-ui/react";
import {
  deleteFeedbackItem,
  listFeedbackChecklist,
  updateFeedbackItem,
  updateFeedbackStatus,
  type FeedbackChecklistItem,
  type FeedbackKind,
  type FeedbackStatus,
} from "@mixtape/api/clients/feedback/feedbackApi";
import { useAuth } from "@/lib/auth/AuthContext";

const FEEDBACK_CHECKLIST_REFRESH_EVENT = "feedback-checklist-refresh";
const FEEDBACK_CHECKLIST_FILTERS_STORAGE_KEY = "feedback_checklist_filters_v1";

const FEEDBACK_KIND_OPTIONS: Array<FeedbackKind | "all"> = ["all", "issue", "bug", "request", "idea"];
const FEEDBACK_STATUS_OPTIONS: Array<FeedbackStatus | "all"> = [
  "all",
  "new",
  "sent_to_agent",
  "triaged",
  "planned",
  "shipped",
  "wontfix",
];

export default function FeedbackChecklistPage() {
  const { user } = useAuth();
  const isSuperuser = !!user?.is_superuser;
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [briefText, setBriefText] = useState("");
  const [copied, setCopied] = useState(false);
  const [items, setItems] = useState<FeedbackChecklistItem[]>([]);
  const [fadingIds, setFadingIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState("");
  const [kind, setKind] = useState<FeedbackKind | "all">("all");
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");
  const [filtersReady, setFiltersReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(FEEDBACK_CHECKLIST_FILTERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { kind?: string; status?: string };
        if (parsed.kind && FEEDBACK_KIND_OPTIONS.includes(parsed.kind as FeedbackKind | "all")) {
          setKind(parsed.kind as FeedbackKind | "all");
        }
        if (parsed.status && FEEDBACK_STATUS_OPTIONS.includes(parsed.status as FeedbackStatus | "all")) {
          setStatus(parsed.status as FeedbackStatus | "all");
        }
      }
    } catch {
      // no-op
    } finally {
      setFiltersReady(true);
    }
  }, []);

  useEffect(() => {
    if (!filtersReady || typeof window === "undefined") return;
    window.localStorage.setItem(
      FEEDBACK_CHECKLIST_FILTERS_STORAGE_KEY,
      JSON.stringify({ kind, status })
    );
  }, [kind, status, filtersReady]);

  const refreshItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listFeedbackChecklist({ kind, status, pageSize: 100 });
      setItems(res.results);
    } catch {
      setError("Failed to load checklist");
    } finally {
      setLoading(false);
    }
  }, [kind, status]);

  useEffect(() => {
    if (!filtersReady) return;
    void refreshItems();
  }, [refreshItems, filtersReady]);

  useEffect(() => {
    const onRefresh = () => {
      void refreshItems();
    };
    window.addEventListener(FEEDBACK_CHECKLIST_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(FEEDBACK_CHECKLIST_REFRESH_EVENT, onRefresh);
  }, [refreshItems]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => items.some((item) => item.id === id && item.status !== "shipped")));
  }, [items]);

  const emptyMessage = useMemo(() => {
    if (loading) return "";
    if (error) return error;
    if (items.length === 0) return "No checklist items yet.";
    return "";
  }, [error, items.length, loading]);

  const removeWithFade = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setFadingIds((prev) => Array.from(new Set([...prev, ...ids])));
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      setFadingIds((prev) => prev.filter((id) => !ids.includes(id)));
    }, 420);
  }, []);

  const shouldFadeRemoveForStatus = useCallback(
    (nextStatus: FeedbackStatus) => status !== "all" && nextStatus !== status,
    [status]
  );

  const handleMarkShipped = async (id: string) => {
    setUpdatingId(id);
    try {
      const updated = await updateFeedbackStatus(id, "shipped");
      if (shouldFadeRemoveForStatus("shipped")) {
        removeWithFade([id]);
      } else {
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkSentToAgent = async (id: string) => {
    setUpdatingId(id);
    try {
      const updated = await updateFeedbackStatus(id, "sent_to_agent");
      if (shouldFadeRemoveForStatus("sent_to_agent")) {
        removeWithFade([id]);
      } else {
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const confirmed = window.confirm("Delete this checklist item?");
    if (!confirmed) return;
    setUpdatingId(id);
    try {
      await deleteFeedbackItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSelection = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((existingId) => existingId !== id);
    });
  };

  const selectableIds = items.filter((item) => item.status !== "shipped").map((item) => item.id);
  const allVisibleSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllVisible = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((prev) => prev.filter((id) => !selectableIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => {
      const set = new Set(prev);
      selectableIds.forEach((id) => set.add(id));
      return Array.from(set);
    });
  };

  const handleBulkUpdateStatus = async (nextStatus: FeedbackStatus) => {
    const targets = selectedIds.filter((id) => selectableIds.includes(id));
    if (targets.length === 0) return;

    setBulkUpdating(true);
    try {
      const results = await Promise.all(
        targets.map(async (id) => {
          try {
            const updated = await updateFeedbackStatus(id, nextStatus);
            return { id, updated };
          } catch {
            return { id, updated: null };
          }
        })
      );

      const updates = new Map(results.filter((result) => result.updated).map((result) => [result.id, result.updated]));
      const failedIds = results.filter((result) => !result.updated).map((result) => result.id);
      setSelectedIds(failedIds);
      const successIds = results.filter((result) => result.updated).map((result) => result.id);
      if (shouldFadeRemoveForStatus(nextStatus)) {
        removeWithFade(successIds);
      } else {
        setItems((prev) => prev.map((item) => updates.get(item.id) ?? item));
      }
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    const targets = selectedIds.filter((id) => items.some((item) => item.id === id));
    if (targets.length === 0) return;
    const confirmed = window.confirm(`Delete ${targets.length} selected item(s)?`);
    if (!confirmed) return;

    setBulkUpdating(true);
    try {
      const results = await Promise.all(
        targets.map(async (id) => {
          try {
            await deleteFeedbackItem(id);
            return { id, deleted: true };
          } catch {
            return { id, deleted: false };
          }
        })
      );
      const deletedIds = new Set(results.filter((result) => result.deleted).map((result) => result.id));
      const failedIds = results.filter((result) => !result.deleted).map((result) => result.id);
      setItems((prev) => prev.filter((item) => !deletedIds.has(item.id)));
      setSelectedIds(failedIds);
    } finally {
      setBulkUpdating(false);
    }
  };

  const selectedIssues = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id) && item.kind === "issue"),
    [items, selectedIds]
  );

  const buildCodexBrief = () => {
    const issueLines = selectedIssues.map((item, idx) => {
      const title = item.message.split("\n")[0] || "Untitled issue";
      return `${idx + 1}. [${item.id}] ${title}
Status: ${item.status}
Page: ${item.page_url || "(not provided)"}
Details:
${item.message}`;
    });

    const text = `Agent Brief

Goal:
Resolve the selected feedback issues from the checklist.

Scope:
- Frontend + backend as needed for the listed issue IDs.
- Use existing patterns in Mixtape/Crossroads.

Selected Issues (${selectedIssues.length}):
${issueLines.join("\n\n")}

Acceptance Criteria:
- Each listed issue is implemented and verifiable.
- No regressions in existing flows.
- Include migration/tests only if required by the selected changes.

Notes:
- Source: /feedback/checklist
- Generated: ${new Date().toISOString()}`;

    setBriefText(text);
    setCopied(false);
  };

  const copyBrief = async () => {
    if (!briefText.trim()) return;
    await navigator.clipboard.writeText(briefText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const startEdit = (item: FeedbackChecklistItem) => {
    setEditingId(item.id);
    setEditingMessage(item.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingMessage("");
  };

  const saveEdit = async (itemId: string) => {
    const next = editingMessage.trim();
    if (!next) return;
    setUpdatingId(itemId);
    try {
      const updated = await updateFeedbackItem(itemId, { message: next });
      setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
      setEditingId(null);
      setEditingMessage("");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Box p={{ base: 4, md: 6 }}>
      <VStack align="stretch" gap={4} maxW="980px" mx="auto">
        <VStack align="start" gap={1}>
          <Text fontSize="2xl" fontWeight="bold">Feedback Checklist</Text>
          <Text color="fg.muted">Read-only queue for feedback beacons and Grist /issue entries.</Text>
          <Text fontSize="sm" color="fg.muted">
            Use filters to narrow the queue. Superadmins can select multiple visible rows and check them off in one action.
          </Text>
        </VStack>

        <HStack gap={3} wrap="wrap">
          <NativeSelect.Root w={{ base: "full", md: "220px" }}>
            <NativeSelect.Field
              value={kind}
              onChange={(event) => setKind(event.currentTarget.value as FeedbackKind | "all")}
            >
              <option value="all">All kinds</option>
              <option value="issue">Issue</option>
              <option value="bug">Bug</option>
              <option value="request">Request</option>
              <option value="idea">Idea</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>

          <NativeSelect.Root w={{ base: "full", md: "220px" }}>
            <NativeSelect.Field
              value={status}
              onChange={(event) => setStatus(event.currentTarget.value as FeedbackStatus | "all")}
            >
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="sent_to_agent">Sent to agent</option>
              <option value="triaged">Triaged</option>
              <option value="planned">Planned</option>
              <option value="shipped">Shipped</option>
              <option value="wontfix">Won't fix</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>

          {isSuperuser ? (
            <HStack gap={3} wrap="wrap">
              <HStack gap={2}>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(event) => toggleSelectAllVisible(event.currentTarget.checked)}
                  aria-label="Select all visible checklist items"
                />
                <Text fontSize="sm" color="fg.muted">Select all visible</Text>
              </HStack>
              <Button
                size="sm"
                colorPalette="green"
                variant="outline"
                disabled={selectedIds.length === 0 || bulkUpdating}
                onClick={() => void handleBulkUpdateStatus("shipped")}
              >
                {bulkUpdating ? "Updating..." : `Check off selected (${selectedIds.length})`}
              </Button>
              <Button
                size="sm"
                colorPalette="blue"
                variant="outline"
                disabled={selectedIds.length === 0 || bulkUpdating}
                onClick={() => void handleBulkUpdateStatus("sent_to_agent")}
              >
                {bulkUpdating ? "Updating..." : `Mark selected sent to agent (${selectedIds.length})`}
              </Button>
              <Button
                size="sm"
                colorPalette="red"
                variant="outline"
                disabled={selectedIds.length === 0 || bulkUpdating}
                onClick={() => void handleBulkDelete()}
              >
                {bulkUpdating ? "Updating..." : `Delete selected (${selectedIds.length})`}
              </Button>
              <Button
                size="sm"
                colorPalette="blue"
                variant="outline"
                disabled={selectedIssues.length === 0}
                onClick={buildCodexBrief}
              >
                Generate Agent Brief ({selectedIssues.length})
              </Button>
            </HStack>
          ) : null}
        </HStack>

        {briefText ? (
          <VStack align="stretch" gap={2} p={3} borderWidth="1px" borderColor="border" borderRadius="md" bg="bg.panel">
            <HStack justify="space-between">
              <Text fontSize="sm" fontWeight="semibold">Codex-ready brief (copy/paste)</Text>
              <HStack gap={1}>
                <Button size="xs" onClick={() => void copyBrief()}>
                  {copied ? "Copied" : "Copy brief"}
                </Button>
                <CloseButton size="sm" aria-label="Close brief" onClick={() => setBriefText("")} />
              </HStack>
            </HStack>
            <Textarea value={briefText} onChange={(event) => setBriefText(event.currentTarget.value)} minH="220px" fontFamily="mono" fontSize="sm" />
          </VStack>
        ) : null}

        {loading ? (
          <HStack py={8} justify="center"><Spinner /></HStack>
        ) : null}

        {emptyMessage ? (
          <Text color="fg.muted">{emptyMessage}</Text>
        ) : null}

        <VStack align="stretch" gap={3}>
          {items.map((item) => (
            <Box
              key={item.id}
              borderWidth="1px"
              borderColor="border"
              borderRadius="lg"
              p={4}
              bg="bg.panel"
              opacity={fadingIds.includes(item.id) ? 0 : 1}
              transform={fadingIds.includes(item.id) ? "translateY(-6px)" : "translateY(0px)"}
              transition="opacity 0.4s ease, transform 0.4s ease"
              pointerEvents={fadingIds.includes(item.id) ? "none" : "auto"}
            >
              <HStack justify="space-between" wrap="wrap" gap={2}>
                <HStack gap={2}>
                  {isSuperuser ? (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={(event) => toggleSelection(item.id, event.currentTarget.checked)}
                      disabled={item.status === "shipped" || updatingId === item.id || bulkUpdating}
                      aria-label={`Select feedback item ${item.id}`}
                    />
                  ) : null}
                  <Text fontSize="sm" fontWeight="semibold" textTransform="capitalize">{item.kind}</Text>
                  <Text fontSize="xs" color="fg.muted">{item.status}</Text>
                  <Text fontSize="xs" color="fg.muted">{new Date(item.created_at).toLocaleString()}</Text>
                </HStack>
                <Text fontSize="xs" color="fg.muted">{item.beacon_title} ({item.beacon_key})</Text>
              </HStack>

              {editingId === item.id ? (
                <VStack mt={2} align="stretch" gap={2}>
                  <Textarea
                    value={editingMessage}
                    onChange={(event) => setEditingMessage(event.currentTarget.value)}
                    minH="110px"
                    fontSize="sm"
                  />
                  <HStack justify="flex-end" gap={2}>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={updatingId === item.id}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="xs"
                      colorPalette="blue"
                      onClick={() => void saveEdit(item.id)}
                      disabled={updatingId === item.id || !editingMessage.trim()}
                    >
                      Save edit
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <Text mt={2} whiteSpace="pre-wrap">{item.message}</Text>
              )}

              {item.page_url ? (
                <Text mt={2} fontSize="xs" color="fg.muted">Page: {item.page_url}</Text>
              ) : null}

              {isSuperuser ? (
                <HStack mt={3} justify="flex-end" gap={2}>
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={updatingId === item.id}
                    onClick={() => startEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    colorPalette="blue"
                    variant={item.status === "sent_to_agent" ? "solid" : "outline"}
                    disabled={item.status === "sent_to_agent" || updatingId === item.id}
                    onClick={() => void handleMarkSentToAgent(item.id)}
                  >
                    {item.status === "sent_to_agent" ? "Sent to agent" : "Mark sent to agent"}
                  </Button>
                  <Button
                    size="xs"
                    colorPalette="green"
                    variant={item.status === "shipped" ? "solid" : "outline"}
                    disabled={item.status === "shipped" || updatingId === item.id}
                    onClick={() => void handleMarkShipped(item.id)}
                  >
                    {item.status === "shipped" ? "Checked off" : "Check off"}
                  </Button>
                  <Button
                    size="xs"
                    colorPalette="red"
                    variant="outline"
                    disabled={updatingId === item.id}
                    onClick={() => void handleDeleteItem(item.id)}
                  >
                    Delete
                  </Button>
                </HStack>
              ) : null}
            </Box>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
}
