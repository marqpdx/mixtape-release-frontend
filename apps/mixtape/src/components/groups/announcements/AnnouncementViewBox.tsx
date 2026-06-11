// groups/announcements/AnnouncementViewBox.tsx
// Member-facing announcement queue. Drop this into any group surface.
// Fetches visible-queue (active, not expired, snooze/dismiss respected).
"use client";

import { Box, Button, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import {
  fetchVisibleQueue,
  dismissAnnouncement,
  GroupAnnouncement,
  AnnouncementPriority,
} from "@mixtape/api/clients/group/announcementApi";

// Left-bar accent per priority level
const PRIORITY_ACCENT: Record<AnnouncementPriority, string> = {
  critical: "#c0392b",
  high:     "#e67e22",
  normal:   "#27ae60",
};

interface Props {
  groupSlug: string;
}

export function AnnouncementViewBox({ groupSlug }: Props) {
  const [items, setItems] = useState<GroupAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  // Track which item has an open dismiss prompt
  const [dismissing, setDismissing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchVisibleQueue(groupSlug);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [groupSlug]);

  useEffect(() => { load(); }, [load]);

  const handleDismissChoice = async (
    id: string,
    choice: "snooze" | "permanent"
  ) => {
    if (choice === "snooze") {
      // Just dismiss via API — server handles 24hr snooze logic
      await dismissAnnouncement(groupSlug, id);
    } else {
      // Second dismiss = permanent
      await dismissAnnouncement(groupSlug, id);
    }
    setDismissing(null);
    await load();
  };

  if (loading) return <Spinner size="sm" />;
  if (items.length === 0) return null;

  return (
    <VStack align="stretch" gap={3} mb={4}>
      {items.map((item) => (
        <Box
          key={item.id}
          bg="theme.surface"
          border="1px solid"
          borderColor="theme.border"
          borderLeft="4px solid"
          borderLeftColor={PRIORITY_ACCENT[item.priority]}
          borderRadius="12px"
          p={4}
          position="relative"
        >
          {/* Dismiss X */}
          <Box
            as="button"
            position="absolute"
            top="10px"
            right="12px"
            fontSize="14px"
            color="orange.400"
            lineHeight="1"
            fontWeight="700"
            cursor="pointer"
            _hover={{ color: "orange.600" }}
            onClick={() =>
              setDismissing(dismissing === item.id ? null : item.id)
            }
            aria-label="Dismiss announcement"
          >
            ✕
          </Box>

          <VStack align="stretch" gap={1} pr={6}>
            <Text fontWeight="600" fontSize="sm" color="theme.text">
              {item.title}
            </Text>
            <Text fontSize="sm" color="theme.textSecondary">
              {item.content}
            </Text>
            {item.cta_text && item.cta_url && (
              <Box mt={1}>
                <a
                  href={item.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "9999px",
                    border: "1px solid var(--chakra-colors-theme-accent, #6c63ff)",
                    color: "var(--chakra-colors-theme-accent, #6c63ff)",
                    padding: "3px 12px",
                    textDecoration: "none",
                  }}
                >
                  {item.cta_text}
                </a>
              </Box>
            )}
          </VStack>

          {/* Dismiss prompt */}
          {dismissing === item.id && (
            <Box
              mt={3}
              pt={3}
              borderTop="1px solid"
              borderColor="theme.border"
            >
              <Text fontSize="xs" color="theme.textMuted" mb={2}>
                How would you like to dismiss this?
              </Text>
              <HStack gap={2}>
                <Button
                  size="xs"
                  variant="outline"
                  borderRadius="9999px"
                  borderColor="theme.border"
                  color="theme.textSecondary"
                  onClick={() => handleDismissChoice(item.id, "snooze")}
                >
                  Remind me later
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  borderRadius="9999px"
                  borderColor="theme.border"
                  color="theme.textMuted"
                  onClick={() => handleDismissChoice(item.id, "permanent")}
                >
                  Don't show again
                </Button>
              </HStack>
            </Box>
          )}
        </Box>
      ))}
    </VStack>
  );
}
