// apps/mixtape/src/components/workbench/FeedbackQueue.tsx
//
// Feedback source panel for the global Workbench.
// Aggregates FeedbackItems (Lighthouse + Beacon submissions) into the curation queue.
// Triage actions: accept (sent_to_agent), archive (wontfix), delete.

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  HStack,
  NativeSelect,
  Spinner,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  deleteFeedbackItem,
  listFeedbackChecklist,
  updateFeedbackStatus,
  type FeedbackChecklistItem,
  type FeedbackKind,
  type FeedbackStatus,
} from "@mixtape/api/clients/feedback/feedbackApi";
import { MixtapeAlert } from "@/components/ui/alerts/MixtapeAlert";
import { toaster } from "@mixtape/core/lib/toaster";
import { formatDateTime } from "@/lib/utils/dateFormatters";

const KIND_OPTIONS: Array<FeedbackKind | "all"> = ["all", "issue", "bug", "request", "idea"];
const STATUS_OPTIONS: Array<FeedbackStatus | "all"> = [
  "all", "new", "sent_to_agent", "triaged", "planned", "shipped", "wontfix",
];

const STATUS_COLOR: Record<FeedbackStatus, string> = {
  new: "blue",
  sent_to_agent: "purple",
  triaged: "teal",
  planned: "cyan",
  shipped: "green",
  wontfix: "gray",
};

const BEACON_LABEL: Record<string, string> = {
  lighthouse: "Lighthouse",
};

export function FeedbackQueue() {
  const [items, setItems] = useState<FeedbackChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [kind, setKind] = useState<FeedbackKind | "all">("all");
  const [status, setStatus] = useState<FeedbackStatus | "all">("new");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listFeedbackChecklist({
        kind: kind === "all" ? undefined : kind,
        status: status === "all" ? undefined : status,
        pageSize: 50,
      });
      setItems(result.results);
    } catch {
      setError("Failed to load feedback items.");
    } finally {
      setLoading(false);
    }
  }, [kind, status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = useCallback(async (item: FeedbackChecklistItem) => {
    setUpdatingId(item.id);
    try {
      await updateFeedbackStatus(item.id, "sent_to_agent");
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "sent_to_agent" } : i))
      );
      toaster.create({ title: "Accepted — sent to agent", type: "success" });
    } catch {
      toaster.create({ title: "Action failed", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const handleArchive = useCallback(async (item: FeedbackChecklistItem) => {
    setUpdatingId(item.id);
    try {
      await updateFeedbackStatus(item.id, "wontfix");
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "wontfix" } : i))
      );
      toaster.create({ title: "Archived", type: "success" });
    } catch {
      toaster.create({ title: "Action failed", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const handleDelete = useCallback(async (item: FeedbackChecklistItem) => {
    if (!confirm(`Delete this feedback item?`)) return;
    setUpdatingId(item.id);
    try {
      await deleteFeedbackItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toaster.create({ title: "Deleted", type: "success" });
    } catch {
      toaster.create({ title: "Delete failed", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  }, []);

  return (
    <VStack align="stretch" gap={4}>
      <HStack gap={3} wrap="wrap">
        <NativeSelect.Root size="sm" w="130px">
          <NativeSelect.Field
            value={kind}
            onChange={(e) => setKind(e.target.value as FeedbackKind | "all")}
          >
            {KIND_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {k === "all" ? "All kinds" : k}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>

        <NativeSelect.Root size="sm" w="150px">
          <NativeSelect.Field
            value={status}
            onChange={(e) => setStatus(e.target.value as FeedbackStatus | "all")}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : s.replace(/_/g, " ")}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>

        <Button size="sm" variant="outline" onClick={load} loading={loading}>
          Refresh
        </Button>

        <Badge colorPalette="blue" ml="auto">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </Badge>
      </HStack>

      {error ? (
        <MixtapeAlert status="error" title="Load failed" description={error} />
      ) : loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="lg" />
        </Box>
      ) : items.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text color="fg.muted">No feedback items match these filters.</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Message</Table.ColumnHeader>
                <Table.ColumnHeader>Source</Table.ColumnHeader>
                <Table.ColumnHeader>Kind</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>By</Table.ColumnHeader>
                <Table.ColumnHeader>When</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell maxW="320px">
                    <Text fontSize="sm" lineClamp={2}>{item.message}</Text>
                    {item.page_url && (
                      <Text fontSize="xs" color="fg.muted" truncate>{item.page_url}</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="sm" variant="subtle" colorPalette="green">
                      {BEACON_LABEL[item.beacon_key] ?? item.beacon_title}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="sm" variant="outline">{item.kind}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="sm"
                      colorPalette={STATUS_COLOR[item.status as FeedbackStatus] ?? "gray"}
                    >
                      {item.status.replace(/_/g, " ")}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell fontSize="xs" color="fg.muted">
                    {item.user_username ?? "—"}
                  </Table.Cell>
                  <Table.Cell fontSize="xs" color="fg.muted">
                    {formatDateTime(item.created_at)}
                  </Table.Cell>
                  <Table.Cell>
                    <HStack justify="flex-end" gap={1}>
                      <Button
                        size="xs"
                        colorPalette="teal"
                        variant="subtle"
                        onClick={() => handleAccept(item)}
                        disabled={item.status === "sent_to_agent" || !!updatingId}
                        loading={updatingId === item.id}
                      >
                        Accept
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleArchive(item)}
                        disabled={item.status === "wontfix" || !!updatingId}
                        loading={updatingId === item.id}
                      >
                        Archive
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => handleDelete(item)}
                        disabled={!!updatingId}
                        loading={updatingId === item.id}
                      >
                        Delete
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </VStack>
  );
}
