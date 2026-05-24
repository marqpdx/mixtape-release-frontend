"use client";

import { useMemo } from "react";
import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  Link,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { IconArrowRight, IconFolder, IconShoppingBag, IconUsers } from "@tabler/icons-react";
import type { Group } from "@mixtape/core/types/groupTypes";
import { useGroupWelcomePin, useMembers } from "@mixtape/api/hooks";
import { useCollections } from "@mixtape/api/hooks/stackroom/useCollections";
import { useStall } from "@mixtape/api/hooks/useBazaar";

interface GroupLandingBOverviewProps {
  group: Group;
  onNavigateToTab?: (tab: string) => void;
}

type TipTapLikeNode = {
  text?: string;
  content?: TipTapLikeNode[];
};

function collectNodeText(node: TipTapLikeNode | null | undefined): string {
  if (!node) return "";
  let out = node.text || "";
  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      out += ` ${collectNodeText(child)}`;
    }
  }
  return out;
}

function truncateWords(input: string, limit: number): string {
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) return input.trim();
  return `${words.slice(0, limit).join(" ")}...`;
}

function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Flex
        align="baseline"
        justify="space-between"
        pb={3}
        mb={4}
        borderBottom="1px solid"
        borderColor="theme.border"
        gap={4}
      >
        <Text fontFamily="Georgia, 'Times New Roman', serif" fontSize="lg" color="theme.text">
          {title}
        </Text>
        {meta ? (
          <Text
            fontFamily="mono"
            fontSize="10px"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color="theme.textSecondary"
          >
            {meta}
          </Text>
        ) : null}
      </Flex>
      {children}
    </Box>
  );
}

