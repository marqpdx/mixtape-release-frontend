// src/components/gristmill/MillWorkArea.tsx
'use client';

import { Box, Text } from '@chakra-ui/react';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import { Mill } from './Mill';
import type { SponsorContext } from './types';

interface MillWorkAreaProps {
  sponsor: SponsorContext;
}

/**
 * MillWorkArea - Wrapper for Mill that ensures sponsor context.
 *
 * Should only be accessed from within a WorkArea (Group or Member).
 * Provides sponsor context to all Mill operations.
 */
export function MillWorkArea({ sponsor }: MillWorkAreaProps) {
  // Validate sponsor context (should never happen, but good guardrail)
  if (!sponsor || !sponsor.slug) {
    return (
      <Box p={8}>
        <MixtapeAlert
          status="error"
          title="No Sponsor Context"
          description="Grist Mill must be accessed from within a Group or Member work area."
        />
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Mill sponsor={sponsor} />
    </Box>
  );
}
