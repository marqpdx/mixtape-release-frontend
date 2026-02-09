// components/puddlejump/PuddlejumpWorkArea.tsx

'use client';

import { Box } from '@chakra-ui/react';
import type { WorkAreaProps } from '@components/dashboard/shared/types';
import OverviewPanel from './panels/OverviewPanel';
import FilesPanel from './panels/FilesPanel';
import DuplicatesPanel from './panels/DuplicatesPanel';
import GlossaryPanel from './panels/GlossaryPanel';
import CanonicalPanel from './panels/CanonicalPanel';
import SummariesPanel from './panels/SummariesPanel';
import RestructurePanel from './panels/RestructurePanel';

export default function PuddlejumpWorkArea({
  section,
  libraryId = null,
}: WorkAreaProps & { libraryId?: string | null }) {
  const panelProps = { libraryId };

  return (
    <Box p={6} maxW="960px">
      {section === 'overview' && <OverviewPanel {...panelProps} />}
      {section === 'files' && <FilesPanel {...panelProps} />}
      {section === 'duplicates' && <DuplicatesPanel {...panelProps} />}
      {section === 'glossary' && <GlossaryPanel {...panelProps} />}
      {section === 'canonical' && <CanonicalPanel {...panelProps} />}
      {section === 'summaries' && <SummariesPanel {...panelProps} />}
      {section === 'restructure' && <RestructurePanel {...panelProps} />}
    </Box>
  );
}
