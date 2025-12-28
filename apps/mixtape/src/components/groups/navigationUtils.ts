// src/components/groups/navigationUtils.ts

import { MenuItem } from "@components/dashboard/shared/types";

export function generateSectionParentMap(menuItems: MenuItem[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const parent of menuItems) {
    if (parent.subItems && Array.isArray(parent.subItems)) {
      for (const child of parent.subItems) {
        map[child.key] = parent.key;
      }
    }
  }

  return map;
}

export function openParentForSection(
  sectionKey: string,
  setOpenSections: (update: (prev: Record<string, boolean>) => Record<string, boolean>) => void,
  menuItems: MenuItem[]
) {
  const sectionParentMap = generateSectionParentMap(menuItems);
  const parentKey = sectionParentMap[sectionKey];

  if (parentKey) {
    setOpenSections((prev) => ({
      ...prev,
      [parentKey]: true,
    }));
  }
}