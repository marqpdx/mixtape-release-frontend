// src/components/groups/CircleParentBar.tsx
'use client';

import { HStack, Text, Button } from '@chakra-ui/react';
import Link from 'next/link';
import { Group } from '@mixtape/core/types/groupTypes';

function BrushCircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path
        d="M10 2.5c2.8-.4 6.2 1.4 7 4.8.7 3-0.8 6.2-3.5 7.8-2.2 1.3-5.5 1.2-7.5-.2C3.8 13.4 2.5 10.5 3 7.8 3.5 5 6.5 3 10 2.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 4C5.5 4.8 4.2 6.5 4 8.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

interface CircleParentBarProps {
  group: Group;
}

export function CircleParentBar({ group }: CircleParentBarProps) {
  if (group.group_type !== 'circle' || !group.sponsor_group) {
    return null;
  }

  const parent = group.sponsor_group;

  return (
    <HStack
      justify="space-between"
      px={4}
      py={2}
      bg="theme.accentSoft"
      borderBottom="1px"
      borderColor="theme.border"
      mb={4}
    >
      <HStack gap={2}>
        <Text fontSize="sm" color="theme.textSecondary">
          Circle within
        </Text>
        <Link href={`/groups/${parent.slug}`}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="theme.accent"
            _hover={{ textDecoration: 'underline' }}
            cursor="pointer"
          >
            {parent.title}
          </Text>
        </Link>
        <HStack
          gap="4px"
          px="7px"
          py="2px"
          borderRadius="full"
          border="1px solid"
          borderColor="theme.accent"
          color="theme.accent"
          fontSize="11px"
          fontWeight="600"
          letterSpacing=".04em"
        >
          <BrushCircleIcon />
        </HStack>
      </HStack>

      <Button size="sm" variant="ghost" color="theme.accent">
        <Link href={`/groups/${parent.slug}`}>
          ← Back to {parent.title}
        </Link>
      </Button>
    </HStack>
  );
}
