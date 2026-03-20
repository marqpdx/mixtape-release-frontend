// src/components/groups/writing/controls/GroupPublishControls.tsx
'use client';

import { useState } from 'react';
import { Button, HStack } from '@chakra-ui/react'; // v3 API
import { applyWorkingCopy, publishAndPlace } from '@mixtape/api/clients/writing/writingApi';
import { PublishAndPlacePayload } from '@mixtape/core/types/writingTypes';
// Note: This component uses the advanced publish-and-place endpoint
// For standard publishing, see SimplePublishDialog which uses useWritingMutations

export default function GroupPublishControls({
  pieceId,
  buildPayload, // () => PublishAndPlacePayload
  onSuccess,
}: {
  pieceId: string;
  buildPayload: () => PublishAndPlacePayload;
  onSuccess?: (result: Record<string, unknown>) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      // Ensure WC merged before publish
      await applyWorkingCopy(pieceId);
      const payload = buildPayload();
      const result = await publishAndPlace(pieceId, payload);
      onSuccess?.(result);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HStack gap={3}>
      <Button onClick={handlePublish} disabled={submitting}>
        Publish
      </Button>
      {/* open schedule modal in your composer */}
    </HStack>
  );
}
