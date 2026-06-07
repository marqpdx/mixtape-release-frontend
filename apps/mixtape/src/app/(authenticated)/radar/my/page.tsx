"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Input,
  Link,
  Skeleton,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  useRadarInitiatives,
  useCreateRadarInitiative,
  useUpdateRadarInitiative,
  useArchiveRadarInitiative,
} from "@mixtape/api/hooks/radar";
import type { RadarInitiative } from "@mixtape/api/clients/radar/radarApi";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const delta = Date.now() - new Date(iso).getTime();
  const days = Math.floor(delta / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ---------------------------------------------------------------------------
// NewInitiativeForm
// ---------------------------------------------------------------------------

function NewInitiativeForm({ onDone }: { onDone?: () => void }) {
  const [title, setTitle] = useState("");
  const [direction, setDirection] = useState("");
  const { mutate: create, isPending } = useCreateRadarInitiative();

  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bgColor = useColorModeValue("white", "gray.800");

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    create(
      { title: trimmed, direction: direction.trim() || undefined },
      {
        onSuccess: () => {
          setTitle("");
          setDirection("");
          onDone?.();
        },
      },
    );
  };

  return (
    <Box
      className="rmy-new-form"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      bg={bgColor}
      p={4}
    >
      <Text fontWeight="semibold" mb={3} fontSize="sm">
        New initiative
      </Text>
      <VStack gap={2} align="stretch">
        <Input
          placeholder="Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="sm"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
        <Textarea
          placeholder="Direction (optional) — one sentence about where this is headed"
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          size="sm"
          rows={2}
          resize="none"
        />
        <HStack gap={2} justify="flex-end">
          {onDone && (
            <Button size="xs" variant="ghost" onClick={onDone} disabled={isPending}>
              Cancel
            </Button>
          )}
          <Button
            size="xs"
            onClick={handleSubmit}
            disabled={!title.trim() || isPending}
            loading={isPending}
          >
            Add
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// InitiativeRow
// ---------------------------------------------------------------------------

function InitiativeRow({
  initiative,
  onArchive,
}: {
  initiative: RadarInitiative;
  onArchive: (id: string) => void;
}) {
  const router = useRouter();
  const { mutate: update } = useUpdateRadarInitiative(initiative.id);

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgColor = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("gray.50", "gray.750");

  const isActive = initiative.status === "active";

  const handleToggleStatus = () => {
    update({ status: isActive ? "paused" : "active" });
  };

  const handleOpen = () => {
    router.push(`/radar/${initiative.id}`);
  };

  return (
    <Box
      className="rmy-initiative-row"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      bg={bgColor}
      px={4}
      py={3}
      cursor="pointer"
      _hover={{ bg: hoverBg }}
      onClick={handleOpen}
    >
      <HStack justify="space-between" align="start" gap={3}>
        <Box flex={1} minW={0}>
          <HStack gap={2} mb={0.5}>
            <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
              {initiative.title}
            </Text>
            <Badge
              size="sm"
              colorPalette={isActive ? "green" : "gray"}
              variant="subtle"
              flexShrink={0}
            >
              {initiative.status}
            </Badge>
          </HStack>
          {initiative.direction && (
            <Text fontSize="xs" color={mutedColor} lineClamp={2}>
              {initiative.direction}
            </Text>
          )}
          {initiative.member_last_active_at && (
            <Text fontSize="xs" color={mutedColor} mt={1}>
              {relativeTime(initiative.member_last_active_at)}
            </Text>
          )}
        </Box>

        <HStack gap={1} flexShrink={0} onClick={(e) => e.stopPropagation()}>
          <Button
            size="xs"
            variant="ghost"
            color={mutedColor}
            onClick={handleToggleStatus}
          >
            {isActive ? "Pause" : "Activate"}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            color={mutedColor}
            onClick={() => onArchive(initiative.id)}
          >
            Archive
          </Button>
        </HStack>
      </HStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// RadarMyPage
// ---------------------------------------------------------------------------

export default function RadarMyPage() {
  const { data, isLoading, error } = useRadarInitiatives();
  const { mutate: archive } = useArchiveRadarInitiative();
  const [showNewForm, setShowNewForm] = useState(false);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const headingMuted = useColorModeValue("gray.600", "gray.400");

  const active = data?.filter((i) => i.status === "active") ?? [];
  const paused = data?.filter((i) => i.status === "paused") ?? [];
  const noActive = active.length === 0;
  const hasPausedOnly = noActive && paused.length > 0;

  return (
    <Box className="rmy-root" bg={bgColor} minH="100vh">
      <Container maxW="2xl" py={8}>

        <HStack className="rmy-header" justify="space-between" mb={6} align="center">
          <Box>
            <Heading size="lg" mb={1}>Radar</Heading>
            <Text fontSize="sm" color={mutedColor}>Your active threads</Text>
          </Box>
          <HStack gap={2}>
            <Link href="/radar/my/archive" fontSize="sm" color={mutedColor}>
              Archive
            </Link>
            {!showNewForm && (
              <Button size="sm" variant="outline" onClick={() => setShowNewForm(true)}>
                New initiative
              </Button>
            )}
          </HStack>
        </HStack>

        {isLoading && (
          <VStack gap={3} align="stretch">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="72px" borderRadius="lg" />
            ))}
          </VStack>
        )}

        {error && (
          <Text color="red.400" fontSize="sm">
            Couldn't load your radar right now.
          </Text>
        )}

        {!isLoading && !error && (
          <VStack className="rmy-content" gap={6} align="stretch">

            {/* New initiative form — inline at top when no active initiatives */}
            {(showNewForm || (noActive && !hasPausedOnly)) && (
              <NewInitiativeForm onDone={() => setShowNewForm(false)} />
            )}

            {/* Active section */}
            {(active.length > 0 || hasPausedOnly) && (
              <Box className="rmy-active-section">
                {hasPausedOnly ? (
                  <Text fontSize="sm" color={mutedColor} mb={3}>
                    Nothing active right now.{" "}
                    <Button
                      size="xs"
                      variant="ghost"
                      p={0}
                      h="auto"
                      onClick={() => setShowNewForm(true)}
                    >
                      Start something?
                    </Button>
                  </Text>
                ) : (
                  <VStack gap={2} align="stretch">
                    {active.map((initiative) => (
                      <InitiativeRow
                        key={initiative.id}
                        initiative={initiative}
                        onArchive={archive}
                      />
                    ))}
                  </VStack>
                )}
              </Box>
            )}

            {/* Paused section */}
            {paused.length > 0 && (
              <Box className="rmy-paused-section">
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color={headingMuted}
                  textTransform="uppercase"
                  letterSpacing="wide"
                  mb={2}
                >
                  Paused
                </Text>
                <VStack gap={2} align="stretch">
                  {paused.map((initiative) => (
                    <InitiativeRow
                      key={initiative.id}
                      initiative={initiative}
                      onArchive={archive}
                    />
                  ))}
                </VStack>
              </Box>
            )}

            {/* Empty state — no initiatives at all */}
            {!showNewForm && data && data.length === 0 && (
              <Box textAlign="center" py={12}>
                <Text color={mutedColor} mb={4}>No initiatives yet.</Text>
                <Button onClick={() => setShowNewForm(true)}>
                  Start your first initiative
                </Button>
              </Box>
            )}

          </VStack>
        )}

      </Container>
    </Box>
  );
}
