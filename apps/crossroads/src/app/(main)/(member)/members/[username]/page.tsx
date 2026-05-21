'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { Box, Button, HStack, Link, Spinner, Tabs, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';
import StorylineExperience from '@/components/crossroads/StorylineExperience';
import MemberProfileTemplate from '@/components/crossroads/MemberProfileTemplate';
import MemberPublicWritingPanel from '@/components/crossroads/MemberPublicWritingPanel';
import { fetchPublicMemberProfile } from '@mixtape/api/clients/public/publicApi';

const ENABLED_TABS = new Set(['profile']);

export default function MemberPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = params.username as string;
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const tabStorageKey = username ? `member_profile_last_tab:${username}` : null;

  const isOwner = user?.username === username;
  // Only allow same-site group paths to prevent open redirect
  const rawReturnTo = searchParams?.get('returnTo') ?? null;
  const returnTo = rawReturnTo?.startsWith('/group/') ? rawReturnTo : null;

  useEffect(() => {
    const requestedTab = searchParams?.get('tab');
    if (requestedTab && ENABLED_TABS.has(requestedTab)) {
      setActiveTab(requestedTab);
      if (tabStorageKey && typeof window !== 'undefined') {
        window.localStorage.setItem(tabStorageKey, requestedTab);
      }
      return;
    }
    if (tabStorageKey && typeof window !== 'undefined') {
      const storedTab = window.localStorage.getItem(tabStorageKey);
      if (storedTab && ENABLED_TABS.has(storedTab)) {
        setActiveTab(storedTab);
        return;
      }
    }
    setActiveTab('profile');
  }, [searchParams, tabStorageKey]);

  const { data: profile } = useQuery({
    queryKey: ['public-member-profile', username],
    queryFn: () => fetchPublicMemberProfile(username),
    enabled: !!username,
  });

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 3, md: 6 }} py={6}>
      {/* Return to Group banner — shown when arriving via Me button */}
      {returnTo && (
        <HStack mb={4}>
          <Button asChild size="sm" variant="outline" colorPalette="gray">
            <Link as={NextLink} href={returnTo}>
              <IconArrowLeft size={14} />
              Return to Group
            </Link>
          </Button>
        </HStack>
      )}

      <Tabs.Root
        value={activeTab}
        onValueChange={({ value }) => {
          if (!ENABLED_TABS.has(value)) return;
          setActiveTab(value);
          if (tabStorageKey && typeof window !== 'undefined') {
            window.localStorage.setItem(tabStorageKey, value);
          }
          const params = new URLSearchParams(searchParams?.toString() ?? '');
          params.set('tab', value);
          router.replace(`?${params.toString()}`, { scroll: false });
        }}
      >
        <Tabs.List mb={6}>
          {isOwner ? (
            <Tabs.Trigger value="storyline" disabled>
              My Storyline
            </Tabs.Trigger>
          ) : null}
          <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
          <Tabs.Trigger value="writing" disabled>
            Writing
          </Tabs.Trigger>
        </Tabs.List>

        {isOwner ? (
          <Tabs.Content value="storyline">
            <StorylineExperience username={username} />
          </Tabs.Content>
        ) : null}

        <Tabs.Content value="profile">
          {profile ? (
            <MemberProfileTemplate
              profile={profile}
              isOwner={isOwner}
              editHref="/app/dashboard?section=edit-profile"
            />
          ) : (
            <Box px="6" py="20" textAlign="center">
              <Spinner size="lg" />
              <Text mt={3} color="gray.500">Loading profile…</Text>
            </Box>
          )}
        </Tabs.Content>

        <Tabs.Content value="writing">
          <MemberPublicWritingPanel username={username} />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
