// apps/mixtape/src/app/(authenticated)/member/[username]/workbench/page.tsx

'use client';

import { useParams } from 'next/navigation';
import { Box, Container, Heading, VStack, Text, Spinner } from '@chakra-ui/react';
import { useMemberProfile } from '@hooks/member/useMemberProfile';
import { ListsTab } from '@/components/workbench/ListsTab';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import { useColorModeValue } from '@components/ui/color-mode';

/**
 * Member Workbench Page
 *
 * Personal workspace for member-sponsored content.
 * Currently focused on Lists - personal capture surface.
 *
 * Route: /member/[username]/workbench
 */
export default function MemberWorkbenchPage() {
  const params = useParams();
  const username = params?.username as string;

  const { member, isLoading, error } = useMemberProfile(username);
  const subtextColor = useColorModeValue('gray.600', 'gray.400');

  if (isLoading) {
    return (
      <Container maxW="6xl" py={12}>
        <Box display="flex" justifyContent="center" alignItems="center" minH="300px">
          <VStack gap={4}>
            <Spinner size="xl" />
            <Text color={subtextColor}>Loading workbench...</Text>
          </VStack>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="6xl" py={12}>
        <MixtapeAlert
          status="error"
          title="Error Loading Workbench"
          description={error.message || 'Unable to load workbench'}
        />
      </Container>
    );
  }

  if (!member) {
    return (
      <Container maxW="6xl" py={12}>
        <MixtapeAlert
          status="warning"
          title="Member Not Found"
          description="The member profile you're looking for doesn't exist."
        />
      </Container>
    );
  }

  return (
    <Container maxW="6xl" py={8}>
      <VStack align="stretch" gap={6}>
        <Box>
          <Heading size="lg">My Workbench</Heading>
          <Text color={subtextColor} fontSize="sm">
            Personal workspace for @{member.username}
          </Text>
        </Box>

        <ListsTab />
      </VStack>
    </Container>
  );
}
