// src/components/write/composer/PublishSection.tsx

import React from 'react';
import {
  VStack,
  Box
} from '@chakra-ui/react';
import PublishPanel from '../PublishPanel'; // Assuming this exists

export interface PublishSectionProps {
  draftId?: string;
  title: string;
  docJSON: any;
  tags: string[];
}

export function PublishSection({
  draftId,
  title,
  docJSON,
  tags
}: PublishSectionProps) {
  return (
    <VStack className="publish-panel" w={"full"}>
      <Box w={"full"} mt={6}>
        <PublishPanel
          draftId={draftId}
          title={title}
          docJSON={docJSON}
          tags={tags}
        />
      </Box>
    </VStack>
  );
}