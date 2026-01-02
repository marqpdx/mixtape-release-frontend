// src/components/groups/tabs/JoiningTab.tsx
//
import { Card, Heading, VStack, Text, Button } from "@chakra-ui/react";
import type { Group } from "@mixtape/core/types/groupTypes";

export function JoiningTab({ group, isMember, onJoinGroup }: { group: Group; isMember: boolean; onJoinGroup?: () => void }) {
  return (
    <Card.Root maxW="2xl" mx="auto">
      <Card.Header>
        <Heading size="md">
          {isMember ? "Invite Others" : "Join This Group"}
        </Heading>
      </Card.Header>
      <Card.Body>
        {isMember ? (
          <VStack gap={4}>
            <Text>Share this group with others who might be interested:</Text>
            <Button colorScheme="green" w="full">Share Group</Button>
          </VStack>
        ) : (
          <VStack gap={4}>
            <Text>
              {group.visibility === 'public' && "This group is open for anyone to join!"}
              {group.visibility === 'invite_only' && "This group is invite-only."}
              {(group.visibility === 'private' || group.visibility === 'hidden') && "This group is private."}
            </Text>
            {group.visibility === 'public' && onJoinGroup && (
              <Button colorScheme="green" size="lg" w="full" onClick={onJoinGroup}>
                Join Group
              </Button>
            )}
            {group.visibility === 'invite_only' && onJoinGroup && (
              <Button colorScheme="green" size="lg" w="full" onClick={onJoinGroup}>
                Request to Join
              </Button>
            )}
          </VStack>
        )}
      </Card.Body>
    </Card.Root>
  );
}
