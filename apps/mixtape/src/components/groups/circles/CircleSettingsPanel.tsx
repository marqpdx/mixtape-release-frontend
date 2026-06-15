// groups/circles/CircleSettingsPanel.tsx
// Admin settings for a circle. Rendered in CommandTab when group_type === 'circle'.
"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  NativeSelect,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateGroup,
  applyCircleDecorator,
  removeCircleDecorator,
  updateCircleDeliverableIntent,
} from "@mixtape/api/clients/group/groupApi";
import { groupsQueryKeys } from "@mixtape/api/hooks/groups/useGroups";
import { toaster } from "@mixtape/core/lib/toaster";
import type { Group, DeliverableType, DeliverableStatus } from "@mixtape/core/types/groupTypes";

const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  puddlejump_doc: "Puddlejump Document",
  dispatch: "Dispatch",
  finding: "Finding",
};

const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
  working: "Working",
  complete: "Complete",
  tabled: "Tabled",
};

// ---------------------------------------------------------------------------
// Deliverable intent sub-panel
// ---------------------------------------------------------------------------

interface DeliverableIntentPanelProps {
  group: Group;
}

function DeliverableIntentPanel({ group }: DeliverableIntentPanelProps) {
  const qc = useQueryClient();
  const cdi = group.deliverable_intent ?? null;
  const [typeValue, setTypeValue] = useState<DeliverableType>(
    cdi?.deliverable_type ?? "puddlejump_doc"
  );

  // Apply hasDeliverableIntent
  const applyMutation = useMutation({
    mutationFn: () =>
      applyCircleDecorator(group.slug, "hasDeliverableIntent", typeValue),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupsQueryKeys.detail(group.slug) });
      toaster.success({ title: "Deliverable intent enabled" });
    },
    onError: () => {
      toaster.error({ title: "Could not enable deliverable intent" });
    },
  });

  // Remove hasDeliverableIntent
  const removeMutation = useMutation({
    mutationFn: () => removeCircleDecorator(group.slug, "hasDeliverableIntent"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupsQueryKeys.detail(group.slug) });
      toaster.success({ title: "Deliverable intent removed" });
    },
    onError: () => {
      toaster.error({ title: "Could not remove deliverable intent" });
    },
  });

  // Update deliverable_status
  const statusMutation = useMutation({
    mutationFn: (deliverable_status: DeliverableStatus) =>
      updateCircleDeliverableIntent(group.slug, { deliverable_status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupsQueryKeys.detail(group.slug) });
      toaster.success({ title: "Status updated" });
    },
    onError: () => {
      toaster.error({ title: "Could not update status" });
    },
  });

  const isBusy = applyMutation.isPending || removeMutation.isPending || statusMutation.isPending;

  return (
    <Box mt={5} pt={5} borderTop="1px solid" borderColor="gray.100">
      <Text fontWeight="medium" fontSize="sm" color="gray.800" mb={1}>
        Deliverable Intent
      </Text>
      <Text fontSize="xs" color="gray.500" mb={3}>
        Track an outcome this circle is working toward — a document, dispatch, or
        finding. Enables status lifecycle (working → complete / tabled).
      </Text>

      {cdi ? (
        <VStack align="stretch" gap={3}>
          <Flex align="center" justify="space-between" gap={3}>
            <Text fontSize="xs" color="gray.500">Type</Text>
            <Text fontSize="sm" fontWeight="medium">
              {DELIVERABLE_TYPE_LABELS[cdi.deliverable_type]}
            </Text>
          </Flex>

          <Flex align="center" justify="space-between" gap={3}>
            <Text fontSize="xs" color="gray.500">Status</Text>
            <NativeSelect.Root size="xs" width="auto" disabled={isBusy}>
              <NativeSelect.Field
                value={cdi.deliverable_status}
                onChange={(e) =>
                  statusMutation.mutate(e.target.value as DeliverableStatus)
                }
              >
                {Object.entries(DELIVERABLE_STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Flex>

          <Flex justify="flex-end">
            <Button
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={() => removeMutation.mutate()}
              loading={removeMutation.isPending}
              disabled={isBusy}
            >
              Remove
            </Button>
          </Flex>
        </VStack>
      ) : (
        <VStack align="stretch" gap={3}>
          <Flex align="center" gap={3}>
            <Text fontSize="xs" color="gray.500" flexShrink={0}>Deliverable type</Text>
            <NativeSelect.Root size="xs" flex="1" disabled={isBusy}>
              <NativeSelect.Field
                value={typeValue}
                onChange={(e) => setTypeValue(e.target.value as DeliverableType)}
              >
                {Object.entries(DELIVERABLE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Flex>
          <Flex justify="flex-end">
            <Button
              size="xs"
              onClick={() => applyMutation.mutate()}
              loading={applyMutation.isPending}
              disabled={isBusy}
            >
              Enable Deliverable Tracking
            </Button>
          </Flex>
        </VStack>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// CircleSettingsPanel
// ---------------------------------------------------------------------------

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

      <DeliverableIntentPanel group={group} />
    </Box>
  );
}
