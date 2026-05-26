"use client";

import { Box, Heading, Text } from "@chakra-ui/react";

interface GroupStudioHeaderProps {
  title: string;
  subtitle?: string;
}

export function GroupStudioHeader({ title, subtitle = "Group Studio" }: GroupStudioHeaderProps) {
  return (
    <Box mb={6}>
      <Heading size="lg" mb={1}>{title}</Heading>
      <Text fontSize="sm" color="gray.500">{subtitle}</Text>
    </Box>
  );
}
