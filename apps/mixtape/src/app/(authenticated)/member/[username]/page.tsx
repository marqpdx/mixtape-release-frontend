// apps/mixtape/src/app/(authenticated)/member/[username]/page.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Text, Tabs } from "@chakra-ui/react";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useMemberProfile } from "@hooks/member/useMemberProfile";

import DashboardLayout, { WorkAreaProps } from "@components/common/DashboardLayout";
import MemberWorkArea from "@components/dashboard/member/MemberWorkArea";
import { MEMBER_HUB_CONFIG } from "@components/dashboard/member/memberHubConfig";
import ProfileHeaderWrapper from "@components/profiles/ProfileHeaderWrapper";
import MemberLanding from "@components/members/layout/MemberLanding";
import MemberDashboardLanding from "@components/dashboard/member/MemberDashboardLanding";

type HubTab = "dashboard" | "admin";
const TAB_STORAGE_KEY = "memberHub_tab";

export default function MemberHubPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const usernameParam = params?.username as string | undefined;

  const { user: identity, isLoading: identityLoading } = useAuth();
  const username = usernameParam || identity?.username;
  const { member, isLoading: memberLoading } = useMemberProfile(username);
  const groupsLoading = false;

  const isOwner = Boolean(identity && member && identity.username === member.username);
  const headerTitle = member?.display_name || member?.username || "Member";
  const headerSubtitle = member?.username ? `@${member.username}` : undefined;

  // Tab state: URL ?tab= → localStorage → default "dashboard"
  const [activeTab, setActiveTab] = useState<HubTab>(() => {
    const urlTab = searchParams?.get("tab");
    if (urlTab === "dashboard" || urlTab === "admin") return urlTab;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(TAB_STORAGE_KEY);
      if (stored === "dashboard" || stored === "admin") return stored;
    }
    return "dashboard";
  });

  // Track a pending admin section to navigate to after tab switch
  const [pendingAdminSection, setPendingAdminSection] = useState<string | null>(null);

  const handleTabChange = useCallback((tab: HubTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem(TAB_STORAGE_KEY, tab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  // Switch to admin tab and optionally navigate to a section
  const switchToAdmin = useCallback((section?: string) => {
    if (section) {
      setPendingAdminSection(section);
      // Also store the section so DashboardLayout picks it up
      localStorage.setItem(MEMBER_HUB_CONFIG.localStorageKey, section);
    }
    handleTabChange("admin");
  }, [handleTabChange]);

  const WorkAreaWrapper = useCallback(
    (props: WorkAreaProps) => {
      if (!identity) return null;

      // If we have a pending section from dashboard card click, use it
      const effectiveProps = pendingAdminSection
        ? { ...props, section: pendingAdminSection }
        : props;

      // Clear pending after first render
      if (pendingAdminSection) {
        setTimeout(() => setPendingAdminSection(null), 0);
      }

      return (
        <MemberWorkArea
          {...effectiveProps}
          identity={identity}
        />
      );
    },
    [identity, pendingAdminSection]
  );

  useEffect(() => {
    if (member) {
      document.title = `${headerTitle} - Mixtape Crossroads`;
    }
  }, [member, headerTitle]);

  if (identityLoading || memberLoading) {
    return <Text>Loading your hub...</Text>;
  }

  if (!identity) {
    return <Text>Authentication required...</Text>;
  }

  if (member && !isOwner) {
    return <MemberLanding member={member} />;
  }

  return (
    <Box>
      <ProfileHeaderWrapper
        mode="self"
        title={headerTitle}
        subtitle={headerSubtitle}
        bannerImageUrl={member?.background_image_url || null}
        avatarImageUrl={member?.profile_image_url || member?.avatar_url || null}
        avatarFallbackText={member?.display_name?.charAt(0) || member?.username?.charAt(0) || "?"}
      />

      <Tabs.Root
        value={activeTab}
        onValueChange={(d) => handleTabChange(d.value as HubTab)}
      >
        <Tabs.List maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} pt={2}>
          <Tabs.Trigger value="dashboard">Dashboard</Tabs.Trigger>
          <Tabs.Trigger value="admin">Admin</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} pt={4}>
        {activeTab === "dashboard" ? (
          <MemberDashboardLanding
            identity={identity}
            switchToAdmin={switchToAdmin}
          />
        ) : (
          <Box
            css={{
              // Override DashboardLayout's fixed 100vh heights so it fits
              // within the tab container instead of pushing past the viewport
              "& .dashboard-layout": { minH: "auto" },
              "& .dashboard-layout > div": { h: "calc(100vh - 320px)" },
            }}
          >
            <DashboardLayout
              title={headerTitle}
              menuItems={MEMBER_HUB_CONFIG.menuItems}
              defaultSection={pendingAdminSection || MEMBER_HUB_CONFIG.defaultSection}
              localStorageKey={MEMBER_HUB_CONFIG.localStorageKey}
              WorkAreaComponent={WorkAreaWrapper}
              workAreaProps={{}}
              loading={identityLoading || groupsLoading}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
