"use client";

export type GroupMemberViewId = "a" | "b" | "c" | "d";

export interface GroupMemberViewDefinition {
  id: GroupMemberViewId;
  label: string;
  description: string;
  reference?: boolean;
}

// "D" is the current live member view — left-nav layout per design handoff GroupLeftNav.zip.
// A, B, C are kept registered as references; only D is shown to members.
export const GROUP_MEMBER_VIEW_DEFINITIONS: GroupMemberViewDefinition[] = [
  {
    id: "a",
    label: "A",
    description: "Classic card-based member view with configurable overview blocks.",
  },
  {
    id: "b",
    label: "B",
    description: "Editorial member view explored as a reference for new skins.",
  },
  {
    id: "c",
    label: "C",
    description: "Unified member view — anchored header with calm card structure.",
  },
  {
    id: "d",
    label: "D",
    description: "Left-nav layout — compact header, three-section navigation, contextual right rail. Default live view.",
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
  return isGroupMemberViewId(value) ? value : "d";
}
