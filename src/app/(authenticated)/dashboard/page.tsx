// app/(authenticate)/dashboard/page.tsx

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Text } from "@chakra-ui/react";
import { useQuery, useMutation } from "@tanstack/react-query";
// import type { Metadata } from 'next';
import { useAuth } from "@/lib/auth/AuthContext";
// import { UserIdentity } from "@mixtape/core/types/auth";
import { useUserGroups } from "@/hooks/groups/useGroups";
import { useUsers } from "@/hooks/useUsers";
// import { getRoleBooleans } from "lib/auth/roles";
// import { useSocketSetup } from "lib/hooks/useSocketSetup";

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
  const { user: identity, isLoading: identityLoading } = useAuth();

  // Set dynamic title
  useEffect(() => {
    if (identity) {
      // const isAdmin = getRoleBooleans(identity).isAdmin;

      const title = false
        ? "Admin Dashboard - Mixtape Crossroads"
        : "Dashboard - Mixtape Crossroads";
      document.title = title;
    }
  }, [identity]);

  // Loading states
  if (identityLoading) {
    return <Text>Loading your dashboard...</Text>;
  }

  if (!identity) {
    return <Text>Authentication required...</Text>;
  }

  const [selectedForumSlug, setSelectedForumSlug] = useState<string | null>(null);

  const roles = identity?.roles ?? [];
  // const { isAdmin, isSteward, isMember } = getRoleBooleans(identity);

  // Initialize socket for real-time features
  // const socket = useSocketSetup(identity);

  // Fetch user's groups using our custom hook
  const { groups: userGroups, isLoading: groupsLoading } = useUserGroups();

  // Fetch all members for collaboration features
  const { users: membersData = [], isLoading: membersLoading } = useUsers();

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
    mutationFn: useCallback((id: number) => {
      // TODO: Create todoApi.ts with updateTodo() function
      console.warn("Todo API not migrated yet - needs todoApi.ts");
      return Promise.resolve();
    }, []),
    onSuccess: useCallback(() => {
      refetchTodos();
    }, [refetchTodos]),
  });

    // FIX: Stabilize the mutation callback
  const handleCompleteTodo = useCallback((id: number) => {
    completeTodo.mutate(id);
  }, [completeTodo.mutate]);

  // FIX: Stabilize setSelectedForumSlug
  const handleSetSelectedForumSlug = useCallback((slug: string | null) => {
    setSelectedForumSlug(slug);
  }, []);

  const stableSetSelectedForumSlug = useCallback((slug: string | null) => {
    setSelectedForumSlug(slug);
  }, []);

  // Stabilize data references to prevent infinite re-renders
  const stableMembersData = useMemo(() => membersData, [membersData]);
  const stableUserGroups = useMemo(() => userGroups, [userGroups]);
  const stableTodos = useMemo(() => todos, [todos]);

  // Build dashboard title based on role
  const getDashboardTitle = () => {
    const isSteward = true;
    // if (isAdmin) return "🎧 Mixtape Community Dashboard"; // Admin still sees member features
    if (isSteward) return "🌱 Community Dashboard";
    return `Welcome back, ${identity.first_name || identity.username}!`;
  };

  // Stabilize WorkAreaWrapper function to prevent infinite re-renders
  const WorkAreaWrapper = useCallback((props: WorkAreaProps) => {
    return (
      <MemberWorkArea
        {...props}
        identity={identity}
        groups={stableUserGroups}
        allMembers={stableMembersData}
        todos={stableTodos}
        onCompleteTodo={handleCompleteTodo}
        // socket={socket}
        selectedForumSlug={selectedForumSlug}
        setSelectedForumSlug={handleSetSelectedForumSlug}
      />
    );
  }, [
    identity,
    stableUserGroups,
    stableMembersData,
    stableTodos,
    handleCompleteTodo, // Now stable
    // socket,
    selectedForumSlug,
    handleSetSelectedForumSlug, // Now stable
  ]);

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
