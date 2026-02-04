// src/components/editor/SpellCorrectionPopup.tsx
/**
 * SpellCorrectionPopup Component
 *
 * A minimal popup for quick spell corrections.
 * Shows the original word and a field to type the correction.
 * Enter applies the correction and adds to dictionary.
 * Escape closes without action.
 *
 * Part of PocketTools - Spelling Helpers
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Input, Text, HStack, Kbd } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import type { SpellCorrectionState } from './extensions/SpellCorrection';

interface SpellCorrectionPopupProps {
  state: SpellCorrectionState | null;
  onApply: (originalWord: string, correction: string) => void;
  onClose: () => void;
}

export function SpellCorrectionPopup({ state, onApply, onClose }: SpellCorrectionPopupProps) {
  const [correction, setCorrection] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  // Reset and focus when popup opens
  useEffect(() => {
    if (state?.isOpen) {
      setCorrection('');
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [state?.isOpen, state?.word]);

  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (correction.trim() && state?.word) {
        onApply(state.word, correction.trim());
      }
      onClose();
      return;
    }
  }, [correction, state?.word, onApply, onClose]);

  if (!state?.isOpen) return null;

  return (
    <Box
      position="fixed"
      left={`${state.position.x}px`}
      top={`${state.position.y}px`}
      zIndex={9999}
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow="lg"
      p={2}
      minW="200px"
    >
      {/* Original word (read-only) */}
      <HStack gap={2} mb={2}>
        <Text fontSize="xs" color={mutedColor} fontWeight="medium">
          Original:
        </Text>
        <Text fontSize="sm" fontFamily="mono" color="red.500" textDecoration="line-through">
          {state.word}
        </Text>
      </HStack>

      {/* Correction input */}
      <Input
        ref={inputRef}
        value={correction}
        onChange={(e) => setCorrection(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type correction..."
        size="sm"
        fontFamily="mono"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {/* Hints */}
      <HStack gap={3} mt={2} fontSize="xs" color={mutedColor}>
        <HStack gap={1}>
          <Kbd size="sm">Enter</Kbd>
          <Text>apply</Text>
        </HStack>
        <HStack gap={1}>
          <Kbd size="sm">Esc</Kbd>
          <Text>cancel</Text>
        </HStack>
      </HStack>
    </Box>
  );
}

export default SpellCorrectionPopup;
