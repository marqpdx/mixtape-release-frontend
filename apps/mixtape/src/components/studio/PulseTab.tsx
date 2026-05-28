"use client";

import { useState } from "react";
import { Box, Button, HStack, Input, NativeSelect, Skeleton, Text, Textarea, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useStudioGroupPulse, useGroupRecurringActions, useCreateRecurringAction, useDeleteRecurringAction } from "@mixtape/api/hooks/studio";
import type { GroupPulseMetrics, StudioActivityItem, RecurringActionItem } from "@mixtape/api/clients/studio/studioApi";

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({ label, value }: { label: string; value: number }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      flex="1"
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      minW="0"
    >
      <Text fontSize="2xl" fontWeight="bold">{value}</Text>
      <Text fontSize="xs" color="gray.500" mt={0.5}>{label}</Text>
    </Box>
  );
}

function MetricStrip({ metrics }: { metrics: GroupPulseMetrics }) {
  return (
    <HStack gap={4} align="stretch">
      <MetricCard label="Active Threads" value={metrics.active_threads} />
      <MetricCard label="Pending Approvals" value={metrics.pending_approvals} />
      <MetricCard label="New Members (7d)" value={metrics.new_members} />
      <MetricCard label="Ops in Flight" value={metrics.loom_ops_in_flight} />
    </HStack>
  );
}

function MetricStripSkeleton() {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <HStack gap={4}>
      {[1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          flex="1"
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="lg"
          p={4}
        >
          <Skeleton height="28px" mb={2} />
          <Skeleton height="12px" width="60%" />
        </Box>
      ))}
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------

