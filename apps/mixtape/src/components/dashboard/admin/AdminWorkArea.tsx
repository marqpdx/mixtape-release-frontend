// apps/mixtape/src/components/dashboard/admin/AdminWorkArea.tsx

"use client";

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
  allMembers?: UserIdentity[];
}

export default function AdminWorkArea({
  section,
  setActiveSection,
  identity,
  todos,
  onCompleteTodo,
  onRefreshTodos,
  allMembers = [],
}: AdminWorkAreaProps) {
  const { groups } = useGroups({
    ordering: "-created_at",
    is_active: true,
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

  // =========================================================================
  // ADMIN OVERVIEW
  // =========================================================================
  if (section === "admin-overview") {
    const pendingTodos = todos.filter((t) => !t.is_completed).length;

    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={6}>
          <Text fontSize="2xl" fontWeight="bold">Admin Overview</Text>

          {/* Platform Snapshot */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
            <AdminCardWrapper
              title="To-Dos"
              modalTitle="Manage To-Dos"
              modalContent={<ToDoList todos={todos} onComplete={onCompleteTodo} />}
              onClick={() => setActiveSection("todos")}
            >
              <Text fontSize="2xl" fontWeight="bold">{pendingTodos}</Text>
              <Text fontSize="sm" color="gray.600">pending tasks</Text>
            </AdminCardWrapper>

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

            <Card.Root>
              <Card.Header>
                <Text fontWeight="semibold">Infrastructure</Text>
              </Card.Header>
              <Card.Body>
                <Link href="/admin/sysadmin">
                  <Button size="sm" width="full">
                    Sysadmin Dashboard
                  </Button>
                </Link>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          {/* Quick Actions */}
          <Card.Root>
            <Card.Header>
              <Text fontSize="lg" fontWeight="semibold">Quick Actions</Text>
            </Card.Header>
            <Card.Body>
              <HStack gap={4} wrap="wrap">
                <Button size="sm" onClick={onRefreshTodos}>
                  Refresh To-Dos
                </Button>
                <Button size="sm" variant="outline" onClick={() => setActiveSection("auth-debug")}>
                  Auth Debug
                </Button>
              </HStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  // =========================================================================
  // AUTH DEBUG
  // =========================================================================
  if (section === "auth-debug") {
    return <AuthDebugWorkArea />;
  }

  // =========================================================================
  // TO-DOS
  // =========================================================================
  if (section === "todos") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">To-Do Management</Text>
            <Button size="sm" onClick={onRefreshTodos}>
              Refresh
            </Button>
          </HStack>
          <ToDoList todos={todos} onComplete={onCompleteTodo} />
        </VStack>
      </WorkAreaWrapper>
    );
  }

  // =========================================================================
  // DEFAULT FALLBACK
  // =========================================================================
  return (
    <WorkAreaWrapper>
      <VStack align="stretch" gap={4}>
        <Text fontSize="xl" fontWeight="bold">Section: {section}</Text>
        <Text>This admin section is under development.</Text>
        <Button size="sm" onClick={() => setActiveSection("admin-overview")}>
          Back to Overview
        </Button>
      </VStack>
    </WorkAreaWrapper>
  );
}
