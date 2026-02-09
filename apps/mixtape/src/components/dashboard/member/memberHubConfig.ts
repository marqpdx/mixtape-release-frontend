// apps/mixtape/src/components/dashboard/member/memberHubConfig.ts

import { MenuItem } from "@components/dashboard/shared/types";

export const MEMBER_HUB_MENU_ITEMS: MenuItem[] = [
  {
    key: "about",
    label: "About",
    icon: "👤",
    subItems: [
      { key: "overview", label: "Overview", hidden: false },
      { key: "profile", label: "Profile", hidden: false },
    ],
  },
  {
    key: "writing",
    label: "Writing",
    icon: "📝",
    subItems: [
      { key: "write", label: "Journal", hidden: false },
      { key: "writing", label: "Pieces", hidden: false },
    ],
  },
  {
    key: "tools",
    label: "Tools",
    icon: "🧰",
    subItems: [
      { key: "lists", label: "Lists", hidden: false },
      { key: "todos", label: "ToDos", hidden: false },
    ],
  },
  {
    key: "settings",
    label: "Setings",
    icon: "🧰",
    subItems: [
      { key: "edit-profile", label: "Edit Profile", hidden: false },
      // { key: "todos", label: "ToDos", hidden: false },
    ],
  },
];

export const MEMBER_HUB_CONFIG = {
  title: "My Crossroads",
  menuItems: MEMBER_HUB_MENU_ITEMS,
  defaultSection: "overview",
  localStorageKey: "memberHub",
};
