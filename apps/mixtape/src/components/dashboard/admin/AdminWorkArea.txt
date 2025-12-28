// src/components/dashboard/admin/AdminWorkArea.tsx

import { VStack, Text, SimpleGrid, Card, HStack } from "@chakra-ui/react";
import { WorkAreaProps } from "@components/dashboard/shared/types";
import WorkAreaWrapper from "@components/dashboard/shared/WorkAreaWrapper";
import { UserIdentity } from "@components/auth/interfaces";
import { Button } from "@theme/recipes/button.recipe";
import AdminCardWrapper from "@components/admin/AdminCardWrapper";
import ToDoList from "@components/admin/ToDoList";
import { useState } from "react";
import { useColorModeValue } from "@components/ui/color-mode";
import ProjectAdminWorkArea from "@components/projects/ProjectsAdminWorkArea";
import { useGroups } from "@hooks/useGroups";
import { Group } from "content/groupTypes";
import SystemStatsWorkArea from "@components/admin/system/SystemStatsWorkArea";
import AuthDebugWorkArea from "@components/admin/auth/AuthDebugWorkArea";
// import AuthDebugWorkArea from "@components/admin/auth/AuthDebugWorkArea";

interface ToDoItem {
  id: number;
  title: string;
  is_completed: boolean;
  completed_date: string | null;
}

interface AdminWorkAreaProps extends WorkAreaProps {
  identity: UserIdentity;
  todos: ToDoItem[];
  onCompleteTodo: (id: number) => void;
  allMembers?: any[];
}

