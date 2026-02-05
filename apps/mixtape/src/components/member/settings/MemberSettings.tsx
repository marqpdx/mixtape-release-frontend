// apps/mixtape/src/components/member/settings/MemberSettings.tsx

'use client';

import { useState } from 'react';
import { Box, HStack, Button, VStack } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { WritingSettings } from './WritingSettings';

type SettingsSection = 'writing' | 'notifications' | 'account';

export function MemberSettings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('writing');

  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.700', 'blue.200');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');

  const sections: { key: SettingsSection; label: string; enabled: boolean }[] = [
    { key: 'writing', label: 'Writing', enabled: true },
    { key: 'notifications', label: 'Notifications', enabled: false },
    { key: 'account', label: 'Account', enabled: false },
  ];

  return (
    <VStack align="stretch" gap={6}>
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
        {activeSection === 'writing' && <WritingSettings />}
        {activeSection === 'notifications' && (
          <Box p={4} color="gray.500" textAlign="center">Coming soon</Box>
        )}
        {activeSection === 'account' && (
          <Box p={4} color="gray.500" textAlign="center">Coming soon</Box>
        )}
      </Box>
    </VStack>
  );
}
