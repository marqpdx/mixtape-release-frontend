// src/components/write/composer/ScrollToTopButton.tsx

'use client';

import { useCallback } from 'react';
import { Box, IconButton } from '@chakra-ui/react';
import { IconChevronUp } from '@tabler/icons-react';
import { useColorModeValue } from '@components/ui/color-mode';

interface ScrollToTopButtonProps {
  workspaceOpen: boolean;
  workspaceWidth: string;
}

export function ScrollToTopButton({ workspaceOpen, workspaceWidth }: ScrollToTopButtonProps) {
  const buttonBg = useColorModeValue("white", "gray.700");
  const buttonColor = useColorModeValue("gray.700", "gray.200");
  const buttonHoverBg = useColorModeValue("gray.50", "gray.600");
  const buttonBorder = useColorModeValue("gray.200", "gray.600");
  const accentColor = useColorModeValue("green.500", "green.400");

  const handleScrollToTop = useCallback(() => {
    const mainContent = document.querySelector('.main-content-area');
    mainContent?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <Box
      position="fixed"
      bottom="20px"
      right={workspaceOpen ? `calc(${workspaceWidth} + 20px)` : "68px"}
      transition="right 0.3s ease"
      zIndex={1000}
    >
      <IconButton
        size="md"
        variant="solid"
        bg={buttonBg}
        color={buttonColor}
        border="2px solid"
        borderColor={buttonBorder}
        borderRadius="full"
        shadow="lg"
        onClick={handleScrollToTop}
        _hover={{
          bg: buttonHoverBg,
          borderColor: accentColor,
          transform: "translateY(-2px)",
          shadow: "xl"
        }}
        title="Back to top"
      >
        <IconChevronUp size={20} />
      </IconButton>
    </Box>
  );
}