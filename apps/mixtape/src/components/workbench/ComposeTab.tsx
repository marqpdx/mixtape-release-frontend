// src/components/workbench/ComposeTab.tsx
'use client';

import { useState } from 'react';
import { Box, Tabs } from '@chakra-ui/react';
import { GristInput } from './compose/GristInput';
import { RichTextInput } from './compose/RichTextInput';
import { ArtifactImport } from './compose/ArtifactImport';

interface ComposeTabProps {
  groupId: string;
  onDraftCreated?: (draftId: string) => void;
}

export function ComposeTab({ groupId, onDraftCreated }: ComposeTabProps) {
  const [inputMode, setInputMode] = useState('grist');

  return (
    <Box>
      <Tabs.Root value={inputMode} onValueChange={(e) => setInputMode(e.value)}>
        <Tabs.List mb={4}>
          <Tabs.Trigger value="grist">✍️ Grist Markup</Tabs.Trigger>
          <Tabs.Trigger value="richtext">📝 Rich Text</Tabs.Trigger>
          <Tabs.Trigger value="artifact">📚 From Artifact</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="grist">
          <GristInput groupId={groupId} onDraftCreated={onDraftCreated} />
        </Tabs.Content>

        <Tabs.Content value="richtext">
          <RichTextInput groupId={groupId} onDraftCreated={onDraftCreated} />
        </Tabs.Content>

        <Tabs.Content value="artifact">
          <ArtifactImport groupId={groupId} onDraftCreated={onDraftCreated} />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
