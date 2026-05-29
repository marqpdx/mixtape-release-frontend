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
  const suggestedVerbBg = useColorModeValue("blue.50", "blue.900");

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
                  <Text fontSize="xs" bg={suggestedVerbBg} px={1.5} borderRadius="sm" color="blue.500">
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

// ---------------------------------------------------------------------------
// Verb picker — guided suggested_verb / suggested_context builder
//
// GUIDED_VERBS is a typed constant that mirrors the shape a future backend
// endpoint (e.g. GET /api/studio/verbs?group=<slug>) would return. When that
// endpoint exists, replace this constant with a useGroupVerbs(groupSlug) hook
// result and no structural changes to VerbPicker are needed.
// ---------------------------------------------------------------------------

interface ContextFieldConfig {
  key: string;
  label: string;
  type: "text" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface VerbConfig {
  verb_id: string;
  label: string;
  description: string;
  context_fields: ContextFieldConfig[];
  label_formula: (fields: Record<string, string>) => string;
}

const GUIDED_VERBS: VerbConfig[] = [
  {
    verb_id: "draft",
    label: "Draft",
    description: "Compose a text artifact (email, announcement, etc.)",
    context_fields: [
      {
        key: "persona_context",
        label: "Voice or persona",
        type: "text",
        placeholder: "e.g. facilitator, newsletter voice (optional)",
      },
      {
        key: "recipient_context",
        label: "Who this is for",
        type: "text",
        placeholder: "e.g. group members, new subscribers (optional)",
      },
    ],
    label_formula: (f) =>
      f.recipient_context ? `Draft for ${f.recipient_context}` : "Draft",
  },
  {
    verb_id: "summarize",
    label: "Summarize",
    description: "Produce a summary of recent content or activity",
    context_fields: [
      {
        key: "content_type",
        label: "What to summarize",
        type: "select",
        options: [
          { value: "recent_activity", label: "Recent activity" },
          { value: "recent_documents", label: "Recent documents" },
          { value: "member_contributions", label: "Member contributions" },
        ],
      },
    ],
    label_formula: (f) => {
      const scopes: Record<string, string> = {
        recent_activity: "recent activity",
        recent_documents: "recent documents",
        member_contributions: "member contributions",
      };
      return `Summarize ${scopes[f.content_type] ?? "content"}`;
    },
  },
  {
    verb_id: "synthesize",
    label: "Synthesize",
    description: "Combine and distill member inputs into a unified view",
    context_fields: [
      {
        key: "focus",
        label: "Focus",
        type: "text",
        placeholder: "e.g. member ideas on onboarding (optional)",
      },
    ],
    label_formula: (f) =>
      f.focus ? `Synthesize — ${f.focus}` : "Synthesize contributions",
  },
  {
    verb_id: "retrieve",
    label: "Retrieve",
    description: "Surface relevant records or discussions from the group",
    context_fields: [
      {
        key: "query",
        label: "What to look for",
        type: "text",
        placeholder: "e.g. recent discussions about reading selections",
      },
    ],
    label_formula: (f) =>
      f.query ? `Retrieve — ${f.query}` : "Retrieve",
  },
  {
    verb_id: "curate",
    label: "Curate",
    description: "Collect and surface content for the group to review",
    context_fields: [
      {
        key: "content_type",
        label: "Content type",
        type: "select",
        options: [
          { value: "articles", label: "Articles" },
          { value: "member_posts", label: "Member posts" },
          { value: "library_items", label: "Library items" },
        ],
      },
    ],
    label_formula: (f) => {
      const types: Record<string, string> = {
        articles: "articles",
        member_posts: "member posts",
        library_items: "library items",
      };
      return `Curate ${types[f.content_type] ?? "content"}`;
    },
  },
];

function buildSuggestedContext(verbConfig: VerbConfig, fields: Record<string, string>): Record<string, string> {
  const ctx: Record<string, string> = {};
  for (const field of verbConfig.context_fields) {
    const val = fields[field.key];
    if (val) ctx[field.key] = val;
  }
  return ctx;
}

function defaultFieldValues(verbConfig: VerbConfig): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const field of verbConfig.context_fields) {
    if (field.type === "select" && field.options && field.options.length > 0) {
      defaults[field.key] = field.options[0].value;
    } else {
      defaults[field.key] = "";
    }
  }
  return defaults;
}

interface VerbPickerProps {
  verbId: string;
  fieldValues: Record<string, string>;
  suggestedLabel: string;
  onVerbChange: (verbId: string, newFieldValues: Record<string, string>, newLabel: string) => void;
  onFieldChange: (key: string, value: string) => void;
  onLabelChange: (label: string) => void;
}

