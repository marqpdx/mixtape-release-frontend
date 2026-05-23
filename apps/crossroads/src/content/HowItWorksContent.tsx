// apps/crossroads/src/content/HowItWorksContent.tsx

import { Heading, List, Text, VStack } from "@chakra-ui/react";

export default function HowItWorksContent() {
  return (
    <VStack align="start" gap={8}>
      <VStack align="start" gap={4}>
        <Heading as="h2" size="md">Groups</Heading>
        <Text fontSize="lg">
          Crossroads is organized around groups — intentional gatherings of people who share a
          focus, a project, or a set of values. Groups have members, conversations, and shared
          content. Some groups are open to anyone; others require an invitation or an application.
        </Text>
      </VStack>

      <VStack align="start" gap={4}>
        <Heading as="h2" size="md">Membership &amp; Roles</Heading>
        <Text fontSize="lg">
          Every group has members with different levels of trust and responsibility:
        </Text>
        <List.Root as="ul" gap={2} pl={4} fontSize="lg">
          <List.Item><strong>Members</strong> participate in conversations and access shared resources.</List.Item>
          <List.Item><strong>Stewards</strong> help facilitate the group and support new members.</List.Item>
          <List.Item><strong>Admins</strong> manage the group&apos;s settings, membership, and invitations.</List.Item>
        </List.Root>
      </VStack>

      <VStack align="start" gap={4}>
        <Heading as="h2" size="md">Community Agreements</Heading>
        <Text fontSize="lg">
          When you join Crossroads, you agree to a set of community agreements. These are not
          fine print — they are an explicit, shared understanding of how we want to be together.
          They are grounded in respect, consent, and care for the places and people we encounter
          here.
        </Text>
        <Text fontSize="lg">
          Individual groups may also have their own agreements that apply within that space.
        </Text>
      </VStack>

      <VStack align="start" gap={4}>
        <Heading as="h2" size="md">Conversations &amp; Content</Heading>
        <Text fontSize="lg">
          Groups can host threaded conversations (Threadworks), maintain shared content
          collections, and post writing and announcements. Everything stays within the group
          unless explicitly shared more broadly.
        </Text>
      </VStack>

      <VStack align="start" gap={4}>
        <Heading as="h2" size="md">Privacy &amp; Visibility</Heading>
        <Text fontSize="lg">
          You control what others see. Groups can be public, private, or hidden. Member
          profiles within a group are visible only to fellow members. Crossroads does not sell
          data or use your activity for advertising.
        </Text>
      </VStack>
    </VStack>
  );
}
