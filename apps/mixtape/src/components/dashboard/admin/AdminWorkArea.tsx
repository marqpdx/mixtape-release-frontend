// apps/mixtape/src/components/dashboard/admin/AdminWorkArea.tsx

import { VStack, Text, SimpleGrid, Card, HStack } from "@chakra-ui/react";
import { WorkAreaProps } from "@components/dashboard/shared/types";
import WorkAreaWrapper from "@components/dashboard/shared/WorkAreaWrapper";
import { UserIdentity } from "@mixtape/core/types/auth";
import AdminCardWrapper from "@components/admin/AdminCardWrapper";
import ToDoList from "@components/admin/ToDoList";
import AuthDebugWorkArea from "@components/admin/auth/AuthDebugWorkArea";
import { useGroups } from "@mixtape/api/hooks/groups/useGroups";
import { AdminTodoItem } from "@mixtape/api/clients/admin/adminApi";
import { Button } from "@/theme/recipes/button.recipe";
import Link from "next/link";

interface AdminWorkAreaProps extends WorkAreaProps {
  identity: UserIdentity;
  todos: AdminTodoItem[];
  onCompleteTodo: (id: number) => void;
  onRefreshTodos: () => void;
  systemStats?: Record<string, unknown> | null;
  userMetrics?: Record<string, unknown> | null;
  allMembers?: UserIdentity[];
}

export default function AdminWorkArea({
  section,
  setActiveSection,
  identity,
  todos,
  onCompleteTodo,
  onRefreshTodos,
  systemStats = null,
  userMetrics = null,
  allMembers = [],
}: AdminWorkAreaProps) {

  const { groups } = useGroups({
    ordering: '-created_at',
    is_active: true
  });
  if (!identity?.is_superuser) {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">Access Denied</Text>
          <Text>Superuser access is required for this dashboard.</Text>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "admin-overview") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={6}>
          <Text fontSize="2xl" fontWeight="bold">Admin Overview</Text>

          {/* Platform Snapshot - Working Items Only */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            <AdminCardWrapper
              title="To-Do List"
              modalTitle="Manage To-Dos"
              modalContent={<ToDoList todos={todos} onComplete={onCompleteTodo} />}
              onClick={() => setActiveSection("todos")}
            >
              <Text>{todos.filter(t => !t.is_completed).length} pending tasks</Text>
            </AdminCardWrapper>

            {/* Platform metrics - read-only for now */}
            <Card.Root>
              <Card.Header>
                <Text fontWeight="semibold">Users</Text>
              </Card.Header>
              <Card.Body>
                <Text fontSize="2xl" fontWeight="bold">{allMembers.length}</Text>
                <Text fontSize="sm" color="gray.600">total users</Text>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Header>
                <Text fontWeight="semibold">Groups</Text>
              </Card.Header>
              <Card.Body>
                <Text fontSize="2xl" fontWeight="bold">{groups.length}</Text>
                <Text fontSize="sm" color="gray.600">active groups</Text>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          {/* Infrastructure */}
          <Card.Root>
            <Card.Header>
              <Text fontSize="lg" fontWeight="semibold">Infrastructure</Text>
            </Card.Header>
            <Card.Body>
              <HStack gap={4} wrap="wrap">
                <Link href="/admin/sysadmin">
                  <Button>Sysadmin Dashboard</Button>
                </Link>
                <Button onClick={() => setActiveSection("auth-debug")}>
                  Auth Debug
                </Button>
              </HStack>
            </Card.Body>
          </Card.Root>

          {/* Status */}
          <Card.Root>
            <Card.Header>
              <Text fontSize="lg" fontWeight="semibold">Status</Text>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={2}>
                <Text fontSize="sm" color="gray.600">
                  System stats: {systemStats ? "loaded" : "pending"}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  User metrics: {userMetrics ? "loaded" : "pending"}
                </Text>
                <Button size="sm" onClick={onRefreshTodos}>
                  Refresh To-Dos
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "auth-debug") {
    return <AuthDebugWorkArea />;
  }

  if (section === "todos") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">To-Do Management</Text>
          <ToDoList todos={todos} onComplete={onCompleteTodo} />
        </VStack>
      </WorkAreaWrapper>
    );
  }

  // ==========================================================================
  // STUB SECTIONS - Commented out until dashboard hierarchy is finalized
  // See: docs/sysadmin/handbook.md for planned structure
  // ==========================================================================

  // if (section === "system-logs") {
  //   // Future: Real-time log streaming via WebSocket
  //   return (
  //     <WorkAreaWrapper>
  //       <VStack align="stretch" gap={4}>
  //         <Text fontSize="xl" fontWeight="bold">System Logs</Text>
  //         <Text>Log streaming coming soon...</Text>
  //       </VStack>
  //     </WorkAreaWrapper>
  //   );
  // }

  // if (section === "user-management") {
  //   // Future: User CRUD, roles, suspension
  //   return null;
  // }

  // if (section === "group-management") {
  //   // Future: Group CRUD, membership management
  //   return null;
  // }

  // if (section === "content-moderation") {
  //   // Future: Flagged content queue, moderation actions
  //   return null;
  // }

  // if (section === "site-settings") {
  //   // Future: Platform configuration
  //   return null;
  // }

  // if (section === "system-health") {
  //   // Future: Wire to /api/ops/summary - see ops/ module
  //   return null;
  // }

  // if (section === "active-projects") {
  //   // Projects are group-scoped, not platform-level
  //   return null;
  // }

  // Default fallback
  return (
    <WorkAreaWrapper>
      <VStack align="stretch" gap={4}>
        <Text fontSize="xl" fontWeight="bold">Section: {section}</Text>
        <Text>This admin section is under development.</Text>
      </VStack>
    </WorkAreaWrapper>
  );
}
