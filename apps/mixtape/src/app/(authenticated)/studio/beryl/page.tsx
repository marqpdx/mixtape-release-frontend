"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useBerylSession, useUpdateBerylScrap, useBerylDismiss } from "@mixtape/api/hooks/studio";
import { INTENT_TAGS } from "@mixtape/api/clients/studio/studioApi";
import type { ScrapItem } from "@mixtape/api/clients/studio/studioApi";

// ---------------------------------------------------------------------------
// ScrapCard
// ---------------------------------------------------------------------------

function ScrapCard({
  scrap,
  onActed,
}: {
  scrap: ScrapItem;
  onActed: (id: string) => void;
}) {
  const [retagging, setRetagging] = useState(false);
  const [addingReminder, setAddingReminder] = useState(false);
  const [reminderValue, setReminderValue] = useState("");
  const { mutate: update, isPending } = useUpdateBerylScrap();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const isArchived = scrap.status === "archived";

  const handleRetag = (tag: string) => {
    update(
      { id: scrap.id, input: { intent_tag: tag as ScrapItem["intent_tag"] } },
      {
        onSuccess: () => {
          setRetagging(false);
          onActed(scrap.id);
        },
      },
    );
  };

  const handleArchive = () => {
    update(
      { id: scrap.id, input: { status: "archived" } },
      { onSuccess: () => onActed(scrap.id) },
    );
  };

  const handleSetReminder = () => {
    if (!reminderValue) return;
    update(
      { id: scrap.id, input: { remind_at: new Date(reminderValue).toISOString() } },
      {
        onSuccess: () => {
          setAddingReminder(false);
          setReminderValue("");
          onActed(scrap.id);
        },
      },
    );
  };

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={5}
      opacity={isArchived ? 0.5 : 1}
      transition="opacity 0.15s"
    >
      <Text mb={3} color={isArchived ? mutedColor : undefined} whiteSpace="pre-wrap">
        {scrap.body}
      </Text>

      <HStack gap={2} flexWrap="wrap" mb={3}>
        {retagging ? (
          <NativeSelect.Root size="xs" w="auto" minW="120px" disabled={isPending}>
            <NativeSelect.Field
              value={scrap.intent_tag}
              onChange={(e) => handleRetag(e.currentTarget.value)}
              onBlur={() => setRetagging(false)}
              autoFocus
            >
              {INTENT_TAGS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        ) : (
          <Badge
            variant="outline"
            cursor={isArchived ? "default" : "pointer"}
            onClick={() => !isArchived && setRetagging(true)}
            title={isArchived ? undefined : "Click to re-tag"}
          >
            {scrap.intent_tag}
          </Badge>
        )}
        {scrap.labels.map((l) => (
          <Badge key={l} variant="subtle">{l}</Badge>
        ))}
        {scrap.remind_at && (
          <Badge variant="subtle" colorPalette="blue">
            reminder: {new Date(scrap.remind_at).toLocaleDateString()}
          </Badge>
        )}
      </HStack>

      {addingReminder && (
        <HStack mb={3} gap={2}>
          <Input
            size="xs"
            type="datetime-local"
            value={reminderValue}
            onChange={(e) => setReminderValue(e.target.value)}
            flex={1}
          />
          <Button
            size="xs"
            onClick={handleSetReminder}
            disabled={!reminderValue || isPending}
            loading={isPending}
          >
            Set
          </Button>
          <Button size="xs" variant="ghost" onClick={() => setAddingReminder(false)}>
            Cancel
          </Button>
        </HStack>
      )}

      {!isArchived && (
        <HStack gap={3} justify="flex-end">
          {!addingReminder && (
            <Button
              size="xs"
              variant="ghost"
              color={mutedColor}
              onClick={() => setAddingReminder(true)}
              disabled={isPending}
            >
              Remind me
            </Button>
          )}
          <Button
            size="xs"
            variant="ghost"
            color={mutedColor}
            onClick={handleArchive}
            disabled={isPending}
            loading={isPending}
          >
            Archive
          </Button>
        </HStack>
      )}

      {scrap.created_at && (
        <Text fontSize="xs" color={mutedColor} mt={2}>
          {new Date(scrap.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// BerylPage
// ---------------------------------------------------------------------------

export default function BerylPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ctx = searchParams.get("ctx") ?? "";

  const { data, isLoading, error } = useBerylSession(ctx);
  const { mutate: dismiss, isPending: dismissing } = useBerylDismiss();

  const [actedOnIds, setActedOnIds] = useState<Set<string>>(new Set());

  const handleActed = useCallback((id: string) => {
    setActedOnIds((prev) => new Set([...prev, id]));
  }, []);

  const handleDone = () => {
    const mode = actedOnIds.size > 0 ? "permanent" : "session";
    dismiss(mode, { onSettled: () => router.push("/app/studio") });
  };

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="2xl" py={8}>
        <HStack justify="space-between" mb={6} align="start">
          <Box>
            <Heading size="lg" mb={1}>Beryl</Heading>
            <Text fontSize="sm" color={mutedColor}>
              {data && data.scraps.length > 0
                ? `${data.scraps.length} capture${data.scraps.length === 1 ? "" : "s"} waiting`
                : "Review your waiting captures"}
            </Text>
          </Box>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDone}
            disabled={dismissing}
            loading={dismissing}
          >
            {actedOnIds.size > 0 ? "Done" : "Nothing to act on"}
          </Button>
        </HStack>

        {isLoading && (
          <VStack gap={4} align="stretch">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="120px" borderRadius="lg" />
            ))}
          </VStack>
        )}

        {error && (
          <Text color="red.400" fontSize="sm">
            Couldn't load your captures right now.
          </Text>
        )}

        {data && data.scraps.length === 0 && (
          <Text color={mutedColor} fontSize="sm">Nothing waiting.</Text>
        )}

        {data && data.scraps.length > 0 && (
          <VStack gap={4} align="stretch">
            {data.scraps.map((scrap) => (
              <ScrapCard key={scrap.id} scrap={scrap} onActed={handleActed} />
            ))}
          </VStack>
        )}
      </Container>
    </Box>
  );
}
