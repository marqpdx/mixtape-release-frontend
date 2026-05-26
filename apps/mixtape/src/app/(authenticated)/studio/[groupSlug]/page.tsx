"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Container, Spinner, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useGroup } from "@mixtape/api/hooks/groups/useGroups";
import { useAuth } from "@/lib/auth/AuthContext";
import { canUserModerateGroup } from "@mixtape/core/types/groupTypes";
import { ScopeBar } from "@/components/studio/ScopeBar";
import { GroupStudioHeader } from "@/components/studio/GroupStudioHeader";
import { WorkAreaChipStrip } from "@/components/studio/WorkAreaChipStrip";
import { GroupStudioTabs, StudioTabSkeleton, type StudioTab } from "@/components/studio/GroupStudioTabs";

export default function GroupStudioPage() {
  const { groupSlug } = useParams<{ groupSlug: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { group, isLoading: groupLoading } = useGroup(groupSlug);

  const bgColor = useColorModeValue("gray.50", "gray.900");

  const isAdmin = group ? canUserModerateGroup(group) : false;
  const isSuperadmin = !!(user?.is_staff || user?.is_superuser);
  const canAccess = isAdmin || isSuperadmin;
  const isReady = !authLoading && !groupLoading;

  const [activeTab, setActiveTab] = useState<StudioTab>("pulse");

  useEffect(() => {
    if (!isReady) return;
    if (group && !canAccess) router.replace("/studio");
  }, [isReady, group, canAccess, router]);

  if (!isReady || (group && !canAccess)) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!group) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Text color="gray.500">Group not found.</Text>
      </Box>
    );
  }

  const chips = [
    { label: "Library", href: `/groups/${group.slug}/library`, active: false },
    { label: "Threads", href: `/groups/${group.slug}`, active: false },
    { label: "Loom", href: `/groups/${group.slug}/loom`, active: false },
  ];

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="5xl" py={8}>

        <ScopeBar items={[
          { label: "Studio", href: "/studio" },
          { label: group.title },
        ]} />

        <GroupStudioHeader title={group.title} />

        <WorkAreaChipStrip chips={chips} />

        <GroupStudioTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isSuperadmin={isSuperadmin}
        >
          <StudioTabSkeleton />
        </GroupStudioTabs>

      </Container>
    </Box>
  );
}
