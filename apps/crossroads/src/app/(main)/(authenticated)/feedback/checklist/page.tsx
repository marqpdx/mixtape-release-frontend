"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, HStack, NativeSelect, Spinner, Text, VStack } from "@chakra-ui/react";
import {
  listFeedbackChecklist,
  updateFeedbackStatus,
  type FeedbackChecklistItem,
  type FeedbackKind,
  type FeedbackStatus,
} from "@mixtape/api/clients/feedback/feedbackApi";
import { useAuth } from "@/lib/auth/AuthContext";

export default function FeedbackChecklistPage() {
  const { user } = useAuth();
  const isSuperuser = !!user?.is_superuser;
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [items, setItems] = useState<FeedbackChecklistItem[]>([]);
  const [kind, setKind] = useState<FeedbackKind | "all">("all");
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listFeedbackChecklist({ kind, status, pageSize: 100 });
        if (!cancelled) setItems(res.results);
      } catch {
        if (!cancelled) setError("Failed to load checklist");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [kind, status]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => items.some((item) => item.id === id && item.status !== "shipped")));
  }, [items]);

  const emptyMessage = useMemo(() => {
    if (loading) return "";
    if (error) return error;
    if (items.length === 0) return "No checklist items yet.";
    return "";
  }, [error, items.length, loading]);

  const handleMarkShipped = async (id: string) => {
    setUpdatingId(id);
    try {
      const updated = await updateFeedbackStatus(id, "shipped");
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
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

  const handleBulkMarkShipped = async () => {
    const targets = selectedIds.filter((id) => selectableIds.includes(id));
    if (targets.length === 0) return;

    setBulkUpdating(true);
    try {
      const results = await Promise.all(
        targets.map(async (id) => {
          try {
            const updated = await updateFeedbackStatus(id, "shipped");
            return { id, updated };
          } catch {
            return { id, updated: null };
          }
        })
      );

      const updates = new Map(results.filter((result) => result.updated).map((result) => [result.id, result.updated]));
      setItems((prev) => prev.map((item) => updates.get(item.id) ?? item));

      const failedIds = results.filter((result) => !result.updated).map((result) => result.id);
      setSelectedIds(failedIds);
    } finally {
      setBulkUpdating(false);
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
              <option value="triaged">Triaged</option>
              <option value="planned">Planned</option>
              <option value="shipped">Shipped</option>
              <option value="wontfix">Won't fix</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>

          {isSuperuser ? (
            <HStack gap={3}>
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
                onClick={() => void handleBulkMarkShipped()}
              >
                {bulkUpdating ? "Checking off..." : `Check off selected (${selectedIds.length})`}
              </Button>
            </HStack>
          ) : null}
        </HStack>

        {loading ? (
          <HStack py={8} justify="center"><Spinner /></HStack>
        ) : null}

        {emptyMessage ? (
          <Text color="fg.muted">{emptyMessage}</Text>
        ) : null}

        <VStack align="stretch" gap={3}>
          {items.map((item) => (
            <Box key={item.id} borderWidth="1px" borderColor="border" borderRadius="lg" p={4} bg="bg.panel">
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

              <Text mt={2} whiteSpace="pre-wrap">{item.message}</Text>

              {item.page_url ? (
                <Text mt={2} fontSize="xs" color="fg.muted">Page: {item.page_url}</Text>
              ) : null}

              {isSuperuser ? (
                <HStack mt={3} justify="flex-end">
                  <Button
                    size="xs"
                    colorPalette="green"
                    variant={item.status === "shipped" ? "solid" : "outline"}
                    disabled={item.status === "shipped" || updatingId === item.id}
                    onClick={() => void handleMarkShipped(item.id)}
                  >
                    {item.status === "shipped" ? "Checked off" : "Check off"}
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
