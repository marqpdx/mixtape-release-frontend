// apps/mixtape/src/components/dashboard/member/MemberPreferencesWorkArea.tsx

"use client";

import { Box, Heading, Text, VStack, HStack, Spinner, Switch } from "@chakra-ui/react";
import { useUserPreferences } from "@mixtape/api/hooks/useUserPreferences";

export default function MemberPreferencesWorkArea() {
  const { preferences, isLoading, updatePreference } = useUserPreferences();

  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="sm" />
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={6}>
      <Heading size="md">Preferences</Heading>

      <Box
        border="1px solid"
        borderColor="border.default"
        borderRadius="lg"
        p={5}
      >
        <Heading size="sm" mb={4} color="fg.muted">
          Dashboard
        </Heading>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between" align="start">
            <Box flex={1}>
              <Text fontWeight="medium">Remember last work area</Text>
              <Text fontSize="sm" color="fg.muted">
                When on, the dashboard reopens to where you left off. When off,
                it always opens to My Groups.
              </Text>
            </Box>
            <Switch.Root
              checked={!!preferences.remember_last_work_area}
              onCheckedChange={(e) =>
                updatePreference("remember_last_work_area", e.checked)
              }
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>
        </VStack>
      </Box>
    </VStack>
  );
}
