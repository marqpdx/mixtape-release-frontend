// src/components/groups/GroupActivityDashboard.tsx

"use client";

import {
  Box,
  Heading,
  VStack,
  SimpleGrid,
} from "@chakra-ui/react";
import DashboardBlock from "@components/common/DashboardBlock";
import DashboardBlockCollapsible from "@components/common/DashboardBlockCollapsible";
import { IconClock, IconHourglass, IconMessages, IconUsers } from "@tabler/icons-react";

// import GroupMembersPreview from "./previews/GroupMembersPreview";
import RecentActivityPreview from "./previews/RecentActivityPreview";
import RecentMessagesPreview from "./previews/RecentMessagesPreview";
import UpcomingEventsPreview from "./previews/UpcomingEventsPreview";

export interface GroupActivityDashboardProps {
  onViewAll: (sectionKey: string) => void;
  setActiveSection?: (sectionKey: string) => void;
  setHighlightedMemberId?: (memberId: number | null) => void;
  group: any;
  isMobile?: boolean;
}

export default function GroupActivityDashboard({
  onViewAll,
  group,
  setActiveSection,
  setHighlightedMemberId,
  isMobile = false,
}: GroupActivityDashboardProps) {
  return (
    <Box>
      <Heading size="lg" mb={4}>
        Dashboard
      </Heading>

      {isMobile ? (
        <VStack gap={4}>
          <DashboardBlock
            title="Group Members"
            icon={IconUsers}
            iconColor={"blue.500"}
            collapsible
            defaultOpen
            content={
              <Box>coming soon</Box>
              // <GroupMembersPreview
              //   members={group.members}
              //   onMemberClick={(memberId: number) => {
              //     setActiveSection("membersAndRoles");
              //     setHighlightedMemberId(memberId);
              //   }}
              //   onViewAll={() => {
              //     setActiveSection("membersAndRoles");
              //     setHighlightedMemberId(null);
              //   }}
              // />
            }
            onViewAll={() => onViewAll("members")}
          />

          <DashboardBlock
            title="Recent Activity"
            icon={IconHourglass}
            iconColor={"orange.500"}
            collapsible
            content={<RecentActivityPreview />}
            onViewAll={() => onViewAll("recentActivity")}
          />
          <DashboardBlock
            title="Recent Messages"
            icon={IconMessages}
            iconColor={"purple.500"}
            collapsible
            content={<RecentMessagesPreview />}
            onViewAll={() => onViewAll("groupMessaging")}
          />
          <DashboardBlock
            title="Upcoming Events"
            icon={IconClock}
            iconColor="green.500"
            collapsible
            content={<UpcomingEventsPreview />}
            onViewAll={() => onViewAll("groupEvents")}
          />
        </VStack>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          <DashboardBlock
            title="Group Members"
            icon={IconUsers}
            iconColor={"blue.500"}
            content={
              <Box>coming soon</Box>
              // <GroupMembersPreview
              //   members={group.members}
              //   onMemberClick={(memberId) => {
              //     setActiveSection("membersAndRoles");
              //     setHighlightedMemberId(memberId);
              //   }}
              //   onViewAll={() => {
              //     console.log("View all members clicked");
              //     setActiveSection("membersAndRoles");
              //     setHighlightedMemberId(null);
              //   }}
              // />
            }
            onViewAll={() => onViewAll("membersAndRoles")}
          />
          <DashboardBlock
            title="Recent Activity"
            icon={IconHourglass}
            iconColor={"orange.500"}
            content={<RecentActivityPreview />}
            onViewAll={() => onViewAll("recentActivity")}
          />
          <DashboardBlock
            title="Recent Messages"
            icon={IconMessages}
            iconColor={"purple.500"}
            content={<RecentMessagesPreview />}
            onViewAll={() => onViewAll("groupMessaging")}
          />
          <DashboardBlock
            title="Upcoming Events"
            icon={IconClock}
            iconColor="green.500"
            content={<UpcomingEventsPreview />}
            onViewAll={() => onViewAll("groupEvents")}
          />
        </SimpleGrid>
      )}
    </Box>
  );
}
