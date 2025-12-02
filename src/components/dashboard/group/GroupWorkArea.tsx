// src/components/dashboard/group/GroupWorkArea.tsx

import React, { useMemo, useState } from "react";
import { VStack, Text, Button, useDisclosure } from "@chakra-ui/react";

import { WorkAreaProps } from "@components/dashboard/shared/types";
import WorkAreaWrapper from "@components/dashboard/shared/WorkAreaWrapper";
// import { UserIdentity } from "@components/auth/interfaces";

// Import group-specific components
import GroupOverview from "@components/groups/GroupOverview";
// import CourseForm from "@components/earthlab/CourseForm";
// import GroupInviteWorkArea from "@components/groups/GroupInviteWorkArea";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useMembers } from "@hooks/useMembers";
import { UserIdentity } from "@/types/auth";
import { GroupMemberList } from "@/components/groups/members/GroupMemberList";
import GroupDetailWrapper from "@/components/groups/layout/GroupDetailWrapper";
import GroupInviteWorkArea from "@/components/groups/invitations/GroupInviteWorkArea";
import GroupWritingWrapper from "@/components/groups/writing/GroupWritingWrapper";
import WritingEditorWrapper from "@/components/writing/WritingEditorWrapper";

interface GroupWorkAreaProps extends WorkAreaProps {
  group: any;
  identity: UserIdentity;
  userRole: string;
  setActiveSection: (section: string, params?: Record<string, string>) => void;
}

