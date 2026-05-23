// apps/mixtape/src/app/(authenticated)/puddlejump/page.tsx

'use client';

import { Box, Spinner, Text } from '@chakra-ui/react';
import { usePersonalPuddlejump } from '@mixtape/api/hooks/puddlejump';
import DashboardLayout from '@components/common/DashboardLayout';
import type { MenuItem } from '@components/dashboard/shared/types';
import PuddlejumpWorkArea from '@components/puddlejump/PuddlejumpWorkArea';

const MENU_ITEMS: MenuItem[] = [
  {
    key: 'library',
    label: 'Library',
    icon: '\u{1F4DA}',
    subItems: [
      { key: 'overview', label: 'Overview' },
      { key: 'files', label: 'Files' },
    ],
  },
  {
    key: 'utilities',
    label: 'Utilities',
    icon: '\u{1F527}',
    subItems: [
      { key: 'duplicates', label: 'Duplicates' },
      { key: 'glossary', label: 'Glossary' },
      { key: 'canonical', label: 'Canonical' },
      { key: 'summaries', label: 'Summaries' },
      { key: 'restructure', label: 'Restructure' },
    ],
  },
  {
    key: 'generate',
    label: 'Generate',
    icon: '\u{2728}',
    subItems: [
      { key: 'draft', label: 'Draft' },
    ],
  },
];

export default function PuddlejumpPage() {
  const { puddlejump, isLoading, error } = usePersonalPuddlejump();

  if (isLoading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="lg" color="theme.accent" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box maxW="600px" mx="auto" mt={10} p={6} borderWidth="1px" borderColor="red.300" borderRadius="lg" bg="red.50">
        <Text color="red.600">Failed to load Puddlejump: {error.message}</Text>
      </Box>
    );
  }

  const libraryId = puddlejump?.id ?? null;

  return (
    <DashboardLayout
      title="Puddlejump"
      menuItems={MENU_ITEMS}
      defaultSection="overview"
      localStorageKey="puddlejumpActiveSection"
      WorkAreaComponent={PuddlejumpWorkArea}
      workAreaProps={{ libraryId }}
    />
  );
}
