"use client";

import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { RecurringActionItem } from "@mixtape/api/clients/studio/studioApi";

interface Props {
  dueActions?: RecurringActionItem[];
}

function daysOverdue(next_due_at: string): number {
  const diff = Date.now() - new Date(next_due_at).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function PersonalCard({ dueActions = [] }: Props) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.400", "gray.500");
  const itemBorder = useColorModeValue("gray.100", "gray.700");

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      mb={4}
    >
      <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" color={mutedColor} mb={2}>
        Personal
      </Text>

      {dueActions.length === 0 ? (
        <Text fontSize="sm" color={mutedColor}>Nothing new right now.</Text>
      ) : (
        <VStack gap={0} align="stretch">
          {dueActions.map((action) => {
            const overdue = daysOverdue(action.next_due_at);
            return (
              <HStack
                key={action.id}
                justify="space-between"
                py={2}
                borderTop="1px solid"
                borderColor={itemBorder}
              >
                <VStack align="start" gap={0} flex={1} minW={0}>
                  <Text fontSize="xs" fontWeight="medium" lineClamp={1}>{action.title}</Text>
                  {action.suggested_label && (
                    <Text fontSize="xs" color={mutedColor}>{action.suggested_label}</Text>
                  )}
                </VStack>
                {overdue > 0 && (
                  <Badge colorPalette="orange" size="sm" flexShrink={0} ml={2}>
                    {overdue}d overdue
                  </Badge>
                )}
              </HStack>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}
