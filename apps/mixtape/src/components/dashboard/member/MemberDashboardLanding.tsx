"use client";

import { Grid, GridItem } from "@chakra-ui/react";
import type { UserIdentity } from "@mixtape/core/types/auth";
import RecentActivityCard from "./cards/RecentActivityCard";
import RecentMessagesCard from "./cards/RecentMessagesCard";
import MyGroupsCard from "./cards/MyGroupsCard";
import PeopleInSphereCard from "./cards/PeopleInSphereCard";

interface MemberDashboardLandingProps {
  identity: UserIdentity;
  switchToAdmin: (section?: string) => void;
}

export default function MemberDashboardLanding({
  identity,
  switchToAdmin,
}: MemberDashboardLandingProps) {
  return (
    <Grid
      templateColumns={{ base: "1fr", lg: "repeat(12, 1fr)" }}
      gap={6}
    >
      {/* Row 1: Activity (1/3) | Messages (2/3) */}
      <GridItem colSpan={{ base: 1, lg: 4 }}>
        <RecentActivityCard
          identity={identity}
          onViewAll={() => switchToAdmin("overview")}
        />
      </GridItem>
      <GridItem colSpan={{ base: 1, lg: 8 }}>
        <RecentMessagesCard
          identity={identity}
          onViewAll={() => switchToAdmin("messages")}
        />
      </GridItem>

      {/* Row 2: Groups (2/3) | People (1/3) */}
      <GridItem colSpan={{ base: 1, lg: 8 }}>
        <MyGroupsCard
          identity={identity}
          onViewAll={() => switchToAdmin("my-groups")}
        />
      </GridItem>
      <GridItem colSpan={{ base: 1, lg: 4 }}>
        <PeopleInSphereCard identity={identity} />
      </GridItem>
    </Grid>
  );
}