function VerbPicker({
  verbId,
  fieldValues,
  suggestedLabel,
  onVerbChange,
  onFieldChange,
  onLabelChange,
}: VerbPickerProps) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const sectionBg = useColorModeValue("gray.50", "gray.750");
  const sectionBorder = useColorModeValue("gray.100", "gray.700");

  const selectedVerb = GUIDED_VERBS.find((v) => v.verb_id === verbId) ?? null;

  const handleVerbSelect = (newVerbId: string) => {
    if (!newVerbId) {
      onVerbChange("", {}, "");
      return;
    }
    const config = GUIDED_VERBS.find((v) => v.verb_id === newVerbId);
    if (!config) return;
    const newFields = defaultFieldValues(config);
    const newLabel = config.label_formula(newFields);
    onVerbChange(newVerbId, newFields, newLabel);
  };

  const handleFieldChange = (key: string, value: string) => {
    onFieldChange(key, value);
    if (selectedVerb) {
      const updatedFields = { ...fieldValues, [key]: value };
      onLabelChange(selectedVerb.label_formula(updatedFields));
    }
  };

  return (
    <VStack gap={3} align="stretch">
      <Box>
        <Text fontSize="xs" color={mutedColor} mb={1}>Suggested action (optional)</Text>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            value={verbId}
            onChange={(e) => handleVerbSelect(e.currentTarget.value)}
          >
            <option value="">— None —</option>
            {GUIDED_VERBS.map((v) => (
              <option key={v.verb_id} value={v.verb_id}>{v.label}</option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
        {selectedVerb && (
          <Text fontSize="xs" color={mutedColor} mt={1}>{selectedVerb.description}</Text>
        )}
      </Box>

      {selectedVerb && (
        <Box
          bg={sectionBg}
          border="1px solid"
          borderColor={sectionBorder}
          borderRadius="md"
          p={3}
        >
          <VStack gap={2} align="stretch">
            {selectedVerb.context_fields.map((field) => (
              <Box key={field.key}>
                <Text fontSize="xs" color={mutedColor} mb={1}>{field.label}</Text>
                {field.type === "select" ? (
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      value={fieldValues[field.key] ?? ""}
                      onChange={(e) => handleFieldChange(field.key, e.currentTarget.value)}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                ) : (
                  <Input
                    size="sm"
                    placeholder={field.placeholder}
                    value={fieldValues[field.key] ?? ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  />
                )}
              </Box>
            ))}
            <Box>
              <Text fontSize="xs" color={mutedColor} mb={1}>Action label</Text>
              <Input
                size="sm"
                value={suggestedLabel}
                onChange={(e) => onLabelChange(e.target.value)}
                placeholder="Label shown on the digest item"
              />
            </Box>
          </VStack>
        </Box>
      )}
    </VStack>
  );
}

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
  const [verbId, setVerbId] = useState("");
  const [verbFields, setVerbFields] = useState<Record<string, string>>({});
  const [suggestedLabel, setSuggestedLabel] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setRecurrenceRule("weekly");
    setNextDueAt("");
    setVerbId("");
    setVerbFields({});
    setSuggestedLabel("");
    setShowForm(false);
  };

  const handleVerbChange = (newVerbId: string, newFields: Record<string, string>, newLabel: string) => {
    setVerbId(newVerbId);
    setVerbFields(newFields);
    setSuggestedLabel(newLabel);
  };

  const handleFieldChange = (key: string, value: string) => {
    setVerbFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = () => {
    if (!title.trim() || !nextDueAt) return;
    const verbConfig = GUIDED_VERBS.find((v) => v.verb_id === verbId);
    create(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        recurrence_rule: recurrenceRule,
        next_due_at: new Date(nextDueAt).toISOString(),
        suggested_verb: verbId || undefined,
        suggested_label: suggestedLabel.trim() || undefined,
        suggested_context: verbConfig ? buildSuggestedContext(verbConfig, verbFields) : undefined,
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
            <VerbPicker
              verbId={verbId}
              fieldValues={verbFields}
              suggestedLabel={suggestedLabel}
              onVerbChange={handleVerbChange}
              onFieldChange={handleFieldChange}
              onLabelChange={setSuggestedLabel}
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
                <HStack gap={2}>
                  <Text fontSize="xs" color={mutedColor} textTransform="capitalize">{item.recurrence_rule}</Text>
                  {item.suggested_label && (
                    <Text fontSize="xs" color={mutedColor}>· {item.suggested_label}</Text>
                  )}
                </HStack>
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
