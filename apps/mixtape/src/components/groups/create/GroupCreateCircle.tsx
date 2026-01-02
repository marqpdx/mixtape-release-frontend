// src/components/groups/create/GroupCreateCircle.tsx

"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toaster } from "@mixtape/core/lib/toaster";
import GroupCreateForm2 from "./GroupCreateForm2";
import * as groupApi from "@mixtape/api/clients/group/groupApi";
import type { GroupCreateFormData, GroupCreateFormValues } from "@mixtape/core/types/groupTypes";
import { groupsQueryKeys } from "@mixtape/api/hooks/groups/useGroups";

function toIsoOrNull(d?: Date | null): string | null | undefined {
  if (d === undefined) return undefined;
  if (d === null) return null;
  return d.toISOString();
}

interface GroupCreateCircleProps {
  sponsorGroupSlug: string; // the Community slug sponsoring the Circle
  onCreated?: (slug: string) => void;
}

export default function GroupCreateCircle({ sponsorGroupSlug, onCreated }: GroupCreateCircleProps) {
  const router = useRouter();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: GroupCreateFormData) => groupApi.createGroupCircle(sponsorGroupSlug, payload),
    onSuccess: (group) => {
      toaster.create({
        title: "Circle created",
        description: "Your circle is ready.",
        type: "success",
      });

      // Invalidate relevant caches
      qc.invalidateQueries({ queryKey: groupsQueryKeys.lists() });
      qc.invalidateQueries({ queryKey: groupsQueryKeys.userGroups() });
      // If you add a circles query key later, invalidate that too.

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
        description: detail ?? "Could not create the circle.",
        type: "error",
      });
    },
  });

  const handleSubmit = async (values: GroupCreateFormValues) => {
    const { start_date, end_date, ...rest } = values;

    const payload: GroupCreateFormData = {
      ...rest,
      group_type: "circle",
      start_date: toIsoOrNull(start_date),
      end_date: toIsoOrNull(end_date),
    };

    const group = await mutation.mutateAsync(payload);

    // Default navigation: back to circles landing, or to new circle page if you have it
    if (group?.slug) {
      router.push(`/groups/${sponsorGroupSlug}?section=circles-landing`);
    }
  };

  return (
    <GroupCreateForm2
      title="Create a Circle"
      submitLabel="Create Circle"
      lockedGroupType="circle"
      onSubmit={handleSubmit}
      isSubmittingExternal={mutation.status === "pending"}
      showCard={true}
    />
  );
}
