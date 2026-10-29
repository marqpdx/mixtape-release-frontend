// apps/mixtape/src/components/member/settings/MemberSettings.tsx

'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import { Box, HStack, Button, VStack, Heading, Text, Link } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import MemberPreferencesWorkArea from '@/components/dashboard/member/MemberPreferencesWorkArea';
import { WritingSettings } from './WritingSettings';
import { AIAccountsSettings } from './AIAccountsSettings';

// The one Settings place: Dashboard → Settings (CTO, 2026-10-23;
// zz/profile-settings-consolidation-build-plan.md, PS-1).
type SettingsSection = 'general' | 'writing' | 'ai' | 'notifications';

export function MemberSettings({ initialSection = 'general' }: { initialSection?: SettingsSection } = {}) {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.700', 'blue.200');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');

  const sections: { key: SettingsSection; label: string; enabled: boolean }[] = [
    { key: 'general', label: 'General', enabled: true },
    { key: 'writing', label: 'Writing', enabled: true },
    { key: 'ai', label: 'AI accounts', enabled: true },
    { key: 'notifications', label: 'Notifications', enabled: true },
  ];

  return (
    <VStack align="stretch" gap={6}>
      <Heading size="md">Settings</Heading>
      {/* Section Tabs */}
      <HStack gap={1} borderBottom="1px" borderColor="gray.200" pb={2}>
        {sections.map((section) => (
          <Button
            key={section.key}
            size="sm"
            variant="ghost"
            onClick={() => section.enabled && setActiveSection(section.key)}
            bg={activeSection === section.key ? activeBg : 'transparent'}
            color={activeSection === section.key ? activeColor : inactiveColor}
            opacity={section.enabled ? 1 : 0.5}
            cursor={section.enabled ? 'pointer' : 'not-allowed'}
            _hover={section.enabled ? { bg: activeBg } : {}}
          >
            {section.label}
          </Button>
        ))}
      </HStack>

      {/* Section Content */}
      <Box>
        {activeSection === 'general' && <MemberPreferencesWorkArea hideHeading />}
        {activeSection === 'writing' && <WritingSettings />}
        {activeSection === 'ai' && <AIAccountsSettings />}
        {activeSection === 'notifications' && (
          <Box p={4}>
            <Text mb={2}>Notification preferences live with your notifications for now.</Text>
            <Link asChild color="blue.500">
              <NextLink href="/notifications">Open notification preferences →</NextLink>
            </Link>
          </Box>
        )}
      </Box>
    </VStack>
  );
}
