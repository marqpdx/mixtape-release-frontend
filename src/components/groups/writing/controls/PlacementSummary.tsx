// src/components/groups/writing/controls/PlacementSummary.tsx

'use client';

import { PlacementOptions, PublishDestinations } from '@mixtape/core/types/writingTypes';
import { Card, Text, Stack } from '@chakra-ui/react';
// import type { PublishDestinations, PlacementOptions } from '../interfaces';

export function PlacementSummary({
  dests,
  options,
}: {
  dests: PublishDestinations;
  options: PlacementOptions;
}) {
  const targets = [
    dests.personal ? 'Personal' : null,
    ...(dests.groups || []).map((g) => `Group: ${g}`),
    dests.lantern ? 'Lantern' : null,
  ].filter(Boolean) as string[];

  return (
    <Card.Root>
      <Card.Header>
        <Text fontWeight="bold">Will publish to</Text>
      </Card.Header>
      <Card.Body>
        <Stack gap={1}>
          {targets.length ? (
            targets.map((t, i) => <Text key={i}>• {t}</Text>)
          ) : (
            <Text opacity={0.7}>No destinations selected</Text>
          )}
          <Text mt={2} opacity={0.8}>
            Visibility: {options.visibility || 'public'}
          </Text>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
