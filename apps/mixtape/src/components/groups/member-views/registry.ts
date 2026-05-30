"use client";

export type GroupMemberViewId = "a" | "b";

export interface GroupMemberViewDefinition {
  id: GroupMemberViewId;
  label: string;
  description: string;
  reference?: boolean;
}

export const GROUP_MEMBER_VIEW_DEFINITIONS: GroupMemberViewDefinition[] = [
  {
    id: "a",
    label: "A",
    description: "Classic card-based member view with configurable overview blocks.",
  },
  {
    id: "b",
    label: "B",
    description: "Editorial member view used as the current reference for new skins.",
    reference: true,
  },
];

const GROUP_MEMBER_VIEW_IDS = new Set<GroupMemberViewId>(
  GROUP_MEMBER_VIEW_DEFINITIONS.map((view) => view.id)
);

export function isGroupMemberViewId(value: unknown): value is GroupMemberViewId {
  return typeof value === "string" && GROUP_MEMBER_VIEW_IDS.has(value as GroupMemberViewId);
}

export function normalizeGroupMemberViewId(value: unknown): GroupMemberViewId {
  return isGroupMemberViewId(value) ? value : "a";
}
