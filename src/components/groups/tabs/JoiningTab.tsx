// src/components/groups/tabs/JoiningTab.tsx
//
import { Card, Heading, VStack, Text, Button, Box } from "@chakra-ui/react";

export function JoiningTab({ group, isMember, onJoinGroup }: { group: any; isMember: boolean; onJoinGroup?: () => void }) {
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
              {group.join_policy === 'open' && "This group is open for anyone to join!"}
              {group.join_policy === 'approval' && "Membership requires approval from group admins."}
              {group.join_policy === 'invite' && "This group is invite-only."}
            </Text>
            {group.join_policy !== 'closed' && onJoinGroup && (
              <Button colorScheme="green" size="lg" w="full" onClick={onJoinGroup}>
                {group.join_policy === 'approval' ? "Request to Join" : "Join Group"}
              </Button>
            )}
            {group.joining_instructions && (
              <Box p={4} bg="gray.50" borderRadius="md" w="full">
                <Text fontSize="sm" whiteSpace="pre-line">
                  {group.joining_instructions}
                </Text>
              </Box>
            )}
          </VStack>
        )}
      </Card.Body>
    </Card.Root>
  );
}