// src/components/groups/groupMenu.ts

export type Role = "admin" | "steward" | "member";

export interface MenuItem {
  key: string;
  label: string;
  minRole: Role;
  hidden?: boolean; // Use this to hide items without removing them from the array
  exclude?: Role[];
  group?: string;
  open?: boolean;
  subItems?: MenuItem[];
}

export const GROUP_MENU_ITEMS: MenuItem[] = [
  {
    key: "dashboard",
    label: "Dashboard!!!",
    minRole: "member",
    open: true,
    subItems: [
      {
        key: "recentActivity",
        label: "Recent Activity",
        minRole: "member",
      },
      {
        key: "preview",
        label: "Preview Site",
        minRole: "member",
        hidden: true,
      },
      {
        key: "groupMessages",
        label: "Recent Group Messages",
        minRole: "member",
        hidden: true,
      },
      {
        key: "analytics",
        label: "Analytics",
        minRole: "admin",
        hidden: true,
      },
    ],
  },
  {
    key: "settings",
    label: "Group Settings",
    minRole: "steward",
    subItems: [
      {
        key: "editGroupDetails",
        label: "Edit Group Details",
        minRole: "steward",
      },
      {
        key: "groupAssets",
        label: "Group Files",
        minRole: "steward",
      },
      {
        key: "groupPostList",
        label: "Group Posts",
        minRole: "steward",
      },
      {
        key: "editDescription",
        label: "Edit Description",
        minRole: "steward",
        hidden: true, // Hide this in the menu, but allow access via URL
      },
      {
        key: "changeVisibility",
        label: "Change Visibility",
        minRole: "admin",
      },
      {
        key: "archiveDelete",
        label: "Archive/Delete Group",
        minRole: "admin",
        hidden: true,
      },
      {
        key: "manageFaq",
        label: "Manage FAQ/Knowledge Base",
        minRole: "steward",
        hidden: true,
      },
      {
        key: "linkGroups",
        label: "Link Related Groups",
        minRole: "steward",
        hidden: true,
      },
    ],
  },
  {
    key: "communications",
    label: "Communications",
    minRole: "steward",
    subItems: [
      {
        key: "lanternMail",
        label: "Lantern Mail",
        minRole: "steward",
      },
      {
        key: "createLanternList",
        label: "Create Lantern List",
        minRole: "steward",
      },
      // (later: announcements, digests)
    ]
  },
  {
    key: "threadworks",
    label: "Threadworks",
    minRole: "steward",
    subItems: [
      {
        key: "forumCreate",
        label: "Create Forum",
        minRole: "steward",
      },
      {
        key: "forums",
        label: "Group Forums",
        minRole: "steward",
        hidden: false, // Hide this in the menu, but allow access via URL
      },
      {
        key: "forumDetail",
        label: "Forum Detail",
        minRole: "steward",
        // hidden: true,
      },

      // (later: announcements, digests)
    ]
  },


{
    key: "almanac",
    label: "Events & Almanac",
    minRole: "steward",
    subItems: [
      {
        key: "events",
        label: "Events",
        minRole: "steward",
      },
      {
        key: "eventCreate",
        label: "Create Event",
        minRole: "steward",
        hidden: false, // Hide this in the menu, but allow access via URL
      },
      // {
      //   key: "forum_detail",
      //   label: "Forum Detail",
      //   minRole: "steward",
      //   // hidden: true,
      // },

      // (later: announcements, digests)
    ]
  },

  {
    key: "members",
    label: "Members",
    minRole: "steward",
    // hidden: true,
    subItems: [
      {
        key: "membersAndRoles",
        label: "Members & Roles",
        minRole: "steward",
      },
      {
        key: "groupInvitations",
        label: "Invitations",
        minRole: "steward",
      },
      {
        key: "memberEvict",
        label: "Evict or Ban Members",
        minRole: "steward",
        hidden: true,
      },
      {
        key: "memberRoles",
        label: "Manage Member Roles",
        minRole: "admin",
        hidden: true,
      },
      {
        key: "messageMembers",
        label: "Message Members",
        minRole: "steward",
        hidden: true,
      },
      {
        key: "defaultNotifications",
        label: "Default Notifications",
        minRole: "steward",
        hidden: true,
      },
      {
        key: "stewardTraining",
        label: "Steward Training",
        minRole: "steward",
        exclude: ["admin", "member"],
      },
    ],
  },
  {
    key: "posts",
    label: "Posts & Content",
    minRole: "steward",
    hidden: true,
    subItems: [
      {
        key: "createPost",
        label: "Create Post",
        minRole: "steward",
      },
      {
        key: "editPost",
        label: "Edit/Delete Posts",
        minRole: "steward",
      },
      {
        key: "pinPosts",
        label: "Pin Posts/Documents",
        minRole: "steward",
      },
      {
        key: "uploadDocs",
        label: "Upload Documents",
        minRole: "steward",
      },
      {
        key: "manageTags",
        label: "Manage Tags/Categories",
        minRole: "steward",
      },
      {
        key: "crossPost",
        label: "Cross-post Content",
        minRole: "steward",
      },
    ],
  },
  {
    key: "images",
    label: "Images & Media",
    minRole: "steward",
    hidden: true,
    subItems: [
      {
        key: "uploadProfileImage",
        label: "Upload Profile Image",
        minRole: "steward",
      },
      {
        key: "uploadBannerImage",
        label: "Upload Banner Image",
        minRole: "steward",
      },
      {
        key: "mediaLibrary",
        label: "Manage Media Library",
        minRole: "steward",
      },
    ],
  },
  {
    key: "events",
    label: "Events & Calendar",
    minRole: "steward",
    hidden: true,
    subItems: [
      {
        key: "createEvent",
        label: "Create Event",
        minRole: "steward",
      },
      {
        key: "moderateEvents",
        label: "Moderate Event Submissions",
        minRole: "steward",
      },
      {
        key: "rsvpEvents",
        label: "RSVP to Events",
        minRole: "member",
      },
    ],
  },
  {
    key: "chat",
    label: "Messaging & Chat",
    minRole: "member",
    hidden: true,
    subItems: [
      {
        key: "groupChat",
        label: "Group Chat",
        minRole: "member",
      },
      {
        key: "subChats",
        label: "Sub-Chats by Topic",
        minRole: "member",
      },
      {
        key: "moderateChat",
        label: "Moderate Chat",
        minRole: "steward",
      },
      {
        key: "messageMembersDirectly",
        label: "Direct Message Members",
        minRole: "member",
      },
    ],
  },
  {
    key: "advanced",
    label: "Advanced Tools",
    minRole: "admin",
    subItems: [
      {
        key: "revisionMonitoring",
        label: "Revision Monitoring / Approval",
        minRole: "admin",
      },
    ],
  },
];

