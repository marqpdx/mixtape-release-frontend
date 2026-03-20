"use client";

import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";

interface CoachCardProps {
  heading: string;
  copy: string;
  currentIndex: number;
  total: number;
  groupName: string;
  isFinal: boolean;
  onNext: () => void;
  onPrev: () => void;
  onDismiss: () => void;
}

export function CoachCard({
  heading,
  copy,
  currentIndex,
  total,
  groupName,
  isFinal,
  onNext,
  onPrev,
  onDismiss,
}: CoachCardProps) {
  return (
    <Box
      position="fixed"
      bottom={6}
      right={6}
      zIndex={9999}
      w="300px"
      bg="white"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="lg"
      p={4}
    >
      <VStack gap={3} align="stretch">
        {isFinal ? (
          <VStack gap={2} align="center" textAlign="center">
            <Text fontSize="lg" fontWeight="semibold">
              You&apos;re all set.
            </Text>
            <Text fontSize="md" color="gray.600">
              Welcome to {groupName}. 🌱
            </Text>
            <Button
              bg="green.500"
              color="white"
              size="sm"
              w="full"
              onClick={onDismiss}
              _hover={{ bg: "green.600" }}
            >
              Let&apos;s go
            </Button>
          </VStack>
        ) : (
          <>
            <VStack gap={1} align="start">
              <Text fontWeight="600" fontSize="sm" color="green.600">
                {heading}
              </Text>
              <Text fontSize="sm" color="gray.600" lineHeight="tall">
                {copy}
              </Text>
            </VStack>

            <HStack justify="space-between" align="center">
              <HStack gap={2}>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={onPrev}
                  disabled={currentIndex === 0}
                  color="gray.500"
                  px={2}
                >
                  ← Prev
                </Button>
                <Text fontSize="xs" color="gray.400">
                  {currentIndex + 1} of {total}
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={onNext}
                  color="gray.500"
                  px={2}
                >
                  Next →
                </Button>
              </HStack>

              <Text
                fontSize="xs"
                color="gray.400"
                cursor="pointer"
                onClick={onDismiss}
                _hover={{ color: "gray.600" }}
                userSelect="none"
              >
                Dismiss
              </Text>
            </HStack>
          </>
        )}
      </VStack>
    </Box>
  );
}