export default function GroupWorkArea({
  section,
  sectionParams = {},
  setActiveSection,
  group,
  identity,
  userRole,
}: GroupWorkAreaProps) {

  const [selectedForumSlug, setSelectedForumSlug] = useState<string | null>(null);
  const [editingCourseSlug, setEditingCourseSlug] = useState<string | null>(null);

  // const [members, setMembers] = useState<Member[]>(group.members ?? []);

  const composerDisclosure = useDisclosure();
  const [composerPieceId, setComposerPieceId] = useState<string | null>(null);
  const openComposer = (id: string) => { setComposerPieceId(id); composerDisclosure.onOpen(); };

  const { members: groupMembers, isLoading: groupMembersLoading, error, refetch } = useMembers(group.slug);

  const stableMembers = useMemo(() => groupMembers || [], [groupMembers]);

  const router = useRouter();
  const queryClient = useQueryClient();

  // Handler for when a piece is published
  // The mutation already invalidates cache, but this ensures it happens even if called from elsewhere
  const handlePiecePublished = (piece: any) => {
    // Invalidate writing queries to refresh the list
    queryClient.invalidateQueries({
      queryKey: ['writing', 'placements', 'group', group.slug],
    });
    queryClient.invalidateQueries({
      queryKey: ['writing', 'drafts', 'group', group.slug],
    });

    // Navigate to the published piece
    router.push(`/groups/${group.slug}/writing/${piece.slug}`);
  };


  // Dashboard sections
  if (section === "admin-dashboard" || section === "dashboard") {
    return (
      <WorkAreaWrapper>
        <GroupOverview
          group={group}
          userRole={userRole}
          onNavigate={setActiveSection}
        />
      </WorkAreaWrapper>
    );
  }

  // if (section === "activity") {
  //   return (
  //     <WorkAreaWrapper>
  //       <GroupActivityDashboard
  //         group={group}
  //         setActiveSection={setActiveSection}
  //         // setHighlightedMemberId={setHighlightedMemberId}
  //         onViewAll={(sectionKey) => {
  //           setActiveSection(sectionKey);
  //         }}
  //       />
  //     </WorkAreaWrapper>
  //   );
  // }

  // // Communications
  // if (section === "threadworks") {
  //   return (
  //     <ThreadworksWorkArea
  //       section={section}
  //       sectionParams={sectionParams}
  //       setActiveSection={setActiveSection}
  //       groupSlug={group.slug}
  //     />
  //   );
  // }

  // Members sections
  if (section === "members-roles") {
    return (
      <WorkAreaWrapper>
        {/* <GroupMembersAndRoles
          group={group}
          userRole={userRole}
        /> */}

        <GroupMemberList
          group={group}
          members={stableMembers}
          isLoading={groupMembersLoading}
          error={error?.message}
          showPrivateInfo={userRole === "admin"}
          onMemberClick={(membership) => console.log("Member clicked:", membership)}
          canEditMember={(membership) => userRole === "admin"}
        />

      </WorkAreaWrapper>
    );
  }

  if (section === "invitations") {
    // Note: allSiteMembers currently not fetched - GroupInviteForm will fall back to groupMembers
    // TODO: To enable site-wide member search, add:
    // const { data: allProfiles, isLoading: profilesLoading } = useQuery({
    //   queryKey: ['profiles', 'all'],
    //   queryFn: () => fetch('/api/profiles').then(r => r.json())
    // });
    return (
      <WorkAreaWrapper>
        <GroupInviteWorkArea
          groupSlug={group.slug}
          onMembersRefetch={refetch}
          groupMembers={stableMembers}
          allSiteMembers={[]}
          siteMembersLoading={false}
        />
      </WorkAreaWrapper>
    );
  }

  // Writing sections
  if (section === "writing") {
    return (
      <WorkAreaWrapper>
        <GroupWritingWrapper
          groupSlug={group.slug}
          groupId={group.id}
          groupName={group.name}
          setActiveSection={setActiveSection}
          onPublished={(piece) => {
            // Handle the published piece
          }}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "create-writing") {
    return (
      <WorkAreaWrapper>
        <WritingEditorWrapper
          sponsor={{
            type: 'group',
            id: group.id,
            slug: group.slug,
            displayName: group.name
          }}
          writingKind="post"
          // No pieceId = create new piece
          onPublished={handlePiecePublished}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "do-writing") {
    const pieceId = sectionParams?.piece;
    return (
      <WorkAreaWrapper>
        <WritingEditorWrapper
          sponsor={{
            type: 'group',
            id: group.id,
            slug: group.slug,
            displayName: group.name
          }}
          writingKind="post"
          pieceId={pieceId} // Pass the existing piece slug to edit
          onPublished={handlePiecePublished}
        />
      </WorkAreaWrapper>
    );
  }


  // // Events
  // if (section === "events-landing") {
  //   return (
  //     <WorkAreaWrapper>
  //       <Text>dkdkd</Text>
  //     </WorkAreaWrapper>
  //   );
  // }

  // // Events 2
  // if (section === "events-2") {
  //   return (
  //     <WorkAreaWrapper>
  //       <GroupEventsWorkArea groupSlug={group.slug} />
  //     </WorkAreaWrapper>
  //   );
  // }

  // if (section === "create-event") {
  //   return (
  //     <WorkAreaWrapper>
  //       <GroupEventCreateWorkArea groupSlug={group.slug} />
  //     </WorkAreaWrapper>
  //   );
  // }

  // // EarthLab sections
  // // Update the CourseList import and usage in GroupWorkArea.tsx
  // if (section === "earthlab") {
  //   return (
  //     <WorkAreaWrapper>
  //       <EarthLabWorkArea
  //         groupSlug={group.slug}
  //         setActiveSection={setActiveSection}
  //       />
  //     </WorkAreaWrapper>
  //   );
  // }

  // if (section === "course-detail") {
  //   const courseIdToEdit = sectionParams?.courseId;
  //   return (
  //     <CourseDetailsWorkArea
  //       groupSlug={group.slug}
  //       courseIdToEdit={courseIdToEdit}
  //       onBack={() => setActiveSection("earthlab")}
  //     />
  //   );
  // }

  // Settings sections

  if (section === "edit-group") {
    return (
      <WorkAreaWrapper>
        <GroupDetailWrapper
          slug={group.slug}
          onSuccess={() => {
            router.push(`/groups/${group.slug}`);
          }}
        />
      </WorkAreaWrapper>
    );
  }


  // if (section === "group-details") {
  //   return (
  //     <WorkAreaWrapper>
  //       <VStack align="stretch" gap={4}>
  //         <Text fontSize="xl" fontWeight="bold">Group Details</Text>
  //         <Text>Group settings coming soon...</Text>
  //       </VStack>
  //     </WorkAreaWrapper>
  //   );
  // }

  // Default fallback
  return (
    <WorkAreaWrapper>
      <VStack align="stretch" gap={4}>
        <Text fontSize="xl" fontWeight="bold">Section: {section}</Text>
        <Text>This group section is under under development.</Text>
      </VStack>
    </WorkAreaWrapper>
  );
}