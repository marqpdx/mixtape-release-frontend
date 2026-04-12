'use client';

import { useEffect, useState } from 'react';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Field,
  Input,
  Link,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { toaster } from '@mixtape/core/lib/toaster';
import { useMyMemberProfile, useMemberProfileMutation } from '@mixtape/api/hooks/member/useMemberProfile';

export default function MyProfilePanel() {
  const { member, isLoading } = useMyMemberProfile();
  const username = member?.username || '';
  const { update, isUpdating } = useMemberProfileMutation(username);

  const [displayName, setDisplayName] = useState('');
  const [quickIntro, setQuickIntro] = useState('');
  const [rightNow, setRightNow] = useState('');

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    if (!member) return;
    setDisplayName(member.display_name || '');
    setQuickIntro(member.quick_intro || '');
    setRightNow(member.right_now || '');
  }, [member]);

  const handleSave = async () => {
    if (!username) return;
    try {
      await update({
        display_name: displayName.trim() || undefined,
        quick_intro: quickIntro.trim() || undefined,
        right_now: rightNow.trim() || undefined,
      });
      toaster.create({
        title: 'Profile updated',
        description: 'Your basic profile fields have been saved.',
        type: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toaster.create({
        title: 'Save failed',
        description: message,
        type: 'error',
      });
    }
  };

  const fullEditHref = username
    ? `/app/member/${username}?tab=admin&section=edit-profile`
    : '/app/dashboard';

  return (
    <VStack gap={4} align="stretch">
      <Box>
        <Text fontSize="sm" color={mutedColor}>
          Quick edits for your public member profile.
        </Text>
      </Box>

      <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={4}>
        <VStack gap={4} align="stretch">
          <Field.Root>
            <Field.Label>Display name</Field.Label>
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="How you want to be known"
              maxLength={48}
              disabled={isLoading || isUpdating}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Quick intro</Field.Label>
            <Textarea
              value={quickIntro}
              onChange={(event) => setQuickIntro(event.target.value)}
              placeholder="A quick bit about yourself"
              rows={3}
              maxLength={300}
              disabled={isLoading || isUpdating}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Right now</Field.Label>
            <Textarea
              value={rightNow}
              onChange={(event) => setRightNow(event.target.value)}
              placeholder="A few words about how you are right now"
              rows={2}
              maxLength={200}
              disabled={isLoading || isUpdating}
            />
          </Field.Root>

          <Box>
            <Button
              colorPalette="blue"
              size="sm"
              onClick={() => void handleSave()}
              loading={isUpdating}
              disabled={isLoading || !username}
            >
              Save profile
            </Button>
          </Box>
        </VStack>
      </Box>

      <Link as={NextLink} href={fullEditHref} color="blue.500" fontSize="sm">
        Open full profile editing in member admin area
      </Link>
    </VStack>
  );
}
