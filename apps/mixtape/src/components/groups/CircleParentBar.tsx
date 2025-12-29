// src/components/groups/CircleParentBar.tsx
'use client';

import { HStack, Text, Button, Badge } from '@chakra-ui/react';
import Link from 'next/link';
import { Group } from '@mixtape/core/types/groupTypes';

interface CircleParentBarProps {
  group: Group;
}

export function CircleParentBar({ group }: CircleParentBarProps) {
  // Only show for circles with a parent group
  if (group.group_type !== 'circle' || !group.sponsor_group) {
    return null;
  }

  const parent = group.sponsor_group;

  return (
    <HStack
      justify="space-between"
      px={4}
      py={2}
      bg="purple.50"
      borderBottom="1px"
      borderColor="purple.200"
      mb={4}
    >
      <HStack gap={2}>
        <Text fontSize="sm" color="gray.600">
          Circle within
        </Text>
        <Link href={`/groups/${parent.slug}`}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="purple.700"
            _hover={{ textDecoration: 'underline' }}
            cursor="pointer"
          >
            {parent.title}
          </Text>
        </Link>
        <Badge colorScheme="purple" size="sm">
          Circle
        </Badge>
      </HStack>

      <Button
        size="sm"
        variant="ghost"
        colorScheme="purple"
      >
        <Link href={`/groups/${parent.slug}`}>
          ← Back to {parent.title}
        </Link>
      </Button>
    </HStack>
  );
}
