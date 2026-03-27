// apps/mixtape/src/components/dashboard/group/GroupWorkArea.tsx

import React, { useMemo } from "react";
import { VStack, Text, Spinner, Box, Heading } from "@chakra-ui/react";

import { WorkAreaProps } from "@components/dashboard/shared/types";
import WorkAreaWrapper from "@components/dashboard/shared/WorkAreaWrapper";

// Import group-specific components
import GroupOverview from "@components/groups/GroupOverview";
import { useGroupPermissions } from "@mixtape/api/hooks/groups/useGroupSectionPermissions";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { GroupMemberList } from "@/components/groups/members/GroupMemberList";
import GroupDetailWrapper from "@/components/groups/layout/GroupDetailWrapper";
import GroupInviteWorkArea from "@/components/groups/invitations/GroupInviteWorkArea";
import CoalitionInviteWorkArea from "@/components/groups/coalitions/CoalitionInviteWorkArea";
import SponsorWritingWrapper from "@/components/writing/SponsorWritingWrapper";
import WritingEditorWrapper from "@/components/writing/WritingEditorWrapper";
import GroupPermissionsWorkArea from "@/components/groups/permissions/GroupPermissionsWorkArea";
import { Group } from "@mixtape/core/types/groupTypes";
import { WritingPiece } from "@mixtape/core/types/writingTypes";
import ThreadworksWorkArea from "@/components/threadworks/ThreadworksWorkArea";
import { AlmanacWorkArea } from "@/components/almanac";
import { MillWorkArea } from "@/components/gristmill/MillWorkArea";
import { GroupCirclesWorkArea } from "@/components/circles/GroupCirclesWorkArea";
import { GroupCircleCreateWorkArea } from "@/components/groups/circles/GroupCircleCreateWorkArea";
import LanternmailWorkArea from "@/components/lanternmail/LanternmailWorkArea";
import LanternmailCreateListWorkArea from "@/components/lanternmail/LanternmailCreateListWorkArea";
import LanternmailCampaignWorkArea from "@/components/lanternmail/LanternmailCampaignWorkArea";
import { StackroomWorkArea } from "@/components/stackroom/StackroomWorkArea";
import { useMembers } from "@mixtape/api/hooks";
import ProjectsWorkArea from "@/components/projects/ProjectsWorkArea";
import { CollectionsWorkArea, CollectionDetailWorkArea } from "@/components/collections";
import ThemeWorkArea from "@/components/groups/themes/ThemeWorkArea";
import AudioWorkArea from "@/components/concord/AudioWorkArea";
import ProductsWorkArea from "@/components/bazaar/products/ProductsWorkArea";
import OfferingsWorkArea from "@/components/bazaar/offerings/OfferingsWorkArea";
import { EarthLabWorkArea } from "@/components/earthlab/EarthLabWorkArea";
import DocumentImportWorkArea from "@/components/writing/import/DocumentImportWorkArea";
import BroadcastWorkArea from "@/components/broadcast/BroadcastWorkArea";
import InitiativesWorkArea from "@/components/initiatives/InitiativesWorkArea";
import WorkbenchCurationWorkArea from "@/components/workbench/WorkbenchCurationWorkArea";

interface GroupWorkAreaProps extends WorkAreaProps {
  group: Group;
  userRole: string;
  setActiveSection: (section: string, params?: Record<string, string>) => void;
}

