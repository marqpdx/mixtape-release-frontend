// apps/mixtape/src/components/groups/create/GroupCreateWorkArea.tsx

"use client";

import { VStack, Button, HStack } from "@chakra-ui/react";
import GroupCreateForm2 from "@/components/groups/create/GroupCreateForm2";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toaster } from "@mixtape/core/lib/toaster";
import type { GroupCreateFormData, GroupCreateFormValues } from "@mixtape/core/types/groupTypes";
import * as groupApi from "@mixtape/api/clients/group/groupApi";
import { groupsQueryKeys } from "@mixtape/api/hooks/groups/useGroups";

function toIsoOrNull(d?: Date | null): string | null | undefined {
  if (d === undefined) return undefined;
  if (d === null) return null;
  return d.toISOString();
}

interface GroupCreateWorkAreaProps {
  onCreated?: (slug: string) => void;
  onCancel?: () => void;
}

export default function GroupCreateWorkArea({ onCreated, onCancel }: GroupCreateWorkAreaProps) {
  const router = useRouter();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: GroupCreateFormData) => groupApi.createGroup(payload),
    onSuccess: (group) => {
      toaster.create({
        title: "Group created",
        description: "Your group is ready.",
        type: "success",
      });

      qc.invalidateQueries({ queryKey: groupsQueryKeys.lists() });
      qc.invalidateQueries({ queryKey: groupsQueryKeys.userGroups() });

      if (group?.slug) {
        onCreated?.(group.slug);
      }
    },
    onError: (error) => {
      const detail =
        error && typeof error === "object"
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toaster.create({
        title: "Create failed",
        description: detail ?? "Could not create the group.",
        type: "error",
      });
    },
  });

  const handleSubmit = async (values: GroupCreateFormValues) => {
    const { start_date, end_date, ...rest } = values;

    const payload: GroupCreateFormData = {
      ...rest,
      start_date: toIsoOrNull(start_date),
      end_date: toIsoOrNull(end_date),
    };

    const group = await mutation.mutateAsync(payload);
    if (group?.slug) {
      toaster.create({
        title: "Group created",
        description: "Ready to start building?",
        type: "success",
        action: {
          label: "View group",
          onClick: () => router.push(`/groups/${group.slug}?view=member`),
        },
      });
      onCreated?.(group.slug);
    }
  };

  return (
    <VStack align="stretch" gap={6}>
      <HStack>
        <Button variant="outline" onClick={onCancel}>
          Back
        </Button>
      </HStack>

      <GroupCreateForm2
        title="Create a Group"
        submitLabel="Create Group"
        onSubmit={handleSubmit}
        isSubmittingExternal={mutation.status === "pending"}
        showCard={true}
      />
    </VStack>
  );
}