function ActivityRow({ item }: { item: StudioActivityItem }) {
  const borderColor = useColorModeValue("gray.100", "gray.700");

  const relativeTime = (ts: string | null) => {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <HStack
      justify="space-between"
      py={2}
      borderBottom="1px solid"
      borderColor={borderColor}
      _last={{ border: "none" }}
    >
      <VStack align="start" gap={0} flex={1} minW={0}>
        <Text fontSize="sm" fontWeight="medium" lineClamp={1}>{item.verb}</Text>
        {item.summary && (
          <Text fontSize="xs" color="gray.500" lineClamp={1}>{item.summary}</Text>
        )}
      </VStack>
      <Text fontSize="xs" color="gray.400" flexShrink={0} ml={2}>
        {relativeTime(item.timestamp)}
      </Text>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// RecurringAction digest (due/overdue items from pulse response)
// ---------------------------------------------------------------------------

function dueLabel(nextDueAt: string, isOverdue: boolean): string {
  if (isOverdue) return "Overdue";
  const diff = new Date(nextDueAt).getTime() - Date.now();
  const h = Math.floor(diff / 3_600_000);
  if (h < 24) return `Due in ${h}h`;
  return `Due in ${Math.floor(h / 24)}d`;
}

function RecurringActionDigest({ items }: { items: RecurringActionItem[] }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const itemBorder = useColorModeValue("gray.100", "gray.700");
  const overdueBg = useColorModeValue("red.50", "red.900");
  const dueBg = useColorModeValue("yellow.50", "yellow.900");

  if (items.length === 0) return null;

  return (
    <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={5}>
      <Text fontWeight="semibold" mb={4}>Due Actions</Text>
      <VStack gap={0} align="stretch">
        {items.map((item) => (
          <HStack
            key={item.id}
            justify="space-between"
            py={2}
            borderBottom="1px solid"
            borderColor={itemBorder}
            _last={{ border: "none" }}
          >
            <VStack align="start" gap={0} flex={1} minW={0}>
              <Text fontSize="sm" fontWeight="medium" lineClamp={1}>{item.title}</Text>
              <HStack gap={2}>
                <Text fontSize="xs" color="gray.500" textTransform="capitalize">{item.recurrence_rule}</Text>
                {item.suggested_verb && (
                  <Text fontSize="xs" bg={useColorModeValue("blue.50", "blue.900")} px={1.5} borderRadius="sm" color="blue.500">
                    {item.suggested_verb}
                  </Text>
                )}
              </HStack>
            </VStack>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              flexShrink={0}
              ml={2}
              color={item.is_overdue ? "red.500" : "yellow.600"}
            >
              {dueLabel(item.next_due_at, !!item.is_overdue)}
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// RecurringAction admin panel (full list + create form)
// ---------------------------------------------------------------------------

const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every two weeks" },
  { value: "monthly", label: "Monthly" },
];

function RecurringActionsAdmin({ groupSlug }: { groupSlug: string }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const itemBorder = useColorModeValue("gray.100", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const { data: actions, isLoading } = useGroupRecurringActions(groupSlug);
  const { mutate: create, isPending: creating } = useCreateRecurringAction(groupSlug);
  const { mutate: remove, isPending: deleting } = useDeleteRecurringAction(groupSlug);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recurrenceRule, setRecurrenceRule] = useState("weekly");
  const [nextDueAt, setNextDueAt] = useState("");
  const [suggestedVerb, setSuggestedVerb] = useState("");
  const [suggestedLabel, setSuggestedLabel] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setRecurrenceRule("weekly");
    setNextDueAt("");
    setSuggestedVerb("");
    setSuggestedLabel("");
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!title.trim() || !nextDueAt) return;
    create(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        recurrence_rule: recurrenceRule,
        next_due_at: new Date(nextDueAt).toISOString(),
        suggested_verb: suggestedVerb.trim() || undefined,
        suggested_label: suggestedLabel.trim() || undefined,
      },
      { onSuccess: resetForm },
    );
  };

  return (
    <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={5}>
      <HStack justify="space-between" mb={4}>
        <Text fontWeight="semibold">Recurring Actions</Text>
        <Button size="xs" variant="outline" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add"}
        </Button>
      </HStack>

      {showForm && (
        <Box mb={5} p={4} border="1px solid" borderColor={itemBorder} borderRadius="md">
          <VStack gap={3} align="stretch">
            <Input
              size="sm"
              placeholder="Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              size="sm"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <NativeSelect.Root size="sm">
              <NativeSelect.Field
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.currentTarget.value)}
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
            <Box>
              <Text fontSize="xs" color={mutedColor} mb={1}>First due at *</Text>
              <Input
                size="sm"
                type="datetime-local"
                value={nextDueAt}
                onChange={(e) => setNextDueAt(e.target.value)}
              />
            </Box>
            <Input
              size="sm"
              placeholder="Suggested verb (optional, e.g. draft)"
              value={suggestedVerb}
              onChange={(e) => setSuggestedVerb(e.target.value)}
            />
            <Input
              size="sm"
              placeholder="Suggested label (optional)"
              value={suggestedLabel}
              onChange={(e) => setSuggestedLabel(e.target.value)}
            />
            <Button
              size="sm"
              colorScheme="blue"
              onClick={handleCreate}
              disabled={!title.trim() || !nextDueAt || creating}
              loading={creating}
            >
              Create
            </Button>
          </VStack>
        </Box>
      )}

      {isLoading ? (
        <VStack gap={2} align="stretch">
          {[1, 2].map((i) => <Skeleton key={i} height="40px" borderRadius="md" />)}
        </VStack>
      ) : !actions || actions.length === 0 ? (
        <Text fontSize="sm" color={mutedColor}>No recurring actions yet.</Text>
      ) : (
        <VStack gap={0} align="stretch">
          {actions.map((item) => (
            <HStack
              key={item.id}
              justify="space-between"
              py={2}
              borderBottom="1px solid"
              borderColor={itemBorder}
              _last={{ border: "none" }}
            >
              <VStack align="start" gap={0} flex={1} minW={0}>
                <Text fontSize="sm" fontWeight="medium" lineClamp={1}>{item.title}</Text>
                <Text fontSize="xs" color={mutedColor} textTransform="capitalize">{item.recurrence_rule}</Text>
              </VStack>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={() => remove(item.id)}
                disabled={deleting}
              >
                Remove
              </Button>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// PulseTab
// ---------------------------------------------------------------------------

interface PulseTabProps {
  groupSlug: string;
}

export function PulseTab({ groupSlug }: PulseTabProps) {
  const { data, isLoading, error } = useStudioGroupPulse(groupSlug);
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  if (isLoading) {
    return (
      <VStack gap={4} align="stretch">
        <MetricStripSkeleton />
        <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={5}>
          <Text fontWeight="semibold" mb={4}>Activity</Text>
          <VStack gap={3} align="stretch">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} height="36px" borderRadius="md" />)}
          </VStack>
        </Box>
      </VStack>
    );
  }

  if (error) {
    return <Text fontSize="sm" color="red.400">Failed to load pulse data.</Text>;
  }

  return (
    <VStack gap={4} align="stretch">
      <MetricStrip metrics={data!.metrics} />

      <RecurringActionDigest items={data!.recurring_actions ?? []} />

      <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={5}>
        <Text fontWeight="semibold" mb={4}>Activity</Text>
        {data!.activity.length === 0 ? (
          <Text fontSize="sm" color="gray.400">No recent activity.</Text>
        ) : (
          <VStack gap={0} align="stretch">
            {data!.activity.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </VStack>
        )}
      </Box>

      <RecurringActionsAdmin groupSlug={groupSlug} />
    </VStack>
  );
}