export default function GroupWorkArea({
  section,
  sectionParams = {},
  setActiveSection,
  group,
  userRole,
}: GroupWorkAreaProps) {

  const { members: groupMembers, isLoading: groupMembersLoading, error, refetch } = useMembers(group.slug);

  // For circles, fetch parent group members for invitation restrictions
  const isCircle = group.group_type === 'circle';
  const parentGroupSlug = group.sponsor_group?.slug;
  const { members: parentMembers } = useMembers(isCircle && parentGroupSlug ? parentGroupSlug : null);

  const stableMembers = useMemo(() => groupMembers || [], [groupMembers]);

  // For circles, use parent members as the invitation pool; otherwise use current group members
  const invitationPool = useMemo(() => {
    if (isCircle && parentMembers) {
      return parentMembers;
    }
    return stableMembers;
  }, [isCircle, parentMembers, stableMembers]);

  const router = useRouter();
  const queryClient = useQueryClient();

  // Check section permissions
  const { canAccessSection, isLoading: permissionsLoading, isAdmin, isSteward } = useGroupPermissions(group.slug);
  const hasAccess = canAccessSection(section);

  // Show loading state while checking permissions
  if (permissionsLoading) {
    return (
      <WorkAreaWrapper>
        <Box textAlign="center" py={10}>
          <Spinner size="lg" />
          <Text mt={4} color="gray.500">
            Loading permissions...
          </Text>
        </Box>
      </WorkAreaWrapper>
    );
  }

  // Block access if user doesn't have permission
  if (!hasAccess) {
    return (
      <WorkAreaWrapper>
        <Box textAlign="center" py={10}>
          <Heading size="lg" mb={4} color="red.500">
            Access Denied
          </Heading>
          <Text color="gray.600" mb={6}>
            You don't have permission to access this section.
          </Text>
          <Text fontSize="sm" color="gray.500">
            {isAdmin ? 'Admins have full access.' : isSteward ? 'You need specific permissions to access this area.' : 'You must be a steward to access group management.'}
          </Text>
        </Box>
      </WorkAreaWrapper>
    );
  }

  // Handler for when a piece is published
  // The mutation already invalidates cache, but this ensures it happens even if called from elsewhere
  const handlePiecePublished = (piece: WritingPiece) => {
    // Invalidate writing queries to refresh the list
    queryClient.invalidateQueries({
      queryKey: ['writing', 'placements', 'group', group.slug],
    });
    queryClient.invalidateQueries({
      queryKey: ['writing', 'drafts', 'group', group.slug],
    });

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(`group-${group.slug}-dashboard`, "writing");
        window.localStorage.setItem("writing_active_tab", "published");
      } catch (error) {
        console.warn("Failed to persist writing section:", error);
      }
    }

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

  if (section === "stewards-permissions") {
    return (
      <WorkAreaWrapper>
        <GroupPermissionsWorkArea groupSlug={group.slug} groupId={group.id} groupTitle={group.title} />
      </WorkAreaWrapper>
    );
  }

  if (section === "threadworks-landing") {
    return (
      <WorkAreaWrapper>
        <ThreadworksWorkArea
          section={section}
          sectionParams={sectionParams}
          setActiveSection={setActiveSection}
          groupSlug={group.slug}
        />
      </WorkAreaWrapper>
    );
  }

  // Almanac (Events & Gatherings)
  if (section === "almanac-landing") {
    return (
      <WorkAreaWrapper>
        <AlmanacWorkArea
          section={section}
          sectionParams={sectionParams}
          setActiveSection={setActiveSection}
          groupSlug={group.slug}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "projects") {
    return (
      <WorkAreaWrapper>
        <ProjectsWorkArea
          groupId={group.id}
          groupSlug={group.slug}
          groupTitle={group.title}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "theme-library") {
    return (
      <WorkAreaWrapper>
        <ThemeWorkArea groupId={group.id} groupSlug={group.slug} groupTitle={group.title} />
      </WorkAreaWrapper>
    );
  }

  // Grist Mill (Content Creation)
  if (section === "mill") {
    return (
      <WorkAreaWrapper>
        <MillWorkArea sponsor={{ type: 'group', slug: group.slug }} />
      </WorkAreaWrapper>
    );
  }

  // Stackroom (Document Libraries)
  if (section === "stackroom-landing") {
    return (
      <WorkAreaWrapper>
        <StackroomWorkArea
          sponsor={{
            type: 'group',
            id: group.id,
            slug: group.slug,
            displayName: group.title
          }}
        />
      </WorkAreaWrapper>
    );
  }

  // Collections (User-friendly curated content)
  if (section === "collections-landing") {
    return (
      <WorkAreaWrapper>
        <CollectionsWorkArea
          sponsor={{
            type: 'group',
            id: group.id,
            slug: group.slug,
            displayName: group.title
          }}
          onNavigateToCollection={(collectionId) => {
            setActiveSection('collection-detail', { collectionId });
          }}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "collection-detail") {
    const collectionId = sectionParams?.collectionId;
    if (!collectionId) {
      return (
        <WorkAreaWrapper>
          <Text color="red.500">Collection ID is required</Text>
        </WorkAreaWrapper>
      );
    }

    return (
      <WorkAreaWrapper>
        <CollectionDetailWorkArea
          collectionId={collectionId}
          onBack={() => setActiveSection('collections-landing')}
        />
      </WorkAreaWrapper>
    );
  }

  // Audio (Concord - Transcription & Interpretation)
  if (section === "audio-landing") {
    return (
      <WorkAreaWrapper>
        <AudioWorkArea
          groupSlug={group.slug}
          groupTitle={group.title}
        />
      </WorkAreaWrapper>
    );
  }

  // Bazaar - Products
  if (section === "bazaar-products") {
    return (
      <WorkAreaWrapper>
        <ProductsWorkArea
          sponsorType="group"
          sponsorId={group.id}
          sponsorTitle={group.title}
        />
      </WorkAreaWrapper>
    );
  }

  // Bazaar - Offerings
  if (section === "bazaar-offerings") {
    return (
      <WorkAreaWrapper>
        <OfferingsWorkArea
          sponsorType="group"
          sponsorId={group.id}
          sponsorTitle={group.title}
        />
      </WorkAreaWrapper>
    );
  }

  // EarthLab (Courses & Lessons)
  if (section === "earthlab-landing") {
    return (
      <WorkAreaWrapper>
        <EarthLabWorkArea groupSlug={group.slug} />
      </WorkAreaWrapper>
    );
  }

  if (section === "circles-landing") {
    return (
      <WorkAreaWrapper>
        <GroupCirclesWorkArea groupSlug={group.slug} />
      </WorkAreaWrapper>
    );
  }

  if (section === "circle-create") {
    return (
      <WorkAreaWrapper>
        <GroupCircleCreateWorkArea
          groupSlug={group.slug}
          setActiveSection={setActiveSection}
        />
      </WorkAreaWrapper>
    );
  }


  // Initiatives
  if (section === "initiatives-landing") {
    return (
      <WorkAreaWrapper>
        <InitiativesWorkArea groupSlug={group.slug} />
      </WorkAreaWrapper>
    );
  }

  // Curation Workbench
  if (section === "workbench-curation") {
    return (
      <WorkAreaWrapper>
        <WorkbenchCurationWorkArea
          groupSlug={group.slug}
          groupId={group.id}
          groupTitle={group.title}
        />
      </WorkAreaWrapper>
    );
  }

  // Members sections
  if (section === "members-roles") {
    const canModerate = userRole === "admin" || userRole === "member"; // "member" here means steward viewing dashboard
    return (
      <WorkAreaWrapper>
        <GroupMemberList
          group={group}
          members={stableMembers}
          isLoading={groupMembersLoading}
          error={error?.message}
          showPrivateInfo={userRole === "admin"}
          onMemberClick={() => {}}
          canEditMember={() => canModerate}
        />
      </WorkAreaWrapper>
    );
  }

  // Member Permissions (Admin only)
  if (section === "members-permissions") {
    return (
      <WorkAreaWrapper>
        <GroupPermissionsWorkArea
          groupSlug={group.slug}
          groupId={group.id}
          groupTitle={group.title}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "invitations") {
    // For circles: restrict invitations to parent group members only
    // For communities: use all group members (could be expanded to site-wide in future)
    return (
      <WorkAreaWrapper>
        <GroupInviteWorkArea
          groupSlug={group.slug}
          onMembersRefetch={refetch}
          groupMembers={invitationPool}
          allSiteMembers={[]}
          siteMembersLoading={false}
          parentGroupName={isCircle && group.sponsor_group ? group.sponsor_group.title : undefined}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "coalition-invitations") {
    return (
      <WorkAreaWrapper>
        <CoalitionInviteWorkArea group={group} />
      </WorkAreaWrapper>
    );
  }

  // Writing sections
  if (section === "writing") {
    return (
      <WorkAreaWrapper>
        <SponsorWritingWrapper
          sponsor={{
            type: "group",
            slug: group.slug,
            displayName: group.title,
          }}
          setActiveSection={setActiveSection}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "write") {
    const pieceId = sectionParams?.piece;
    return (
      <WorkAreaWrapper>
        <WritingEditorWrapper
          sponsor={{
            type: 'group',
            id: group.id,
            slug: group.slug,
            displayName: group.title
          }}
          writingKind="post"
          pieceId={pieceId} // If undefined, creates new; if present, loads existing
          onPublished={handlePiecePublished}
          onUnpublished={() => {
            if (typeof window !== "undefined") {
              try {
                window.localStorage.setItem("writing_active_tab", "drafts");
                window.localStorage.setItem("writing_force_refresh", "true");
              } catch (error) {
                console.warn("Failed to set writing tab:", error);
              }
            }
            router.replace(`/groups/${group.slug}?view=admin&section=writing`);
          }}
        />
      </WorkAreaWrapper>
    );
  }

  if (section === "import-document") {
    return (
      <WorkAreaWrapper>
        <DocumentImportWorkArea
          sponsor={{ type: "group", id: group.id, slug: group.slug, displayName: group.title }}
          onImported={(piece) => setActiveSection("write", { piece: piece.id })}
          onBack={() => setActiveSection("writing")}
        />
      </WorkAreaWrapper>
    );
  }

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

  if (section === "lanternmail-landing") {
    return (
      <WorkAreaWrapper>
        <LanternmailWorkArea group={group} />
      </WorkAreaWrapper>
    );
  }

  if (section === "lanternmail-create") {
    return (
      <WorkAreaWrapper>
        <LanternmailCreateListWorkArea group={group} />
      </WorkAreaWrapper>
    );
  }

  if (section === "lanternmail-campaigns") {
    return (
      <WorkAreaWrapper>
        <LanternmailCampaignWorkArea group={group} />
      </WorkAreaWrapper>
    );
  }

  if (section === "broadcasts") {
    return (
      <WorkAreaWrapper>
        <BroadcastWorkArea groupSlug={group.slug} />
      </WorkAreaWrapper>
    );
  }

  // Default fallback
  return (
    <WorkAreaWrapper>
      <VStack align="stretch" gap={4}>
        <Text fontSize="xl" fontWeight="bold">Section: {section}</Text>
        <Text>This group section is under development.</Text>
      </VStack>
    </WorkAreaWrapper>
  );
}
