'use client';

import { Box, HStack, Text, IconButton } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { IconX } from '@tabler/icons-react';

interface CheckoutBannerProps {
  checkedOutBy: string;
  onDismiss: () => void;
}

export default function CheckoutBanner({ checkedOutBy, onDismiss }: CheckoutBannerProps) {
  const bg = useColorModeValue('yellow.50', 'yellow.900');
  const borderColor = useColorModeValue('yellow.200', 'yellow.700');
  const textColor = useColorModeValue('yellow.800', 'yellow.200');

  return (
    <Box
      bg={bg}
      borderWidth={1}
      borderColor={borderColor}
      borderRadius="md"
      px={4}
      py={2}
      mb={3}
    >
      <HStack justify="space-between">
        <Text fontSize="sm" color={textColor}>
          Currently being edited by <strong>@{checkedOutBy}</strong>
        </Text>
        <IconButton
          size="xs"
          variant="ghost"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <IconX size={14} />
        </IconButton>
      </HStack>
    </Box>
  );
}
