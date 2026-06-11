// groups/announcements/AnnouncementsWorkArea.tsx
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
import { useCallback, useEffect, useState } from "react";
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  GroupAnnouncement,
  AnnouncementPriority,
} from "@mixtape/api/clients/group/announcementApi";

// Priority → left-border color using semantic tokens where possible,
// with literal fallbacks for the status colours the token system doesn't cover.
const PRIORITY_BORDER: Record<AnnouncementPriority, string> = {
  critical: "#c0392b",   // red — draws the eye immediately
  high:     "#e67e22",   // orange — elevated but not emergency
  normal:   "#27ae60",   // green — routine
};

const PRIORITY_LABEL: Record<AnnouncementPriority, string> = {
  critical: "Critical",
  high:     "High",
  normal:   "Normal",
};

interface Props {
  groupSlug: string;
}

export default function AnnouncementsWorkArea({ groupSlug }: Props) {
  const [items, setItems] = useState<GroupAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [expiresAt, setExpiresAt] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [alsoNotify, setAlsoNotify] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAnnouncements(groupSlug);
      setItems(data);
    } catch {
      // ignore — list just stays empty
    } finally {
      setLoading(false);
    }
  }, [groupSlug]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createAnnouncement(groupSlug, {
        title: title.trim(),
        content: content.trim(),
        priority,
        expires_at: expiresAt || null,
        cta_text: ctaText.trim(),
        cta_url: ctaUrl.trim(),
        also_send_notification: alsoNotify,
      });
      setTitle(""); setContent(""); setPriority("normal");
      setExpiresAt(""); setCtaText(""); setCtaUrl(""); setAlsoNotify(false);
      setSuccess("Announcement posted.");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to post announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: GroupAnnouncement) => {
    try {
      await updateAnnouncement(groupSlug, item.id, { is_active: !item.is_active });
      await load();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this announcement?")) return;
    try {
      await deleteAnnouncement(groupSlug, id);
      await load();
    } catch { /* ignore */ }
  };

  return (
    <VStack align="stretch" gap={6}>

      {/* ── Create Form ─────────────────────────────────────── */}
      <Box
        bg="theme.surface"
        border="1px solid"
        borderColor="theme.border"
        borderRadius="16px"
        p={5}
      >
        <Text fontWeight="600" fontSize="sm" color="theme.textMuted" letterSpacing="0.12em" textTransform="uppercase" mb={4}>
          New Announcement
        </Text>

        <Stack gap={3}>
          <Field.Root>
            <Field.Label fontSize="sm" color="theme.text">Title</Field.Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do members need to know?"
              bg="theme.bg"
              borderColor="theme.border"
              _placeholder={{ color: "theme.textFaint" }}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label fontSize="sm" color="theme.text">Content</Field.Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Announcement body…"
              rows={4}
              bg="theme.bg"
              borderColor="theme.border"
              _placeholder={{ color: "theme.textFaint" }}
            />
          </Field.Root>

          <HStack gap={4} wrap="wrap">
            <Field.Root flex="1" minW="140px">
              <Field.Label fontSize="sm" color="theme.text">Priority</Field.Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "10px",
                  border: "1px solid var(--chakra-colors-theme-border, #ddd)",
                  background: "var(--chakra-colors-theme-bg, #fff)",
                  color: "var(--chakra-colors-theme-text, #222)",
                  fontSize: "14px",
                  width: "100%",
                }}
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Field.Root>

            <Field.Root flex="1" minW="180px">
              <Field.Label fontSize="sm" color="theme.text">Expires (optional)</Field.Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                bg="theme.bg"
                borderColor="theme.border"
              />
            </Field.Root>
          </HStack>

          <HStack gap={4} wrap="wrap">
            <Field.Root flex="1" minW="140px">
              <Field.Label fontSize="sm" color="theme.text">CTA Button Text</Field.Label>
              <Input
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g. View Event"
                bg="theme.bg"
                borderColor="theme.border"
                _placeholder={{ color: "theme.textFaint" }}
              />
            </Field.Root>
            <Field.Root flex="2" minW="200px">
              <Field.Label fontSize="sm" color="theme.text">CTA URL</Field.Label>
              <Input
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://…"
                bg="theme.bg"
                borderColor="theme.border"
                _placeholder={{ color: "theme.textFaint" }}
              />
            </Field.Root>
          </HStack>

          <Checkbox.Root
            checked={alsoNotify}
            onCheckedChange={(d) => setAlsoNotify(!!d.checked)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label fontSize="sm" color="theme.textSecondary">
              Also send as notification to all group members
            </Checkbox.Label>
          </Checkbox.Root>

          {error && <Text color="red.500" fontSize="sm">{error}</Text>}
          {success && <Text color="green.500" fontSize="sm">{success}</Text>}

          <Button
            onClick={handleCreate}
            loading={submitting}
            size="sm"
            alignSelf="flex-start"
            bg="theme.accent"
            color="white"
            borderRadius="10px"
            _hover={{ opacity: 0.88 }}
          >
            Post Announcement
          </Button>
        </Stack>
      </Box>

      {/* ── Existing List ────────────────────────────────────── */}
      <Box>
        <Text fontWeight="600" fontSize="sm" color="theme.textMuted" letterSpacing="0.12em" textTransform="uppercase" mb={3}>
          Active Announcements
        </Text>

        {loading ? (
          <Spinner size="sm" />
        ) : items.length === 0 ? (
          <Text color="theme.textMuted" fontSize="sm">No announcements yet.</Text>
        ) : (
          <VStack align="stretch" gap={3}>
            {items.map((item) => (
              <Box
                key={item.id}
                bg="theme.surface"
                border="1px solid"
                borderColor="theme.border"
                borderLeft="4px solid"
                borderLeftColor={PRIORITY_BORDER[item.priority]}
                borderRadius="12px"
                p={4}
                opacity={item.is_active && !item.is_expired ? 1 : 0.55}
              >
                <HStack justify="space-between" align="flex-start" gap={3}>
                  <VStack align="stretch" gap={1} flex="1">
                    <HStack gap={2} wrap="wrap">
                      <Text fontWeight="600" fontSize="sm" color="theme.text">{item.title}</Text>
                      <Badge
                        fontSize="10px"
                        px={2}
                        borderRadius="9999px"
                        style={{
                          background: PRIORITY_BORDER[item.priority],
                          color: "white",
                        }}
                      >
                        {PRIORITY_LABEL[item.priority]}
                      </Badge>
                      {item.is_expired && (
                        <Badge fontSize="10px" colorPalette="gray" borderRadius="9999px">Expired</Badge>
                      )}
                      {!item.is_active && (
                        <Badge fontSize="10px" colorPalette="gray" borderRadius="9999px">Hidden</Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color="theme.textSecondary" lineClamp={2}>{item.content}</Text>
                    {item.expires_at && (
                      <Text fontSize="xs" color="theme.textMuted">
                        Expires {new Date(item.expires_at).toLocaleDateString()}
                      </Text>
                    )}
                  </VStack>

                  <HStack gap={2} flexShrink={0}>
                    <Button
                      size="xs"
                      variant="outline"
                      borderRadius="9999px"
                      borderColor="theme.border"
                      color="theme.textSecondary"
                      onClick={() => handleToggleActive(item)}
                    >
                      {item.is_active ? "Hide" : "Show"}
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      borderRadius="9999px"
                      borderColor="theme.border"
                      color="red.500"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
}
