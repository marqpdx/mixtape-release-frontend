"use client";

import { Box, Heading, HStack, Text } from "@chakra-ui/react";
import { AskStudioButton } from "./AskStudioButton";

interface GroupContext {
  id: string;
  slug: string;
  title: string;
}

interface GroupStudioHeaderProps {
  title: string;
  subtitle?: string;
  groupContext?: GroupContext;
}

export function GroupStudioHeader({
  title,
  subtitle = "Group Studio",
  groupContext,
}: GroupStudioHeaderProps) {
  return (
    <Box mb={6}>
      <HStack justify="space-between" align="start">
        <Box>
          <Heading size="lg" mb={1}>{title}</Heading>
          <Text fontSize="sm" color="gray.500">{subtitle}</Text>
        </Box>
        {groupContext && (
          <AskStudioButton
            groupId={groupContext.id}
            groupSlug={groupContext.slug}
            groupTitle={groupContext.title}
          />
        )}
      </HStack>
    </Box>
  );
}
