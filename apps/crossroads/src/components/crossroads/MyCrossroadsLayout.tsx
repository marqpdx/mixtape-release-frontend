// components/crossroads/MyCrossroadsLayout.tsx

'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Box, HStack, IconButton } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconPencilPlus,
} from '@tabler/icons-react';

const FULL_MODE_KEY = 'crossroads-full-mode';

interface MyCrossroadsLayoutProps {
  narrativePane: ReactNode;
  composerPane: ReactNode;
  isOwner: boolean;
}

export default function MyCrossroadsLayout({
  narrativePane,
  composerPane,
  isOwner,
}: MyCrossroadsLayoutProps) {
  const [fullMode, setFullMode] = useState(false);
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const composerBg = useColorModeValue('gray.50', 'gray.800');

  // Restore full mode preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(FULL_MODE_KEY);
    if (stored === 'true') setFullMode(true);
  }, []);

  const toggleFullMode = () => {
    const next = !fullMode;
    setFullMode(next);
    localStorage.setItem(FULL_MODE_KEY, String(next));
  };

  const showComposer = isOwner && !fullMode;

  return (
    <>
      {/* Desktop layout (md+) */}
      <Box display={{ base: 'none', md: 'block' }} maxW="1400px" mx="auto" px={4}>
        <HStack align="start" gap={0} minH="calc(100vh - 60px)">
          {/* Narrative pane */}
          <Box
            flex={showComposer ? '0 0 60%' : '1'}
            maxW={showComposer ? '60%' : '100%'}
            py={6}
            pr={showComposer ? 4 : 0}
            transition="all 0.3s"
          >
            {/* Full mode toggle */}
            {isOwner && (
              <Box mb={4} textAlign="right">
                <IconButton
                  aria-label={fullMode ? 'Show composer' : 'Full mode'}
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullMode}
                >
                  {fullMode ? <IconArrowsMinimize size={18} /> : <IconArrowsMaximize size={18} />}
                </IconButton>
              </Box>
            )}
            <Box maxW="640px" mx="auto">
              {narrativePane}
            </Box>
          </Box>

          {/* Composer pane (owner only, not full mode) */}
          {showComposer && (
            <Box
              flex="0 0 40%"
              maxW="40%"
              py={6}
              pl={4}
              pr={2}
              borderLeftWidth="1px"
              borderColor={borderColor}
              position="sticky"
              top="60px"
              maxH="calc(100vh - 60px)"
              overflowY="auto"
              bg={composerBg}
            >
              {composerPane}
            </Box>
          )}
        </HStack>

        {/* Floating composer button in full mode */}
        {isOwner && fullMode && (
          <IconButton
            aria-label="Open composer"
            position="fixed"
            bottom={6}
            right={6}
            size="lg"
            borderRadius="full"
            colorPalette="blue"
            onClick={toggleFullMode}
            shadow="lg"
          >
            <IconPencilPlus size={22} />
          </IconButton>
        )}
      </Box>

      {/* Mobile layout */}
      <Box display={{ base: 'block', md: 'none' }}>
        {/* Narrative content */}
        <Box px={4} py={4} pb={isOwner ? '280px' : 4}>
          {narrativePane}
        </Box>

        {/* Bottom composer (owner only) */}
        {isOwner && (
          <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            bg={composerBg}
            borderTopWidth="1px"
            borderColor={borderColor}
            p={4}
            maxH="50vh"
            overflowY="auto"
            zIndex={10}
            shadow="lg"
          >
            {composerPane}
          </Box>
        )}
      </Box>
    </>
  );
}
