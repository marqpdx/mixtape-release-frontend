// src/components/groups/GroupMembersAndRoles.tsx

import React from 'react';
import { VStack, Text, Table } from '@chakra-ui/react';

interface GroupMembersAndRolesProps {
  group: { id: string; slug?: string; title?: string };
  userRole: string;
}

export default function GroupMembersAndRoles({ group, userRole }: GroupMembersAndRolesProps) {
  void group;
  return (
    <VStack align="stretch" gap={4}>
      <Text fontSize="xl" fontWeight="bold">
        Members & Roles
      </Text>

      <Text color="gray.600">
        Member management interface coming soon. You have {userRole} permissions.
      </Text>

      <Table.Root size="sm" variant="outline">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Role</Table.ColumnHeader>
            <Table.ColumnHeader>Joined</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell colSpan={4} textAlign="center" py={8}>
              <Text color="gray.500">Member data loading...</Text>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </VStack>
  );
}
