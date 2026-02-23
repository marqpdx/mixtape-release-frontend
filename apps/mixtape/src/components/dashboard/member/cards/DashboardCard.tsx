"use client";

import { Card, HStack, Text, Button, Skeleton, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

interface DashboardCardProps {
  title: string;
  viewAllLabel?: string;
  viewAllOnClick?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyCta?: { label: string; onClick: () => void };
  isEmpty?: boolean;
  children: React.ReactNode;
}

export default function DashboardCard({
  title,
  viewAllLabel = "View all",
  viewAllOnClick,
  isLoading,
  emptyMessage,
  emptyCta,
  isEmpty,
  children,
}: DashboardCardProps) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");
  const emptyColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Card.Root
      bg={bg}
      borderWidth={1}
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.15s"
      _hover={{ shadow: "md", transform: "translateY(-1px)" }}
      h="100%"
    >
      <Card.Header py={3} px={4}>
        <HStack justify="space-between" w="100%">
          <Text fontWeight="semibold" fontSize="sm">
            {title}
          </Text>
          {viewAllOnClick && (
            <Button size="xs" variant="ghost" onClick={viewAllOnClick}>
              {viewAllLabel}
            </Button>
          )}
        </HStack>
      </Card.Header>

      <Card.Body px={4} py={2} flex="1">
        {isLoading ? (
          <VStack gap={3} align="stretch">
            <Skeleton height="20px" />
            <Skeleton height="20px" />
            <Skeleton height="20px" />
          </VStack>
        ) : isEmpty ? (
          <VStack gap={3} py={6} align="center">
            <Text fontSize="sm" color={emptyColor}>
              {emptyMessage || "Nothing here yet"}
            </Text>
            {emptyCta && (
              <Button size="sm" variant="outline" onClick={emptyCta.onClick}>
                {emptyCta.label}
              </Button>
            )}
          </VStack>
        ) : (
          children
        )}
      </Card.Body>
    </Card.Root>
  );
}
