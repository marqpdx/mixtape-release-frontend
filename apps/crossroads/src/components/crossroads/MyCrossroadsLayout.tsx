// apps/crossroads/components/crossroads/MyCrossroadsLayout.tsx

'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Box, HStack, IconButton } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconPencilPlus,
  IconChevronDown,
  IconChevronUp,
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
  const [mobileComposerHidden, setMobileComposerHidden] = useState(false);
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
          {/*
            Layout transition: The composer pane stays mounted at all times
            (never conditionally rendered) to avoid DOM mount/unmount causing
            layout thrash. Instead it collapses to 0% width + opacity 0 when
            hidden. We animate only flex-basis and opacity — NOT "all" — to
            prevent the narrative content (especially images) from reflowing
            mid-transition, which caused a visible bounce.
          */}

          {/* Narrative pane */}
          <Box
            flex={showComposer ? '0 0 60%' : '1'}
            maxW={showComposer ? '60%' : '100%'}
            py={6}
            pr={showComposer ? 4 : 0}
            transition="flex 0.2s ease, max-width 0.2s ease, padding 0.2s ease"
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

          {/* Composer pane (owner only) — always mounted, hidden via width collapse */}
          {isOwner && (
            <Box
              flex={showComposer ? '0 0 40%' : '0 0 0%'}
              maxW={showComposer ? '40%' : '0%'}
              overflow="hidden"
              opacity={showComposer ? 1 : 0}
              py={showComposer ? 6 : 0}
              pl={showComposer ? 4 : 0}
              pr={showComposer ? 2 : 0}
              borderLeftWidth={showComposer ? '1px' : '0'}
              borderColor={borderColor}
              position="sticky"
              top="60px"
              maxH="calc(100vh - 60px)"
              overflowY={showComposer ? 'auto' : 'hidden'}
              bg={composerBg}
              transition="flex 0.2s ease, max-width 0.2s ease, opacity 0.15s ease, padding 0.2s ease"
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
        <Box px={4} py={4} pb={isOwner && !mobileComposerHidden ? '280px' : 4}>
          {narrativePane}
        </Box>

        {/* Bottom composer (owner only) */}
        {isOwner && !mobileComposerHidden && (
          <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            bg={composerBg}
            borderTopWidth="1px"
            borderColor={borderColor}
            zIndex={10}
            shadow="lg"
          >
            {/* Minimize handle */}
            <Box textAlign="center" pt={1} pb={0}>
              <IconButton
                aria-label="Minimize composer"
                variant="ghost"
                size="xs"
                onClick={() => setMobileComposerHidden(true)}
              >
                <IconChevronDown size={16} />
              </IconButton>
            </Box>
            <Box px={4} pb={4} maxH="45vh" overflowY="auto">
              {composerPane}
            </Box>
          </Box>
        )}

        {/* Floating button to restore composer */}
        {isOwner && mobileComposerHidden && (
          <IconButton
            aria-label="Open composer"
            position="fixed"
            bottom={4}
            right={4}
            size="lg"
            borderRadius="full"
            colorPalette="blue"
            onClick={() => setMobileComposerHidden(false)}
            shadow="lg"
            zIndex={10}
          >
            <IconPencilPlus size={22} />
          </IconButton>
        )}
      </Box>
    </>
  );
}