// export const GROUP_MENU_ITEMS: MenuItem[] = [
//   {
//     key: "preview",
//     label: "Preview Site",
//     minRole: "member",
//     group: "Dashboard",
//   },
//   {
//     key: "members",
//     label: "Members",
//     minRole: "steward",
//     group: "Members & Roles",
//   },
//   {
//     key: "invite",
//     label: "Invite Members",
//     minRole: "steward",
//     group: "Members & Roles",
//   },
//   {
//     key: "posts",
//     label: "Add Group Post",
//     minRole: "steward",
//     group: "Posts & Content",
//   },
//   {
//     key: "edit",
//     label: "Edit Group",
//     minRole: "admin",
//     group: "Group Settings",
//   },
//   {
//     key: "analytics",
//     label: "Analytics",
//     minRole: "admin",
//     group: "Analytics & Insights",
//   },
//   {
//     key: "settings",
//     label: "Settings",
//     minRole: "admin",
//     group: "Group Settings",
//   },
//   {
//     key: "events",
//     label: "Events & Calendar",
//     minRole: "steward",
//     group: "Events & Calendar",
//   },
//   {
//     key: "chat",
//     label: "Group Chat",
//     minRole: "member",
//     group: "Messaging & Chat",
//   },
//   {
//     key: "stewardTraining",
//     label: "Steward Training",
//     minRole: "steward",
//     exclude: ["admin", "member"], // example of an explicit exclusion
//     group: "Training & Onboarding",
//   },
// ];
