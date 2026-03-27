// apps/mixtape/src/components/members/tabs/MemberTabs.tsx

"use client";

import { useEffect, useState } from "react";
import { HStack, Text } from "@chakra-ui/react";
import { Tabs } from "@chakra-ui/react";
import { useSearchParams, useRouter } from "next/navigation";
import { IconInfoHexagon, IconFolder } from "@tabler/icons-react";
import type { MemberProfile } from "@mixtape/core/types/memberTypes";
import MemberProfileSummary from "../MemberProfileSummary";
import MemberLibraryOverview from "../MemberLibraryOverview";

interface MemberTabsProps {
  member: MemberProfile;
}

const publicTabs = [
  { key: "profile", label: "Profile", icon: IconInfoHexagon },
  { key: "library", label: "My Library", icon: IconFolder },
];

const validTabKeys = publicTabs.map((t) => t.key);

export default function MemberTabs({ member }: MemberTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const urlTab = searchParams?.get("tab");
    if (urlTab && validTabKeys.includes(urlTab)) {
      setActiveTab(urlTab);
    } else {
      setActiveTab(publicTabs[0].key);
    }
  }, [searchParams]);

  if (!activeTab) return null;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(e) => handleTabChange(e.value as string)}
      variant="enclosed"
    >
      <Tabs.List mb={4}>
        {publicTabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <Tabs.Trigger key={tab.key} value={tab.key}>
              <HStack>
                <IconComponent size={16} />
                <Text>{tab.label}</Text>
              </HStack>
            </Tabs.Trigger>
          );
        })}
        <Tabs.Indicator />
      </Tabs.List>

      <Tabs.Content value="profile">
        <MemberProfileSummary member={member} />
      </Tabs.Content>
      <Tabs.Content value="library">
        <MemberLibraryOverview username={member.username} />
      </Tabs.Content>
    </Tabs.Root>
  );
}
