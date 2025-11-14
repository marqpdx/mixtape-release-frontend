// components/groups/GroupNoticeboard.tsx

"use client";

import React, { useState } from 'react';
import {
  Box,
  Card,
  Flex,
  Text,
  IconButton,
  Heading,
  Link,
} from '@chakra-ui/react';
import {
  IconPin,
  IconAlertTriangle,
  IconX,
} from '@tabler/icons-react';
import { useColorModeValue } from '@components/ui/color-mode';
import { useGroupAnnouncements, GroupAnnouncement } from '@hooks/useGroupAnnouncements';
import { createStandaloneToast } from "@chakra-ui/toast";

const { toast } = createStandaloneToast();

interface GroupNoticeboardProps {
  groupSlug: string;
}

const PRIORITY_CONFIG = {
  critical: {
    icon: IconAlertTriangle,
    bg: 'red.50',
    borderColor: 'red.400',
    iconColor: 'red.600',
    badgeText: 'Critical',
    badgeColor: 'red',
  },
  high: {
    icon: IconPin,
    bg: 'blue.50',
    borderColor: 'blue.300',
    iconColor: 'blue.600',
    badgeText: 'Important',
    badgeColor: 'blue',
  },
  normal: {
    icon: IconPin,
    bg: 'green.50',
    borderColor: 'green.300',
    iconColor: 'green.600',
    badgeText: 'Announcement',
    badgeColor: 'green',
  },
};

export function GroupNoticeboard({ groupSlug }: GroupNoticeboardProps) {
  const { announcements, loading, dismissAnnouncement } = useGroupAnnouncements(groupSlug);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);

  if (loading || announcements.length === 0) {
    return null;
  }

  const current = announcements[currentIndex];
  if (!current) return null;

  const config = PRIORITY_CONFIG[current.priority];
  const IconComponent = config.icon;

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      const result = await dismissAnnouncement(current.id);

      toast({
        title: result.message,
        status: result.dismissal_type === 'snooze' ? 'info' : 'success',
        duration: 4000,
        isClosable: true,
      });

      // Move to next announcement or hide if this was the last one
      if (currentIndex < announcements.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
    } catch (error) {
      toast({
        title: 'Failed to dismiss announcement',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <Card.Root
      bg={config.bg}
      borderLeft="4px solid"
      borderColor={config.borderColor}
      position="relative"
    >
      <Card.Body py={3} px={4}>
        {/* Counter and dismiss button */}
        <Flex align="center" gap={2} mb={2}>
          {announcements.length > 1 && (
            <Text fontSize="xs" color="gray.600" fontWeight="medium">
              {currentIndex + 1} of {announcements.length}
            </Text>
          )}
          <Box flex="1" />
          <IconButton
            aria-label="Dismiss announcement"
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            loading={isDismissing}
            colorScheme={config.badgeColor}
          >
            <IconX size={16} />
          </IconButton>
        </Flex>

        {/* Main content */}
        <Flex align="start" gap={3}>
          <Box color={config.iconColor} mt={1} flexShrink={0}>
            <IconComponent size={24} />
          </Box>

          <Box flex="1">
            <Heading size="md" mb={2}>
              {current.title}
            </Heading>
            <Text fontSize="sm" color="gray.700" mb={3} lineHeight="tall">
              {current.content}
            </Text>

            <Flex align="center" gap={3} flexWrap="wrap">
              {current.cta_text && current.cta_url && (
                <Link href={current.cta_url}>
                  <Box
                    as="span"
                    display="inline-block"
                    px={3}
                    py={1.5}
                    fontSize="sm"
                    fontWeight="medium"
                    bg={`${config.badgeColor}.500`}
                    color="white"
                    borderRadius="md"
                    _hover={{ bg: `${config.badgeColor}.600` }}
                    transition="background 0.2s"
                  >
                    {current.cta_text}
                  </Box>
                </Link>
              )}

              <Text fontSize="xs" color="gray.600">
                Posted by {current.author_name} • {new Date(current.created_at).toLocaleDateString()}
              </Text>
            </Flex>
          </Box>
        </Flex>

        {/* Dots indicator for multiple announcements */}
        {announcements.length > 1 && (
          <Flex gap={1} mt={3} justify="center">
            {announcements.map((_, i) => (
              <Box
                key={i}
                w="6px"
                h="6px"
                borderRadius="full"
                bg={i === currentIndex ? `${config.badgeColor}.500` : 'gray.300'}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => setCurrentIndex(i)}
                _hover={{ transform: 'scale(1.2)' }}
              />
            ))}
          </Flex>
        )}
      </Card.Body>
    </Card.Root>
  );
}