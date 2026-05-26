"use client";

import { HStack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

interface ScopeBarItem {
  label: string;
  href?: string;
}

interface ScopeBarProps {
  items: ScopeBarItem[];
}

export function ScopeBar({ items }: ScopeBarProps) {
  const router = useRouter();

  return (
    <HStack mb={6} gap={2} fontSize="sm" color="gray.500">
      {items.map((item, i) => (
        <HStack key={i} gap={2}>
          {i > 0 && <Text>/</Text>}
          {item.href ? (
            <Text
              as="button"
              _hover={{ color: "blue.500" }}
              onClick={() => router.push(item.href!)}
            >
              {item.label}
            </Text>
          ) : (
            <Text fontWeight="medium" color="gray.700">{item.label}</Text>
          )}
        </HStack>
      ))}
    </HStack>
  );
}
