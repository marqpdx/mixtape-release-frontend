// app/invite/welcome/page.tsx
"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Link,
  Collapsible,
  Avatar,
  AvatarGroup,
  IconButton,
} from "@chakra-ui/react";
import { useSearchParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import { useState, useMemo } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconUsers,
  IconMessageCircle,
  IconBook,
  IconMap,
  IconArrowRight,
} from "@tabler/icons-react";
import { Divider } from "@components/common/Divider";

export default function GroupWelcomeInvitePage() {
  const params = useSearchParams();
  const router = useRouter();

  // Expecting ?group=Name&inviter=Person&token=xyz
  const groupName = params?.get("group") || "Your Group";
  const inviter = params?.get("inviter") || "A Member";
  const token = params?.get("token") || "";

  // Optional avatar URL via query, fallback to initials from group name
  const groupAvatarUrl = params?.get("avatar") || "";
  const initials = useMemo(() =>
    groupName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
    [groupName]
  );

  const [openGroup, setOpenGroup] = useState(true);
  const [openCrossroads, setOpenCrossroads] = useState(false);

  const continueToAgreements = () => {
    // Optionally validate token here or call API; for now, forward the group name for context on the Agreements page
    router.push(`/welcome/agreements?group=${encodeURIComponent(groupName)}${token ? `&token=${encodeURIComponent(token)}` : ""}`);
  };

  return (
    <Box minH="100vh" bg="theme.bg" py={{ base: 10, md: 14 }} px={{ base: 6, md: 8 }}>
      <Container maxW="6xl" px={0}>
        {/* Header */}
        <HStack justify="space-between" align="center" mb={8} wrap="wrap" gap={4}>
          <VStack align="start" gap={1}>
            <Text fontSize="sm" color="theme.textSecondary" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
              Group Invitation
            </Text>
            <Heading as="h1" size="xl" color="theme.text" fontWeight="800">
              Welcome to {groupName}
            </Heading>
            <Text color="theme.textSecondary">You were invited by {inviter}. Let's get you oriented.</Text>
          </VStack>
          <Link as={NextLink} href="/login" color="theme.textSecondary" _hover={{ color: "theme.accent" }}>
            Already have an account? Sign in
          </Link>
        </HStack>

        {/* Two-column layout */}
        <Box display={{ base: "block", lg: "grid" }} gridTemplateColumns={{ lg: "1fr 2fr" }} gap={8}>
          {/* Left Card: Group Overview (1/3) */}
          <Box bg="theme.surface" border="1px solid" borderColor="theme.border" borderRadius="2xl" p={6}>
            <HStack gap={4} align="center">
              <AvatarGroup>
              <Avatar.Root size="lg">
                <Avatar.Fallback>{initials}</Avatar.Fallback>
                {groupAvatarUrl ? (
                  <Avatar.Image src={groupAvatarUrl} alt={groupName} />
                ) : null}
              </Avatar.Root>
            </AvatarGroup>
              <VStack align="start" gap={1}>
                <Heading as="h2" size="md" color="theme.text">{groupName}</Heading>
                <Text fontSize="sm" color="theme.textSecondary">A short welcome from the group stewards.</Text>
              </VStack>
            </HStack>

            <Text mt={4} color="theme.text" lineHeight="1.8">
              Thanks for joining us. Inside you'll find our group chat, forum, documents, and upcoming gatherings.
              Please take a moment to review the community agreements that help keep this space welcoming.
            </Text>

            <Divider my={5} borderColor="theme.border" />

            <VStack align="stretch" gap={2} color="theme.textSecondary" fontSize="sm">
              <HStack gap={2}><IconUsers size={16} /><Text>Members-only spaces with clear boundaries</Text></HStack>
              <HStack gap={2}><IconMessageCircle size={16} /><Text>Default Group Chat and topic threads</Text></HStack>
              <HStack gap={2}><IconBook size={16} /><Text>Group documents and courses (if enabled)</Text></HStack>
            </VStack>

            <Button
              mt={6}
              w="full"
              bg="theme.accent"
              color="white"
              borderRadius="xl"
              size="lg"
              onClick={continueToAgreements}
              _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
            >
              <IconArrowRight size={18} /> Continue to agreements
            </Button>
          </Box>

          {/* Right Panel: Crossroads Orientation (2/3) */}
          <Box>
            <VStack align="stretch" gap={6}>
              <Box>
                <Heading as="h2" size="md" color="theme.text" mb={2}>
                  A quick orientation
                </Heading>
                <Text color="theme.textSecondary">
                  You’re about to enter <b>{groupName}</b>. That gives you full access to this group’s spaces.
                  Mixtape also has a wider community called <b>Crossroads</b>. You don’t need to join Crossroads to
                  participate here — but if you do, you’ll unlock discovery, personal circles, and platform-wide forums.
                </Text>
              </Box>

              {/* Collapsible: What you get here */}
              <Box bg="theme.surface" border="1px solid" borderColor="theme.border" borderRadius="xl" p={0}>
                <Collapsible.Root open={openGroup} onOpenChange={({ open }) => setOpenGroup(open)}>
                  <Collapsible.Trigger asChild>
                    <Button variant="ghost" size="lg" w="full" justifyContent="space-between" borderTopLeftRadius="xl" borderTopRightRadius="xl" px={5}>
                      <HStack gap={3}><Heading as="h3" size="sm" color="theme.text">What you get in this group</Heading></HStack>
                      {openGroup ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                    </Button>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <VStack align="start" gap={2} px={5} pb={5} pt={2} color="theme.textSecondary">
                      <Text>• Group identity and announcements</Text>
                      <Text>• Group-only chat and sub-teams</Text>
                      <Text>• Group forum (Threadworks)</Text>
                      <Text>• Group docs (Dispatch) and courses/events (EarthLab)</Text>
                      <Text>• Group presence on the map (Tapestry)</Text>
                    </VStack>
                  </Collapsible.Content>
                </Collapsible.Root>
              </Box>

              {/* Collapsible: What Crossroads adds */}
              <Box bg="theme.surface" border="1px solid" borderColor="theme.border" borderRadius="xl" p={0}>
                <Collapsible.Root open={openCrossroads} onOpenChange={({ open }) => setOpenCrossroads(open)}>
                  <Collapsible.Trigger asChild>
                    <Button variant="ghost" size="lg" w="full" justifyContent="space-between" borderTopLeftRadius="xl" borderTopRightRadius="xl" px={5}>
                      <HStack gap={3}><Heading as="h3" size="sm" color="theme.text">What Crossroads adds (optional)</Heading></HStack>
                      {openCrossroads ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                    </Button>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <VStack align="start" gap={2} px={5} pb={5} pt={2} color="theme.textSecondary">
                      <Text>• Platform-wide discovery and public forums</Text>
                      <Text>• Create your own Circles and invite friends</Text>
                      <Text>• Personal profile on Tapestry (place-aware)</Text>
                      <Text>• $3/mo with 30-day free trial — join anytime</Text>
                      <HStack pt={2}>
                        <Link as={NextLink} href="/welcome/start" _hover={{ textDecoration: "none" }}>
                          <Button size="sm" variant="outline" borderRadius="lg">
                            Also join Crossroads
                          </Button>
                        </Link>
                        <Text fontSize="sm" color="theme.textSecondary">(optional)</Text>
                      </HStack>
                    </VStack>
                  </Collapsible.Content>
                </Collapsible.Root>
              </Box>

              <Text fontSize="sm" color="theme.textSecondary">
                You can join {groupName} now and decide about Crossroads later. Your notification and privacy settings are always in your control.
              </Text>
            </VStack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
