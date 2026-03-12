// apps/mixtape/src/components/dashboard/member/memberConfig.ts

import { MenuItem } from "@components/dashboard/shared/types";

/**
 * MEMBER DASHBOARD MENU CONFIGURATION
 *
 * 📋 TO ADD NEW MENU ITEMS:
 * 1. Add to the appropriate section's subItems array
 * 2. Set hidden: true if the item shouldn't appear in navigation
 * 3. Follow the MenuItem interface structure
 *
 * 🎯 MENU ITEM STRUCTURE:
 * {
 *   key: "section-key",           // Used for routing/localStorage
 *   label: "Display Name",        // Shown in UI
 *   icon: "🎯",                  // Optional emoji icon
 *   hidden: true,                // Optional: hide from menu
 *   subItems: [...]              // Optional: nested menu items
 * }
 */

export const MEMBER_MENU_ITEMS: MenuItem[] = [
  {
    key: "personal",
    label: "Personal",
    icon: "👤",
    subItems: [
      { key: "overview", label: "Overview", hidden: false },
      { key: "messages", label: "Messages", hidden: false },
      { key: "profile", label: "Edit Profile", hidden: false },
      { key: "preferences", label: "Preferences", hidden: true },
      { key: "activity", label: "Activity Feed", hidden: true },
    ]
  },
  {
    key: "writing",
    label: "Writing",
    icon: "📝",
    subItems: [
      { key: "writing", label: "My Writing", hidden: false },
      { key: "draft-room", label: "Draft Room", hidden: false },
      { key: "draft-room-v2", label: "Draft Room V2", hidden: false },
      { key: "write", label: "Write", hidden: false },
      { key: "seeds", label: "Seeds", hidden: false },
      { key: "import-document", label: "Import Document", hidden: false },
      { key: "mill", label: "Grist Mill", hidden: false },
      { key: "new-post", label: "New Post", hidden: true },
      { key: "my-drafts", label: "My Drafts", hidden: true },
      { key: "published-posts", label: "Published Posts", hidden: true },
      { key: "writing-tools", label: "Writing Tools", hidden: true },
      { key: "templates", label: "Templates", hidden: true },
    ]
  },
  {
    key: "groups",
    label: "Groups",
    icon: "👥",
    subItems: [
      { key: "my-groups", label: "My Groups" },
      { key: "create-group", label: "Create Group", adminOnly: true },
      { key: "discover-groups", label: "Discover", hidden: true},
      { key: "group-invites", label: "Invitations", hidden: true },

    ]
  },
  {
    key: "learning",
    label: "EarthLab",
    icon: "🌱",
    subItems: [
      { key: "my-courses", label: "My Courses", hidden: true },
      { key: "browse-courses", label: "Browse Courses", hidden: true },
      { key: "achievements", label: "Achievements", hidden: true },
      { key: "learning-path", label: "Learning Path", hidden: true },
    ]
  },
  {
    key: "threadworks",
    label: "Threadworks",
    icon: "🧵",
    subItems: [
      { key: "forums", label: "All Forums", hidden: true },
      { key: "my-forums", label: "My Forums", hidden: true },
      { key: "subscriptions", label: "Subscriptions", hidden: true },
      { key: "forum-detail", label: "Forum Detail", hidden: true }, // Hidden from menu
    ]
  },
  {
    key: "bazaar",
    label: "Bazaar",
    icon: "🏪",
    subItems: [
      { key: "bazaar-overview", label: "Bazaar Overview", adminOnly: true },
      { key: "bazaar-products", label: "My Products", hidden: true },
      { key: "bazaar-offerings", label: "My Offerings", hidden: true },
      { key: "bazaar-orders", label: "My Purchases", hidden: true },
    ]
  }
];

export const MEMBER_DASHBOARD_CONFIG = {
  title: "Community Dashboard",
  menuItems: MEMBER_MENU_ITEMS,
  defaultSection: "overview",
  localStorageKey: "memberDashboard"
};

/**
 * 🔄 EVOLUTION EXAMPLES:
 *
 * Adding a new "Marketplace" section:
 *
 * export const MEMBER_MENU_ITEMS: MenuItem[] = [
 *   // ... existing items ...
 *   {
 *     key: "marketplace",
 *     label: "Marketplace",
 *     icon: "🛒",
 *     subItems: [
 *       { key: "browse-items", label: "Browse" },
 *       { key: "my-listings", label: "My Listings" },
 *       { key: "sell-item", label: "Sell Item" },
 *       { key: "purchase-history", label: "Purchase History" },
 *     ]
 *   }
 * ];
 *
 * Then add the corresponding sections in MemberWorkArea.tsx:
 *
 * if (section === "browse-items") {
 *   return (
 *     <WorkAreaWrapper>
 *       <VStack align="stretch" gap={4}>
 *         <Text fontSize="xl" fontWeight="bold">🛒 Browse Marketplace</Text>
 *         <MarketplaceBrowser />
 *       </VStack>
 *     </WorkAreaWrapper>
 *   );
 * }
 */
