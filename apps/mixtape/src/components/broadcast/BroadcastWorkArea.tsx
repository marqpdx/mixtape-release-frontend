// src/components/broadcast/BroadcastWorkArea.tsx
"use client";

import {
  Badge,
  Box,
  Button,
  Checkbox,
  Field,
  HStack,
  Input,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useState, useEffect, useCallback } from "react";

type BroadcastStatus = "draft" | "queued" | "sent" | "cancelled";
type BroadcastPriority = "normal" | "important" | "urgent";

interface Broadcast {
  id: string;
  title: string;
  body: string;
  priority: BroadcastPriority;
  status: BroadcastStatus;
  channels: string[];
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

interface BroadcastWorkAreaProps {
  groupSlug: string;
}

const PRIORITY_COLOR: Record<BroadcastPriority, string> = {
  normal: "gray",
  important: "yellow",
  urgent: "red",
};

const STATUS_COLOR: Record<BroadcastStatus, string> = {
  draft: "gray",
  queued: "blue",
  sent: "green",
  cancelled: "red",
};

export default function BroadcastWorkArea({ groupSlug }: BroadcastWorkAreaProps) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<BroadcastPriority>("normal");
  const [channels, setChannels] = useState<string[]>(["in_app"]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/broadcast/groups/${groupSlug}/broadcasts/`);
      setBroadcasts(res.data.results ?? res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [groupSlug]);

  useEffect(() => { load(); }, [load]);

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required.");
      return;
    }
    if (channels.length === 0) {
      setError("Select at least one channel.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        body: body.trim(),
        priority,
        channels,
        audience: { scope_type: "all_members" },
      };
      if (scheduledAt) payload.scheduled_at = scheduledAt;

      const res = await axiosInstance.post(
        `/api/broadcast/groups/${groupSlug}/broadcasts/`,
        payload
      );
      const newBroadcast: Broadcast = res.data.broadcast ?? res.data;

      // If no scheduled time, send immediately
      if (!scheduledAt) {
        await axiosInstance.post(
          `/api/broadcast/groups/${groupSlug}/broadcasts/${newBroadcast.id}/send/`
        );
        setSuccess(`Broadcast "${newBroadcast.title}" sent.`);
      } else {
        setSuccess(`Broadcast "${newBroadcast.title}" scheduled.`);
      }

      setTitle("");
      setBody("");
      setPriority("normal");
      setChannels(["in_app"]);
      setScheduledAt("");
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to create broadcast.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (broadcast: Broadcast) => {
    try {
      await axiosInstance.post(
        `/api/broadcast/groups/${groupSlug}/broadcasts/${broadcast.id}/send/`
      );
      load();
    } catch {
      // ignore
    }
  };

  return (
    <VStack align="stretch" gap={6}>
      {/* Composer */}
      <Box border="1px solid" borderColor="border.default" borderRadius="md" p={5}>
        <Text fontWeight="bold" fontSize="md" mb={4}>
          New Broadcast
        </Text>

        <Stack gap={4}>
          <Field.Root>
            <Field.Label>Title</Field.Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              maxLength={200}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Body</Field.Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Your message to group members..."
              rows={4}
            />
          </Field.Root>

          <HStack gap={6} flexWrap="wrap">
            <Field.Root>
              <Field.Label>Priority</Field.Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as BroadcastPriority)}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc" }}
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field.Root>

            <Field.Root>
              <Field.Label>Schedule (optional)</Field.Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                maxW="240px"
              />
            </Field.Root>
          </HStack>

          <Field.Root>
            <Field.Label>Channels</Field.Label>
            <HStack gap={4}>
              <Checkbox.Root
                checked={channels.includes("in_app")}
                onCheckedChange={() => toggleChannel("in_app")}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>In-app</Checkbox.Label>
              </Checkbox.Root>
              <Checkbox.Root
                checked={channels.includes("email")}
                onCheckedChange={() => toggleChannel("email")}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>Email</Checkbox.Label>
              </Checkbox.Root>
            </HStack>
          </Field.Root>

          {error && <Text color="red.500" fontSize="sm">{error}</Text>}
          {success && <Text color="green.600" fontSize="sm">{success}</Text>}

          <Button
            colorPalette="blue"
            onClick={handleCreate}
            loading={submitting}
            alignSelf="flex-start"
          >
            {scheduledAt ? "Schedule" : "Send Now"}
          </Button>
        </Stack>
      </Box>

      {/* Broadcast history */}
      <Box>
        <Text fontWeight="bold" fontSize="md" mb={3}>
          Broadcast History
        </Text>

        {loading ? (
          <Spinner size="sm" />
        ) : broadcasts.length === 0 ? (
          <Text color="fg.muted" fontSize="sm">No broadcasts yet.</Text>
        ) : (
          <VStack align="stretch" gap={3}>
            {broadcasts.map((b) => (
              <Box
                key={b.id}
                border="1px solid"
                borderColor="border.default"
                borderRadius="md"
                p={4}
              >
                <HStack justify="space-between" mb={1}>
                  <Text fontWeight="semibold">{b.title}</Text>
                  <HStack gap={2}>
                    <Badge colorPalette={PRIORITY_COLOR[b.priority]}>{b.priority}</Badge>
                    <Badge colorPalette={STATUS_COLOR[b.status]}>{b.status}</Badge>
                  </HStack>
                </HStack>
                <Text fontSize="sm" color="fg.muted" lineClamp={2}>{b.body}</Text>
                <HStack mt={2} gap={4}>
                  <Text fontSize="xs" color="fg.subtle">
                    {b.sent_at
                      ? `Sent ${new Date(b.sent_at).toLocaleString()}`
                      : b.scheduled_at
                      ? `Scheduled ${new Date(b.scheduled_at).toLocaleString()}`
                      : `Created ${new Date(b.created_at).toLocaleString()}`}
                  </Text>
                  {b.status === "draft" && (
                    <Button size="xs" colorPalette="green" onClick={() => handleSend(b)}>
                      Send
                    </Button>
                  )}
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
}
