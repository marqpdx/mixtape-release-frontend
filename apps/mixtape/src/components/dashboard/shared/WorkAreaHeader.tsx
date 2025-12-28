// src/components/dashboard/shared/WorkAreaHeader.tsx

import React from 'react';
import { Flex, VStack, HStack, Heading, Text } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';

interface WorkAreaHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Reusable header component for work area landing pages
 * Used in Threadworks, Almanac, and other work areas
 */
export function WorkAreaHeader({
  title,
  description,
  icon,
  actions,
}: WorkAreaHeaderProps) {
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Flex justify="space-between" align="center" mb={6}>
      <VStack align="start" gap={2}>
        <HStack gap={2}>
          {icon}
          <Heading size="2xl" color="green.500">
            {title}
          </Heading>
        </HStack>
        {description && (
          <Text color={textColor} fontSize="sm">
            {description}
          </Text>
        )}
      </VStack>

      {actions && <HStack gap={2}>{actions}</HStack>}
    </Flex>
  );
}

export default WorkAreaHeader;