export function GroupLandingBOverview({
  group,
  onNavigateToTab,
}: GroupLandingBOverviewProps) {
  const { pin: welcomePin } = useGroupWelcomePin(group.slug);
  const { activeMembers, adminMembers, stewardMembers, isLoading: membersLoading } = useMembers(group.slug);
  const { collections } = useCollections({ sponsor_type: "group", sponsor_id: group.id });
  const { stall } = useStall("group", group.id);

  const welcomeText = useMemo(() => {
    const body = welcomePin?.display?.body_json || welcomePin?.piece.body_json;
    const extracted = collectNodeText(body as TipTapLikeNode | undefined).replace(/\s+/g, " ").trim();
    const excerpt = welcomePin?.display?.excerpt?.trim() || welcomePin?.piece.excerpt?.trim();
    const summary = group.summary?.trim() || group.description?.trim();
    return truncateWords(excerpt || extracted || summary || "This group is still writing its welcome note.", 85);
  }, [group.description, group.summary, welcomePin]);

  const leaders = useMemo(() => {
    const stewards = stewardMembers.filter((member) => !member.roles.includes("admin"));
    return [...adminMembers, ...stewards].slice(0, 5);
  }, [adminMembers, stewardMembers]);

  const totalItems = collections?.reduce((sum, collection) => sum + (collection.item_count || 0), 0) ?? 0;

  return (
    <Stack gap={12}>
      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={{ base: 8, lg: 12 }}>
        <Section title="I · From the room" meta={welcomePin ? "WELCOME PINNED" : "GROUP SUMMARY"}>
          <Text
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize={{ base: "md", md: "lg" }}
            lineHeight="1.75"
            color="theme.textSecondary"
          >
            {welcomeText}
          </Text>
          {welcomePin?.piece.slug ? (
            <Link as={NextLink} href={`/groups/${group.slug}/writing/${welcomePin.piece.slug}`}>
              <Button mt={5} variant="outline" size="sm">
                Read full welcome
              </Button>
            </Link>
          ) : null}
        </Section>

        <Section title="II · What&apos;s active" meta="LIVE STATUS">
          <Stack gap={5}>
            <Box>
              <Text
                fontFamily="Georgia, 'Times New Roman', serif"
                fontSize={{ base: "2xl", md: "3xl" }}
                lineHeight="1.2"
                color="theme.text"
              >
                {group.member_count || activeMembers.length || 0} members are shaping this room.
              </Text>
              <Text mt={3} color="theme.textSecondary" lineHeight="1.7">
                Conversations, collections, and member notes all live here. Use the tabs below to move through the group the same way you do in the current member view.
              </Text>
            </Box>

            <HStack gap={3} flexWrap="wrap">
              <Button
                size="sm"
                onClick={() => onNavigateToTab?.("threadworks")}
                bg="theme.text"
                color="theme.bg"
                _hover={{ opacity: 0.9 }}
              >
                Open conversations
              </Button>
              <Button size="sm" variant="outline" onClick={() => onNavigateToTab?.("collections")}>
                Browse collections
              </Button>
            </HStack>

            <Text
              fontFamily="mono"
              fontSize="11px"
              letterSpacing="0.08em"
              textTransform="uppercase"
              color="theme.textSecondary"
            >
              {stall?.offerings_count
                ? `${stall.offerings_count} bazaar offering${stall.offerings_count === 1 ? "" : "s"} live`
                : "No bazaar offerings live right now"}
            </Text>
          </Stack>
        </Section>

        <Section title="III · Library and contributors" meta="PEOPLE + RESOURCES">
          <Stack gap={6}>
            <Box>
              <HStack gap={2} mb={2} color="theme.text">
                <IconFolder size={16} />
                <Text fontWeight="600">Collections</Text>
              </HStack>
              {collections && collections.length > 0 ? (
                <VStack align="stretch" gap={2}>
                  <Text color="theme.textSecondary" lineHeight="1.7">
                    {collections.length} collection{collections.length === 1 ? "" : "s"} holding {totalItems} item{totalItems === 1 ? "" : "s"}.
                  </Text>
                  {collections.slice(0, 3).map((collection) => (
                    <Text key={collection.id} fontFamily="Georgia, 'Times New Roman', serif" color="theme.text">
                      {collection.title}
                    </Text>
                  ))}
                </VStack>
              ) : (
                <Text color="theme.textSecondary">No collections have been pinned here yet.</Text>
              )}
            </Box>

            <Box>
              <HStack gap={2} mb={3} color="theme.text">
                <IconUsers size={16} />
                <Text fontWeight="600">Stewards</Text>
              </HStack>
              {membersLoading ? (
                <Text color="theme.textSecondary">Loading contributors…</Text>
              ) : leaders.length > 0 ? (
                <VStack align="stretch" gap={3}>
                  {leaders.map((member) => {
                    const displayName = member.display_name || member.username || "Member";
                    const role = member.roles.includes("admin") ? "Admin" : "Steward";
                    return (
                      <HStack key={member.member_id} gap={3}>
                        <Avatar.Root size="sm" bg="theme.border">
                          {member.profile_image ? (
                            <Avatar.Image src={member.profile_image} alt={displayName} />
                          ) : (
                            <Avatar.Fallback>{displayName.charAt(0).toUpperCase()}</Avatar.Fallback>
                          )}
                        </Avatar.Root>
                        <Box>
                          <Text color="theme.text">{displayName}</Text>
                          <Text fontSize="xs" color="theme.textSecondary">
                            {role}
                          </Text>
                        </Box>
                      </HStack>
                    );
                  })}
                </VStack>
              ) : (
                <Text color="theme.textSecondary">No stewards are listed yet.</Text>
              )}
            </Box>
          </Stack>
        </Section>
      </SimpleGrid>

      <Box
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="theme.border"
        py={6}
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap={4}
        >
          <Box>
            <Text
              fontFamily="mono"
              fontSize="10px"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="theme.accent"
              mb={2}
            >
              IV · Threads of intention
            </Text>
            <Text
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize={{ base: "xl", md: "2xl" }}
              color="theme.text"
              lineHeight="1.35"
            >
              Continue into the live conversation space, or move sideways into the group&apos;s shared library and member roster.
            </Text>
          </Box>
          <Stack direction={{ base: "column", sm: "row" }} gap={3}>
            <Button onClick={() => onNavigateToTab?.("threadworks")}>
              Open conversations
            </Button>
            {stall?.offerings_count ? (
              <Link as={NextLink} href={`/groups/${group.slug}/stall`}>
                <Button variant="outline">
                  <IconShoppingBag size={16} />
                  View stall
                </Button>
              </Link>
            ) : (
              <Button variant="outline" onClick={() => onNavigateToTab?.("members")}>
                Meet members
                <IconArrowRight size={16} />
              </Button>
            )}
          </Stack>
        </Flex>
      </Box>
    </Stack>
  );
}
