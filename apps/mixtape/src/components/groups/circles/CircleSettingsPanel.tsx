// groups/circles/CircleSettingsPanel.tsx
// Admin settings for a circle. Rendered in CommandTab when group_type === 'circle'.
// visible_to_parent requires backend serializer support before it takes effect.
"use client";

import { useState } from "react";
import { Box, Flex, Switch, Text, VStack } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGroup } from "@mixtape/api/clients/group/groupApi";
import { groupsQueryKeys } from "@mixtape/api/hooks/groups/useGroups";
import { toaster } from "@mixtape/core/lib/toaster";
import type { Group } from "@mixtape/core/types/groupTypes";

interface Props {
  group: Group;
}

export function CircleSettingsPanel({ group }: Props) {
  const qc = useQueryClient();
  const [visibleToParent, setVisibleToParent] = useState<boolean>(
    group.visible_to_parent ?? false
  );

  const mutation = useMutation({
    mutationFn: (value: boolean) =>
      updateGroup(group.slug, { visible_to_parent: value }),
    onSuccess: (updated) => {
      qc.setQueryData(groupsQueryKeys.detail(group.slug), updated);
      toaster.success({ title: "Circle settings saved" });
    },
    onError: () => {
      setVisibleToParent((prev) => !prev);
      toaster.error({ title: "Could not save settings" });
    },
  });

  const handleToggle = () => {
    const next = !visibleToParent;
    setVisibleToParent(next);
    mutation.mutate(next);
  };

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      p={5}
      mt={4}
    >
      <Text fontWeight="semibold" fontSize="sm" mb={4} color="gray.700">
        Circle Settings
      </Text>

      <VStack align="stretch" gap={4}>
        <Flex align="flex-start" justify="space-between" gap={4}>
          <Box flex="1">
            <Text fontWeight="medium" fontSize="sm" color="gray.800">
              Visible to parent group
            </Text>
            <Text fontSize="xs" color="gray.500" mt={0.5}>
              When on, members of{" "}
              <Text as="span" fontWeight="semibold">
                {group.sponsor_group?.title ?? "the parent group"}
              </Text>{" "}
              can see this circle exists and request to join (subject to
              admission policy). When off, the circle is invisible outside
              its own membership.
            </Text>
          </Box>
          <Switch.Root
            checked={visibleToParent}
            onCheckedChange={handleToggle}
            disabled={mutation.isPending}
            size="md"
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </Flex>
      </VStack>
    </Box>
  );
}
