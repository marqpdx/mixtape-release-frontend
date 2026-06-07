"use client";

export type GroupMemberViewId = "a" | "b" | "c";

export interface GroupMemberViewDefinition {
  id: GroupMemberViewId;
  label: string;
  description: string;
  reference?: boolean;
}

// "C" unifies the prior A/B exploration into a single member view and is now
// the only layout members are routed to (see GroupMemberViewRenderer). A and B
// are kept registered — not deleted — as references should a future redesign
// need them again.
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
    description: "Unified member view — anchored header with calm card structure. Default and only view shown to members.",
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
  return isGroupMemberViewId(value) ? value : "c";
}
