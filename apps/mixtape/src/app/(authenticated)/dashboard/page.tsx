// apps/mixtape/src/app/(authenticated)/dashboard/page.tsx

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Text } from "@chakra-ui/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthContext";
import { useUserGroups } from "@mixtape/api/hooks/groups/useGroups";
import { useUsers } from "@mixtape/api/hooks/useUsers";

// Import the new clean dashboard architecture
import DashboardLayout, { WorkAreaProps } from "@components/common/DashboardLayout";
import { MEMBER_DASHBOARD_CONFIG } from "@components/dashboard/member/memberConfig";
import MemberWorkArea from "@components/dashboard/member/MemberWorkArea";

interface ToDoItem {
  id: number;
  title: string;
  is_completed: boolean;
  completed_date: string | null;
}

/**
 * MEMBER DASHBOARD
 *
 * This is the main dashboard for community members. It provides access to:
 * - Personal profile and activity
 * - Writing tools (drafts, publishing, templates)
 * - Group participation and discovery
 * - Learning (EarthLab courses and achievements)
 * - Forum participation (Threadworks)
 *
 * ARCHITECTURE PATTERN FOR FUTURE DEVELOPERS:
 *
 * 🏗️ TO ADD A NEW DASHBOARD TYPE:
 * 1. Create config: src/components/dashboard/[type]/[type]Config.ts
 * 2. Create work area: src/components/dashboard/[type]/[Type]WorkArea.tsx
 * 3. Create new page: app/(protected)/[type]-dashboard/page.tsx
 * 4. Import and use the config + work area in the page
 *
 * 📋 TO ADD NEW MENU ITEMS:
 * Edit: src/components/dashboard/member/memberConfig.ts
 * - Add to MEMBER_MENU_ITEMS array
 * - Follow the MenuItem interface structure
 *
 * 🛠️ TO ADD NEW WORK AREA SECTIONS:
 * Edit: src/components/dashboard/member/MemberWorkArea.tsx
 * - Add new `if (section === "your-section")` block
 * - Use WorkAreaWrapper for consistent layout
 * - Return your component/UI for that section
 *
 * 🎨 COMPONENT STRUCTURE:
 * DashboardLayout (shared)
 *   ├── memberConfig (menu items)
 *   └── MemberWorkArea (section routing)
 *       ├── WorkAreaWrapper (consistent padding)
 *       └── Section Components (actual functionality)
 */
export default function MemberDashboard() {
  // ==========================================
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // This is a fundamental React rule - hooks must always execute in the same order
  // ==========================================

  const { user: identity, isLoading: identityLoading } = useAuth();
  const [selectedForumSlug, setSelectedForumSlug] = useState<string | null>(null);

  // Fetch user's groups using our custom hook
  const { groups: userGroups, isLoading: groupsLoading } = useUserGroups();

  // Fetch all members for collaboration features
  const { users: membersData = [] } = useUsers();

  // Fetch todos for admin features (if user has admin access)
  const { data: todos = [], refetch: refetchTodos } = useQuery<ToDoItem[]>({
    queryKey: ["todos"],
    queryFn: async () => {
      // TODO: Create todoApi.ts with fetchTodos() function
      // For now, return empty array until todo API is migrated
      console.warn("Todo API not migrated yet - needs todoApi.ts");
      return [];
    },
    enabled: false, // Disabled until API is migrated
    refetchInterval: 30000,
  });

  // Complete todo mutation
  const completeTodo = useMutation({
    mutationFn: async () => {
      // TODO: Create todoApi.ts with updateTodo() function
      console.warn("Todo API not migrated yet - needs todoApi.ts");
      return Promise.resolve();
    },
    onSuccess: () => {
      refetchTodos();
    },
  });

  // Stabilize the mutation callback
  const handleCompleteTodo = useCallback((id: number) => {
    void id;
    completeTodo.mutate();
  }, [completeTodo]);

  // Stabilize setSelectedForumSlug
  const handleSetSelectedForumSlug = useCallback((slug: string | null) => {
    setSelectedForumSlug(slug);
  }, []);

  // Stabilize data references to prevent infinite re-renders
  const stableMembersData = useMemo(() => membersData, [membersData]);
  const stableUserGroups = useMemo(() => userGroups, [userGroups]);
  const stableTodos = useMemo(() => todos, [todos]);
  const defaultGroupName =
    process.env.NEXT_PUBLIC_DEFAULT_GROUP_NAME ||
    process.env.MIXTAPE_DEFAULT_GROUP_NAME ||
    "Crossroads";

  // Build dashboard title based on role
  const getDashboardTitle = useCallback(() => {
    const isSteward = true;
    if (isSteward) return "🌱 Community Dashboard";
    return `Welcome back, ${identity?.first_name || identity?.username}!`;
  }, [identity]);

  // Stabilize WorkAreaWrapper function to prevent infinite re-renders
  // Note: identity is guaranteed to be non-null by the time this renders due to early return checks
  const WorkAreaWrapper = useCallback((props: WorkAreaProps) => {
    // Early return check ensures identity is never null here
    if (!identity) return null;

    return (
      <MemberWorkArea
        {...props}
        identity={identity}
        groups={stableUserGroups}
        allMembers={stableMembersData}
        todos={stableTodos}
        onCompleteTodo={handleCompleteTodo}
        selectedForumSlug={selectedForumSlug}
        setSelectedForumSlug={handleSetSelectedForumSlug}
      />
    );
  }, [
    identity,
    stableUserGroups,
    stableMembersData,
    stableTodos,
    handleCompleteTodo,
    selectedForumSlug,
    handleSetSelectedForumSlug,
  ]);

  // Set dynamic title
  useEffect(() => {
    if (identity) {
      const title = `Dashboard - ${defaultGroupName}`;
      document.title = title;
    }
  }, [identity, defaultGroupName]);

  // ==========================================
  // NOW IT'S SAFE TO HAVE EARLY RETURNS
  // All hooks have been called above
  // ==========================================

  // Loading states
  if (identityLoading) {
    return <Text>Loading your dashboard...</Text>;
  }

  if (!identity) {
    return <Text>Authentication required...</Text>;
  }

  return (
    <DashboardLayout
      title={getDashboardTitle()}
      menuItems={MEMBER_DASHBOARD_CONFIG.menuItems}
      defaultSection={MEMBER_DASHBOARD_CONFIG.defaultSection}
      localStorageKey={MEMBER_DASHBOARD_CONFIG.localStorageKey}
      WorkAreaComponent={WorkAreaWrapper}
      workAreaProps={{}}
      loading={identityLoading || groupsLoading}
    />
  );
}
