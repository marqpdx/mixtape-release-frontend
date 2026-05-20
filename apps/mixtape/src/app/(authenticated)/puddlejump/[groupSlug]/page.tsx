// apps/mixtape/src/app/(authenticated)/puddlejump/[groupSlug]/page.tsx

'use client';

import { Box, Spinner, Text } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { useGroupPuddlejump } from '@mixtape/api/hooks/stackroom';
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
];

export default function GroupPuddlejumpPage() {
  const { groupSlug } = useParams<{ groupSlug: string }>();
  const { library, isLoading, error } = useGroupPuddlejump(groupSlug ?? null);

  if (isLoading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="lg" color="theme.accent" />
      </Box>
    );
  }

  if (error) {
    const isPermission = (error as { response?: { status?: number } }).response?.status === 403;
    return (
      <Box maxW="600px" mx="auto" mt={10} p={6} borderWidth="1px" borderColor="red.300" borderRadius="lg" bg="red.50">
        <Text color="red.600">
          {isPermission
            ? 'You do not have permission to view this group library.'
            : `Failed to load group library: ${error.message}`}
        </Text>
      </Box>
    );
  }

  const libraryId = library?.id ?? null;

  return (
    <DashboardLayout
      title={library?.title ?? `${groupSlug} Library`}
      menuItems={MENU_ITEMS}
      defaultSection="overview"
      localStorageKey={`puddlejumpGroup_${groupSlug}_activeSection`}
      WorkAreaComponent={PuddlejumpWorkArea}
      workAreaProps={{ libraryId }}
    />
  );
}
