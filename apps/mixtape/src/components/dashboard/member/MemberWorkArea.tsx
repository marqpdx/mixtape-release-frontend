// =====================================================
// MEMBER WORK AREA - Community features & content creation
// =====================================================

// apps/mixtape/src/components/dashboard/member/MemberWorkArea.tsx

import React, { useMemo, useRef } from "react";
import { VStack, Text } from "@chakra-ui/react";
import { WorkAreaProps } from "@components/dashboard/shared/types";
import WorkAreaWrapper from "@components/dashboard/shared/WorkAreaWrapper";

// Import member-specific components
import { useGroups, useUserGroups } from "@mixtape/api/hooks/groups/useGroups";
import GroupsTable from "@components/groups/GroupsTable";
import { UserIdentity } from "@mixtape/core/types/auth";
import MessageCenter from "../sections/MessageCenter";
import GroupCreateWorkArea from "@/components/groups/create/GroupCreateWorkArea";
import MemberProfileEdit from "./MemberProfileEdit";

interface MemberWorkAreaProps extends WorkAreaProps {
  identity: UserIdentity;
}

export default function MemberWorkArea({
  section,
  setActiveSection,
  identity,
}: MemberWorkAreaProps) {

  const { groups, isLoading, error } = useGroups({
    ordering: '-created_at',
    is_active: true
  });

  const { groups: myGroups } = useUserGroups();

  console.log('MemberWorkArea props:', { section, identity });
  console.log('MemberWorkArea groups:', { groups, isLoading, error });

  // Define the permission function
  const canEditGroup = useMemo(() => {
    return (): boolean => {
      // Superusers and staff can edit all groups
      if (identity?.is_superuser || identity?.is_staff) {
        return true;
      }

      // Check if user is admin/steward of this specific group
      // const userMembership = group.memberships?.find(
      //   (membership) => membership.member_data?.id === identity?.id
      // );

      // return userMembership?.role === 'admin' || userMembership?.role === 'steward';
      return true;
    };
  }, [identity]);

  // Add to MemberWorkArea component
  const renderRef = useRef(0);
  renderRef.current++;
  console.log(`🔍 DEBUG: MemberWorkArea render #${renderRef.current}, section: ${section}`);

  // Personal sections
  if (section === "overview") {
    return (
      <></>
      // <PersonalOverview
      //   identity={identity}
      //   groups={groups}
      //   todos={[]}
      //   isAdmin={false}
      //   isSteward={false}
      // />
    );
  }

  // Messages section
  if (section === "messages") {
    return (
      <WorkAreaWrapper>
        <MessageCenter />
      </WorkAreaWrapper>
    );
  }

  // Profile section
  if (section === "profile") {
    return (
      <WorkAreaWrapper>
        <MemberProfileEdit />
      </WorkAreaWrapper>
    );
  }

  // Groups sections
  if (section === "my-groups") {
    return (
      <WorkAreaWrapper>
        <GroupsTable
          groups={myGroups}
          isLoading={isLoading}
          error={error}
          setActiveSection={setActiveSection}
          showCreateButton={true}
          canEditGroup={canEditGroup}
          emptyStateMessage="You haven't joined any groups yet. Create your first group or join existing ones!"
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "create-group") {
    return (
      <WorkAreaWrapper>
        <GroupCreateWorkArea
          onCancel={() => setActiveSection("my-groups")}
          onCreated={() => setActiveSection("my-groups")}
        />
      </WorkAreaWrapper>
    );
  }

  // Default fallback
  return (
    <WorkAreaWrapper>
      <VStack align="stretch" gap={4}>
        <Text fontSize="xl" fontWeight="bold">Section: {section}</Text>
        <Text>This member section is under development.</Text>
      </VStack>
    </WorkAreaWrapper>
  );
}

// // =====================================================
// // MEMBER WORK AREA - Community features & content creation
// // =====================================================

// // apps/mixtape/src/components/dashboard/member/MemberWorkArea.tsx

// import React, { useCallback, useState, useMemo, useRef } from "react";
// import { VStack, Text, Box } from "@chakra-ui/react";
// import { WorkAreaProps } from "@components/dashboard/shared/types";
// import WorkAreaWrapper from "@components/dashboard/shared/WorkAreaWrapper";
// // import { UserIdentity } from "@components/auth/interfaces";

// // Import member-specific components
// // import PersonalOverview from "@components/dashboard/sections/PersonalOverview";
// // import WriteWorkArea from "@components/write/WriteWorkArea";
// // import DraftsAdmin from "@components/writing/DraftsAdmin";
// // import ForumAdmin from "@components/threadworks/ForumAdmin";
// // import { Socket } from "socket.io-client";
// // import GroupCreateForm from "@components/groups/GroupCreateForm";
// // import GroupsTableNew from "@components/groups/GroupsTable";
// import { useGroups, useUserGroups } from "@mixtape/api/hooks/groups/useGroups";
// // import GroupsTable from "@components/groups/GroupsTable";
// // import { Group } from "@components/groups/interfaces";
// import router from "next/router";
// // import MinimalRHFForm from "@components/groups/GroupCreateForm";
// // import { Group } from "content/groupTypes";
// import GroupsTable from "@components/groups/GroupsTable";
// import { Group } from "@mixtape/core/types/groupTypes";
// import { UserIdentity } from "@mixtape/core/types/auth";
// import MessageCenter from "../sections/MessageCenter";
// // import NotificationsList from "@components/activity/NotificationsList";

// interface MemberWorkAreaProps extends WorkAreaProps {
//   identity: UserIdentity;
//   allMembers?: UserIdentity[];
//   // socket?: Socket | null;
//   selectedForumSlug?: string | null;
//   setSelectedForumSlug?: (slug: string | null) => void;
// }

// export default function MemberWorkArea({
//   section,
//   setActiveSection,
//   identity,
//   allMembers = [],
//   socket,
//   selectedForumSlug,
//   setSelectedForumSlug,
// }: MemberWorkAreaProps) {

//   // State for editing specific drafts
//   const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

//   const { groups, isLoading, error, refetch } = useGroups({
//     ordering: '-created_at',
//     is_active: true
//   });

//   const {groups: myGroups, isLoading: myGroupsLoading, error: myGroupsError, refetch: myGroupsRefetch } = useUserGroups();

//   console.log('MemberWorkArea props:', { section, identity, selectedForumSlug });
//   console.log('MemberWorkArea groups:', { groups, isLoading, error });

//   // Define the permission function
//   const canEditGroup = (group: Group): boolean => {
//     // Superusers and staff can edit all groups
//     if (identity?.is_superuser || identity?.is_staff) {
//       return true;
//     }

//     // Check if user is admin/steward of this specific group
//     // const userMembership = group.memberships?.find(
//     //   (membership) => membership.member_data?.id === identity?.id
//     // );

//     // return userMembership?.role === 'admin' || userMembership?.role === 'steward';
//     return true;
//   };

//   // Handle draft selection - switch to edit mode instead of navigating
//   const handleDraftSelect = (draftId: string) => {
//     setEditingDraftId(draftId);
//     setActiveSection('edit-draft');
//   };

//   // Handle going back to drafts list
//   const handleBackToDrafts = () => {
//     setEditingDraftId(null);
//     setActiveSection('my-drafts');
//   };

//   // Handle creating new draft
//   const handleNewDraft = () => {
//     setEditingDraftId(null);
//     setActiveSection('new-post');
//   };

//   // FIXED: Create stable callback functions using useMemo instead of useCallback
//   // This prevents the GroupCreateForm from re-rendering on every keystroke
//   const stableCallbacks = useMemo(() => ({
//     handleGroupSuccess: (slug: string) => {
//       setActiveSection('my-groups');
//       myGroupsRefetch();
//     },
//     handleGroupSuccessAndEdit: (slug: string) => {
//       router.replace(`#`);
//     }
//   }), [setActiveSection]); // Only recreate when setActiveSection changes



//     // Add to MemberWorkArea component
//   const renderRef = useRef(0);
//   renderRef.current++;
//   console.log(`🔍 DEBUG: MemberWorkArea render #${renderRef.current}, section: ${section}`);


//   // Personal sections
//   if (section === "overview") {
//     return (
//       <></>
//       // <PersonalOverview
//       //   identity={identity}
//       //   groups={groups}
//       //   todos={[]}
//       //   isAdmin={false}
//       //   isSteward={false}
//       // />
//     );
//   }

//   // if (section === "profile") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">👤 Profile Settings</Text>
//   //         <Text>Profile management coming soon...</Text>
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // if (section === "preferences") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">⚙️ Preferences</Text>
//   //         <Text>User preferences coming soon...</Text>
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // if (section === "activity") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">📊 Activity Feed</Text>
//   //         {/* <NotificationsList /> */}
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//     // Messages section
//     if (section === "messages") {
//       return (
//         <WorkAreaWrapper>
//           <MessageCenter />
//         </WorkAreaWrapper>
//       );
//     }

//   // **Writing sections**
//   // if (section === "new-post") {
//   //   return <WriteWorkArea onBack={handleBackToDrafts} forceNew={true} />;
//   // }

//   // // New section for editing specific drafts
//   // if (section === "edit-draft") {
//   //   return (
//   //     <WriteWorkArea
//   //       draftId={editingDraftId || undefined}
//   //       onBack={handleBackToDrafts}
//   //     />
//   //   );
//   // }

//   // if (section === "my-drafts") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">📝 My Drafts</Text>
//   //         {/* <DraftsAdmin
//   //           onDraftSelect={handleDraftSelect}
//   //           onNewDraft={handleNewDraft}
//   //         /> */}
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // if (section === "published-posts") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">📄 Published Posts</Text>
//   //         <Text>Published posts management coming soon...</Text>
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // if (section === "writing-tools") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">🔧 Writing Tools</Text>
//   //         <Text>AI writing tools coming soon...</Text>
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // if (section === "templates") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">📋 Templates</Text>
//   //         <Text>Content templates coming soon...</Text>
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // Groups sections
//   if (section === "my-groups") {
//     return (
//       <WorkAreaWrapper>
//         <GroupsTable
//           groups={myGroups}
//           isLoading={isLoading}
//           error={error}
//           setActiveSection={setActiveSection}
//           showCreateButton={true}
//           canEditGroup={(group: Group) => canEditGroup(group)}
//           emptyStateMessage="You haven't joined any groups yet. Create your first group or join existing ones!"
//         />
//       </WorkAreaWrapper>
//     );
//   }

//   if (section === "create-group") {
//     return (
//       <WorkAreaWrapper>
//         <></>
//         {/* <MinimalRHFForm
//           // showCard={false}
//           onSuccess={stableCallbacks.handleGroupSuccess}
//           // onSuccessAndEdit={stableCallbacks.handleGroupSuccessAndEdit}
//         /> */}
//       </WorkAreaWrapper>
//     );
//   }

//   // if (section === "discover-groups") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">🔍 Discover Groups</Text>
//   //         <Text>Group discovery coming soon...</Text>
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // if (section === "group-invites") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">📨 Group Invitations</Text>
//   //         <Text>Group invitations coming soon...</Text>
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // // **EarthLab Learning sections**
//   // if (section === "my-courses") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">🎓 My Courses</Text>
//   //         <Text>Course management coming soon...</Text>
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // if (section === "browse-courses") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">📚 Browse Courses</Text>
//   //         <Text>Course catalog coming soon...</Text>
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // if (section === "achievements") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">🏆 Achievements</Text>
//   //         <Text>Achievement tracking coming soon...</Text>
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // if (section === "learning-path") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">🛤️ Learning Path</Text>
//   //         <Text>Learning paths coming soon...</Text>
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // **Threadworks Forums sections**
//   // if (section === "forums") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">🧵 All Forums</Text>
//   //         {/* <ForumAdmin
//   //           groupId={null}
//   //           onForumSelect={(slug) => {
//   //             setSelectedForumSlug?.(slug);
//   //             setActiveSection('forum-detail');
//   //           }}
//   //         /> */}
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // if (section === "my-forums") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">🧵 My Forums</Text>
//   //         <Text>Your forum memberships coming soon...</Text>
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // if (section === "subscriptions") {
//   //   return (
//   //     <WorkAreaWrapper>
//   //       <VStack align="stretch" gap={4}>
//   //         <Text fontSize="xl" fontWeight="bold">🔔 Forum Subscriptions</Text>
//   //         <Text>Forum subscriptions coming soon...</Text>
//   //       </VStack>
//   //     </WorkAreaWrapper>
//   //   );
//   // }

//   // Default fallback
//   return (
//     <WorkAreaWrapper>
//       <VStack align="stretch" gap={4}>
//         <Text fontSize="xl" fontWeight="bold">Section: {section}</Text>
//         <Text>This member section is under development.</Text>
//       </VStack>
//     </WorkAreaWrapper>
//   );
// }
