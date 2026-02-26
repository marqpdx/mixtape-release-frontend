// components/crossroads/FeedToggle.tsx

'use client';

import { Box, HStack, Text, Button } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';

export type FeedMode = 'storyline' | 'streams';

interface FeedToggleProps {
  activeMode: FeedMode;
  onModeChange: (mode: FeedMode) => void;
}

export default function FeedToggle({ activeMode, onModeChange }: FeedToggleProps) {
  const activeBg = useColorModeValue('gray.900', 'white');
  const activeColor = useColorModeValue('white', 'gray.900');
  const inactiveBg = useColorModeValue('gray.100', 'gray.800');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.200', 'gray.700');
  const helpColor = useColorModeValue('gray.400', 'gray.600');

  return (
    <Box>
      <HStack gap={1} p={1} borderRadius="lg" bg={inactiveBg} display="inline-flex">
        <Button
          size="sm"
          variant="ghost"
          bg={activeMode === 'storyline' ? activeBg : 'transparent'}
          color={activeMode === 'storyline' ? activeColor : inactiveColor}
          borderRadius="md"
          fontWeight="medium"
          onClick={() => onModeChange('storyline')}
          _hover={{
            bg: activeMode === 'storyline' ? activeBg : hoverBg,
          }}
        >
          My Storyline
        </Button>
        <Button
          size="sm"
          variant="ghost"
          bg={activeMode === 'streams' ? activeBg : 'transparent'}
          color={activeMode === 'streams' ? activeColor : inactiveColor}
          borderRadius="md"
          fontWeight="medium"
          onClick={() => onModeChange('streams')}
          _hover={{
            bg: activeMode === 'streams' ? activeBg : hoverBg,
          }}
        >
          Streams
        </Button>
      </HStack>
      <Text fontSize="xs" color={helpColor} mt={2}>
        Everything here is chosen by you.
      </Text>
    </Box>
  );
}
