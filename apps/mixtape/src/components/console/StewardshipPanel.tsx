"use client";

import {
  Accordion,
  Badge,
  HStack,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { useColorModeValue } from "@components/ui/color-mode";
import { useStewardship } from "@hooks/console/useConsole";

export function StewardshipPanel() {
  const { data, isLoading } = useStewardship();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.750");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  if (isLoading) {
    return <Skeleton h="48px" borderRadius="md" />;
  }

  const staleDrafts = data?.stale_drafts ?? [];
  const overdueReminders = data?.overdue_reminders ?? [];
  const unresolvedQuestions = data?.unresolved_questions ?? [];

  const totalCount =
    staleDrafts.length + overdueReminders.length + unresolvedQuestions.length;

  return (
    <Accordion.Root collapsible defaultValue={[]}>
      <Accordion.Item value="stewardship">
        <Accordion.ItemTrigger>
          <HStack flex={1} gap={2}>
            <Text fontSize="sm" fontWeight="semibold">
              Stewardship
            </Text>
            {totalCount > 0 && (
              <Badge size="sm" colorPalette="orange" variant="subtle">
                {totalCount}
              </Badge>
            )}
          </HStack>
          <Accordion.ItemIndicator />
        </Accordion.ItemTrigger>

        <Accordion.ItemContent>
          {totalCount === 0 ? (
            <Text fontSize="sm" color={mutedColor} pt={2}>
              All clear — no stale drafts, overdue reminders, or unresolved questions.
            </Text>
          ) : (
            <VStack gap={4} align="stretch" pt={2}>
              {staleDrafts.length > 0 && (
                <VStack align="stretch" gap={1}>
                  <HStack gap={2}>
                    <Text fontSize="xs" fontWeight="semibold" color={mutedColor} textTransform="uppercase" letterSpacing="wide">
                      Stale Drafts
                    </Text>
                    <Badge size="sm" variant="subtle">{staleDrafts.length}</Badge>
                  </HStack>
                  {staleDrafts.map((draft) => (
                    <Link key={draft.id} href={`/writing/${draft.slug}/atelier`}>
                      <HStack
                        bg={cardBg}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="md"
                        px={3}
                        py={2}
                        _hover={{ bg: hoverBg }}
                        cursor="pointer"
                        justify="space-between"
                      >
                        <Text fontSize="sm" flex={1} noOfLines={1}>
                          {draft.title || "(untitled)"}
                        </Text>
                        <Text fontSize="xs" color={mutedColor}>
                          {draft.days_stale}d stale
                        </Text>
                      </HStack>
                    </Link>
                  ))}
                </VStack>
              )}

              {overdueReminders.length > 0 && (
                <VStack align="stretch" gap={1}>
                  <HStack gap={2}>
                    <Text fontSize="xs" fontWeight="semibold" color={mutedColor} textTransform="uppercase" letterSpacing="wide">
                      Overdue Reminders
                    </Text>
                    <Badge size="sm" colorPalette="red" variant="subtle">{overdueReminders.length}</Badge>
                  </HStack>
                  {overdueReminders.map((reminder) => (
                    <HStack
                      key={reminder.id}
                      bg={cardBg}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="md"
                      px={3}
                      py={2}
                      justify="space-between"
                    >
                      <Text fontSize="sm" flex={1} noOfLines={1}>
                        {reminder.title || reminder.body || "(reminder)"}
                      </Text>
                      <Text fontSize="xs" color="red.400">
                        {reminder.days_overdue}d overdue
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              )}

              {unresolvedQuestions.length > 0 && (
                <VStack align="stretch" gap={1}>
                  <HStack gap={2}>
                    <Text fontSize="xs" fontWeight="semibold" color={mutedColor} textTransform="uppercase" letterSpacing="wide">
                      Unresolved /? Questions
                    </Text>
                    <Badge size="sm" variant="subtle">{unresolvedQuestions.length}</Badge>
                  </HStack>
                  {unresolvedQuestions.map((q) => (
                    <Link key={q.id} href={`/writing/${q.piece_slug}`}>
                      <HStack
                        bg={cardBg}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="md"
                        px={3}
                        py={2}
                        _hover={{ bg: hoverBg }}
                        cursor="pointer"
                        gap={2}
                      >
                        <Text fontFamily="mono" fontSize="xs" color="blue.400" flexShrink={0}>
                          /?
                        </Text>
                        <Text fontSize="sm" flex={1} noOfLines={1}>
                          {q.label || q.piece_title || "(untitled)"}
                        </Text>
                      </HStack>
                    </Link>
                  ))}
                </VStack>
              )}
            </VStack>
          )}
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  );
}
