// apps/mixtape/src/app/(authenticated)/member/[username]/settings/page.tsx

'use client';

import { useParams } from 'next/navigation';
import { Container, VStack, Box, Heading, Text } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { useMemberProfile } from '@mixtape/api/hooks/member';
import { MemberSettings } from '@/components/member/settings/MemberSettings';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';

export default function MemberSettingsPage() {
  const params = useParams();
  const username = params?.username as string;
  const { member, isLoading, error } = useMemberProfile(username);

  const subtextColor = useColorModeValue('gray.600', 'gray.400');

  if (isLoading) {
    return (
      <Container maxW="4xl" py={8}>
        <Text color="gray.500">Loading...</Text>
      </Container>
    );
  }

  if (error || !member) {
    return (
      <Container maxW="4xl" py={8}>
        <MixtapeAlert
          status="error"
          title="Error Loading Profile"
          description={error?.message || 'Member not found'}
        />
      </Container>
    );
  }

  return (
    <Container maxW="4xl" py={8}>
      <VStack align="stretch" gap={6}>
        <Box>
          <Heading size="lg">Settings</Heading>
          <Text color={subtextColor} fontSize="sm">
            Preferences for @{member.username}
          </Text>
        </Box>

        <MemberSettings />
      </VStack>
    </Container>
  );
}
