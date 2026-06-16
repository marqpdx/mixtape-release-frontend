"use client";

// groups/drops/DropTray.tsx
// Fixed upper-right group workspace affordance. Pinned → standard → social ordering.
// DR-4 (tray display) + DR-5 (creation flow).

import { useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { IconPin, IconPlus, IconX } from "@tabler/icons-react";
import { useGroupDrops, useCreateGroupDrop, useArchiveGroupDrop } from "@mixtape/api/hooks/drops/useDrops";
import { toaster } from "@mixtape/core/lib/toaster";
import { canUserModerateGroup } from "@mixtape/core/types/groupTypes";
import type { Drop, DropWeight } from "@mixtape/core/types/dropTypes";
import type { Group } from "@mixtape/core/types/groupTypes";

const WEIGHT_COLORS: Record<DropWeight, string> = {
  pinned: "blue.500",
  standard: "gray.700",
  social: "gray.400",
};

const WEIGHT_BG: Record<DropWeight, string> = {
  pinned: "blue.50",
  standard: "gray.50",
  social: "gray.50",
};

interface DropPillProps {
  drop: Drop;
  onArchive: (id: string) => void;
  canAdmin: boolean;
}

function DropPill({ drop, onArchive, canAdmin }: DropPillProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      bg={WEIGHT_BG[drop.weight]}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      px={3}
      py={2}
      position="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Flex align="center" gap={2} mb={1}>
        {drop.weight === "pinned" && (
          <Box color="blue.500" flexShrink={0}>
            <IconPin size={12} />
          </Box>
        )}
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color={WEIGHT_COLORS[drop.weight]}
          lineClamp={1}
        >
          @{drop.handle}
        </Text>
        {hovered && canAdmin && (
          <IconButton
            aria-label="Archive drop"
            size="2xs"
            variant="ghost"
            colorPalette="red"
            ml="auto"
            onClick={() => onArchive(drop.id)}
          >
            <IconX size={10} />
          </IconButton>
        )}
      </Flex>
      <Text fontSize="xs" color="gray.600" lineClamp={3}>
        {drop.content}
      </Text>
      {drop.event_date && (
        <Text fontSize="2xs" color="gray.400" mt={1}>
          {drop.event_date}
        </Text>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Creation form — inline in tray
// ---------------------------------------------------------------------------

interface DropCreationFormProps {
  groupSlug: string;
  canAdmin: boolean;
  onClose: () => void;
}

function DropCreationForm({ groupSlug, canAdmin, onClose }: DropCreationFormProps) {
  const [content, setContent] = useState("");
  const [handle, setHandle] = useState("");
  const [weight, setWeight] = useState<DropWeight>("social");
  const [eventDate, setEventDate] = useState("");
  const [showAnchor, setShowAnchor] = useState(false);
  const contentRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateGroupDrop(groupSlug);

  const handleContentChange = (val: string) => {
    setContent(val);
    // Auto-derive handle from first @word if none set
    if (!handle) {
      const match = val.match(/@([\w-]+)/);
      if (match) setHandle(match[1]);
    }
    // Show temporal anchor prompt once they've typed a bit
    if (val.length > 20 && !showAnchor) setShowAnchor(true);
  };

  const handleSubmit = async () => {
    if (!content.trim() || !handle.trim()) return;

    try {
      await createMutation.mutateAsync({
        content: content.trim(),
        handle: handle.trim(),
        weight,
        event_date: eventDate || null,
      });
      toaster.success({ title: `Drop @${handle} created` });
      onClose();
    } catch {
      toaster.error({ title: "Could not create drop" });
    }
  };

  return (
    <VStack align="stretch" gap={2} p={3}>
      <Flex align="center" justify="space-between">
        <Text fontSize="xs" fontWeight="semibold" color="gray.700">
          New Drop
        </Text>
        <IconButton
          aria-label="Cancel"
          size="2xs"
          variant="ghost"
          onClick={onClose}
        >
          <IconX size={12} />
        </IconButton>
      </Flex>

      <Input
        ref={contentRef}
        placeholder="What does your group need to know right now?"
        size="sm"
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        autoFocus
      />

      <Flex gap={2}>
        <Input
          placeholder="@handle"
          size="sm"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          flex="1"
        />
        {canAdmin && (
          <select
            value={weight}
            onChange={(e) => setWeight(e.target.value as DropWeight)}
            style={{
              fontSize: "12px",
              border: "1px solid #E2E8F0",
              borderRadius: "6px",
              padding: "0 6px",
              background: "white",
              color: "#4A5568",
            }}
          >
            <option value="social">Social</option>
            <option value="standard">Info</option>
            <option value="pinned">Pinned</option>
          </select>
        )}
      </Flex>

      {showAnchor && (
        <Input
          placeholder="Any date this relates to? (optional)"
          size="sm"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
      )}

      <Button
        size="sm"
        onClick={handleSubmit}
        loading={createMutation.isPending}
        disabled={!content.trim() || !handle.trim()}
      >
        Drop it
      </Button>
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// DropTray
// ---------------------------------------------------------------------------

interface DropTrayProps {
  group: Group;
}

export function DropTray({ group }: DropTrayProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data: drops = [], isLoading } = useGroupDrops(group.slug);
  const archiveMutation = useArchiveGroupDrop(group.slug);
  const canAdmin = canUserModerateGroup(group);

  const handleArchive = async (dropId: string) => {
    try {
      await archiveMutation.mutateAsync(dropId);
      toaster.success({ title: "Drop archived" });
    } catch {
      toaster.error({ title: "Could not archive drop" });
    }
  };

  return (
    <Box
      position="fixed"
      top="80px"
      right="16px"
      zIndex={100}
    >
      {/* Tray panel */}
      {open && (
        <Box
          position="absolute"
          top="0"
          right="44px"
          w="280px"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          boxShadow="md"
          overflow="hidden"
        >
          {creating ? (
            <DropCreationForm
              groupSlug={group.slug}
              canAdmin={canAdmin}
              onClose={() => setCreating(false)}
            />
          ) : (
            <Box>
              <Flex
                align="center"
                justify="space-between"
                px={3}
                py={2}
                borderBottom="1px solid"
                borderColor="gray.100"
              >
                <Text fontSize="xs" fontWeight="semibold" color="gray.600">
                  Drops
                </Text>
                <IconButton
                  aria-label="Add drop"
                  size="2xs"
                  variant="ghost"
                  onClick={() => setCreating(true)}
                >
                  <IconPlus size={14} />
                </IconButton>
              </Flex>

              <VStack align="stretch" gap={2} p={2} maxH="400px" overflowY="auto">
                {isLoading && (
                  <Flex justify="center" py={4}>
                    <Spinner size="sm" />
                  </Flex>
                )}
                {!isLoading && drops.length === 0 && (
                  <Text fontSize="xs" color="gray.400" textAlign="center" py={3}>
                    No active drops.{" "}
                    <Box
                      as="button"
                      color="blue.500"
                      onClick={() => setCreating(true)}
                      _hover={{ textDecoration: "underline" }}
                    >
                      Drop something
                    </Box>
                    .
                  </Text>
                )}
                {drops.map((drop) => (
                  <DropPill
                    key={drop.id}
                    drop={drop}
                    onArchive={handleArchive}
                    canAdmin={canAdmin}
                  />
                ))}
              </VStack>
            </Box>
          )}
        </Box>
      )}

      {/* Toggle button */}
      <IconButton
        aria-label={open ? "Close drops" : "Open drops"}
        borderRadius="full"
        boxShadow="md"
        bg={open ? "gray.800" : "white"}
        color={open ? "white" : "gray.700"}
        border="1px solid"
        borderColor={open ? "gray.800" : "gray.200"}
        size="sm"
        onClick={() => {
          setOpen((v) => !v);
          if (open) setCreating(false);
        }}
      >
        {drops.length > 0 && !open ? (
          <Flex align="center" gap={1} px={1}>
            <Text fontSize="2xs" fontWeight="bold">{drops.length}</Text>
          </Flex>
        ) : (
          <IconPin size={16} />
        )}
      </IconButton>
    </Box>
  );
}