export default function AdminWorkArea({
  section,
  setActiveSection,
  identity,
  todos,
  onCompleteTodo,
  allMembers = [],
}: AdminWorkAreaProps) {

  const { groups, isLoading, error, refetch } = useGroups({
    ordering: '-created_at',
    is_active: true
  });

  const canEditGroup = (group: Group): boolean => {
    if (identity?.is_superuser || identity?.is_staff) {
      return true;
    }
    return true;
  };

  if (section === "admin-overview") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={6}>
          <Text fontSize="2xl" fontWeight="bold">🎧 Mixtape Admin Overview</Text>

          {/* Quick Actions */}
          <Card.Root>
            <Card.Header>
              <Text fontSize="lg" fontWeight="semibold">🚀 Quick Actions</Text>
            </Card.Header>
            <Card.Body>
              <HStack gap={4} wrap="wrap">
                <Button onClick={() => setActiveSection("user-management")}>
                  👥 Manage Users
                </Button>
                <Button onClick={() => setActiveSection("group-management")}>
                  🏢 Manage Groups
                </Button>
                <Button onClick={() => setActiveSection("content-moderation")}>
                  📝 Content Moderation
                </Button>
                <Button onClick={() => setActiveSection("site-settings")}>
                  ⚙️ Site Settings
                </Button>
                <Button onClick={() => setActiveSection("auth-debug")}>
                  🔐 Auth Debug
                </Button>
                <Button onClick={() => setActiveSection("system-logs")}>
                  📊 System Logs
                </Button>
              </HStack>
            </Card.Body>
          </Card.Root>

          {/* Admin Cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            <AdminCardWrapper
              title="To-Do List"
              modalTitle="Manage To-Dos"
              modalContent={<ToDoList todos={todos} onComplete={onCompleteTodo} />}
              onClick={() => setActiveSection("todos")}
            >
              <Text>{todos.filter(t => !t.is_completed).length} pending tasks</Text>
            </AdminCardWrapper>

            <AdminCardWrapper
              title="Users"
              modalTitle="User Management"
              modalContent={<Text>User management coming soon...</Text>}
              onClick={() => setActiveSection("user-management")}
            >
              <Text>{allMembers.length} total users</Text>
            </AdminCardWrapper>

            <AdminCardWrapper
              title="Groups"
              modalTitle="Group Management"
              modalContent={<Text>Group management coming soon...</Text>}
              onClick={() => setActiveSection("group-management")}
            >
              <Text>{groups.length} active groups</Text>
            </AdminCardWrapper>

            <AdminCardWrapper
              title="Auth Debug"
              modalTitle="Authentication Debug"
              modalContent={<Text>Click to open full debug panel</Text>}
              onClick={() => setActiveSection("auth-debug")}
            >
              <Text>Token & session monitoring</Text>
            </AdminCardWrapper>

            <AdminCardWrapper
              title="System Logs"
              modalTitle="System Logs"
              modalContent={<Text>Click to view system logs</Text>}
              onClick={() => setActiveSection("system-logs")}
            >
              <Text>Backend request logs</Text>
            </AdminCardWrapper>
          </SimpleGrid>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "auth-debug") {
    return <AuthDebugWorkArea />;
  }

  if (section === "system-logs") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">📊 System Logs</Text>
          <Card.Root>
            <Card.Body>
              <VStack align="stretch" gap={3}>
                <Text fontSize="sm" color="gray.600">
                  Backend logs are visible in your Django console/terminal where you run:
                </Text>
                <Text fontFamily="mono" fontSize="sm" bg="gray.100" p={3} borderRadius="md">
                  python manage.py runserver
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Look for patterns like:
                </Text>
                <VStack align="stretch" gap={1} fontFamily="mono" fontSize="xs" pl={4}>
                  <Text>✅ INFO: "GET /api/endpoint HTTP/1.1" 200</Text>
                  <Text>❌ WARNING: "POST /api/endpoint HTTP/1.1" 401</Text>
                  <Text>🔍 Token Request to RefreshToken...</Text>
                </VStack>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  Future enhancement: Real-time log streaming to this panel via WebSocket
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </WorkAreaWrapper>
    );
  }


  if (section === "system-stats") {
    return <SystemStatsWorkArea />;
  }



  if (section === "quick-actions") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={6}>
          <Text fontSize="xl" fontWeight="bold">🚀 Quick Actions</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Button
              size="lg"
              p={6}
              onClick={() => setActiveSection("user-management")}
            >
              👥 Manage Users
            </Button>
            <Button
              size="lg"
              p={6}
              onClick={() => setActiveSection("group-management")}
            >
              🏢 Manage Groups
            </Button>
            <Button
              size="lg"
              p={6}
              onClick={() => setActiveSection("content-moderation")}
            >
              📝 Content Moderation
            </Button>
            <Button
              size="lg"
              p={6}
              onClick={() => setActiveSection("site-settings")}
            >
              ⚙️ Site Settings
            </Button>
            <Button
              size="lg"
              p={6}
              onClick={() => setActiveSection("auth-debug")}
            >
              🔐 Auth Debug
            </Button>
            <Button
              size="lg"
              p={6}
              onClick={() => setActiveSection("system-logs")}
            >
              📊 System Logs
            </Button>
          </SimpleGrid>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "user-management") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">👥 User Management</Text>
          <Text>Manage {allMembers.length} users across the platform.</Text>
          <Text>User management interface coming soon...</Text>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "group-management") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">🏢 Group Management</Text>
          <Text>Group management interface coming soon...</Text>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "todos") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">📝 To-Do Management</Text>
          <ToDoList todos={todos} onComplete={onCompleteTodo} />
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "content-moderation") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">📝 Content Moderation</Text>
          <Text>Content moderation tools coming soon...</Text>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "site-settings") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">⚙️ Site Settings</Text>
          <Text>Site configuration options coming soon...</Text>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "system-health") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">🏥 System Health</Text>
          <Text>System monitoring dashboard coming soon...</Text>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "active-projects") {
    const [open, setOpen] = useState<any | null>(null);
    const onOpen = (p: any) => setOpen(p);
    const onClose = () => setOpen(null);

    const bg = useColorModeValue("gray.50", "gray.900");
    return (
      <WorkAreaWrapper>
        <ProjectAdminWorkArea bg={bg} open={open} onClose={onClose} />
      </WorkAreaWrapper>
    );
  }

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