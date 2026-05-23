// components/puddlejump/PuddlejumpWorkArea.tsx

'use client';

import { Box, HStack, Heading } from '@chakra-ui/react';
import type { WorkAreaProps } from '@components/dashboard/shared/types';
import OverviewPanel from './panels/OverviewPanel';
import FilesPanel from './panels/FilesPanel';
import DuplicatesPanel from './panels/DuplicatesPanel';
import GlossaryPanel from './panels/GlossaryPanel';
import CanonicalPanel from './panels/CanonicalPanel';
import SummariesPanel from './panels/SummariesPanel';
import RestructurePanel from './panels/RestructurePanel';
import DraftPanel from './panels/DraftPanel';
import { HelpTip } from '@/components/help/HelpTip';
import { useHelpRegistration } from '@/components/help/useHelpRegistration';

export default function PuddlejumpWorkArea({
  section,
  libraryId = null,
}: WorkAreaProps & { libraryId?: string | null }) {
  useHelpRegistration("PuddlejumpWorkArea");
  const panelProps = { libraryId };

  return (
    <Box p={6} maxW="960px">
      <HStack justify="space-between" align="start" mb={4}>
        <Heading size="md">Puddlejump</Heading>
        <HelpTip helpKey="puddlejump-overview" />
      </HStack>
      {section === 'overview' && <OverviewPanel {...panelProps} />}
      {section === 'files' && <FilesPanel {...panelProps} />}
      {section === 'duplicates' && <DuplicatesPanel {...panelProps} />}
      {section === 'glossary' && <GlossaryPanel {...panelProps} />}
      {section === 'canonical' && <CanonicalPanel {...panelProps} />}
      {section === 'summaries' && <SummariesPanel {...panelProps} />}
      {section === 'restructure' && <RestructurePanel {...panelProps} />}
      {section === 'draft' && <DraftPanel surface="puddlejump" />}
    </Box>
  );
}
