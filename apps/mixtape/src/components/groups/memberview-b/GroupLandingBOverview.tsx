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
import { IconArrowRight, IconShoppingBag } from "@tabler/icons-react";
import type { Group } from "@mixtape/core/types/groupTypes";
import { canUserModerateGroup } from "@mixtape/core/types/groupTypes";
import { useMembers } from "@mixtape/api/hooks";
import { useCollections } from "@mixtape/api/hooks/stackroom/useCollections";
import { useStall } from "@mixtape/api/hooks/useBazaar";

interface GroupLandingBOverviewProps {
  group: Group;
  onNavigateToTab?: (tab: string) => void;
  onOpenCollection?: (collectionId: string) => void;
}

function Section({
  title,
  meta,
  variant = "primary",
  children,
}: {
  title: string;
  meta?: string;
  variant?: "primary" | "sub";
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Flex
        align="baseline"
        justify="space-between"
        pb={variant === "primary" ? 3 : 2}
        mb={variant === "primary" ? 4 : 3}
        borderBottom="1px solid"
        borderColor="theme.border"
        gap={4}
        borderBottomWidth={variant === "primary" ? "1px" : "0.5px"}
      >
        <Text
          fontFamily="mono"
          fontSize="10px"
          letterSpacing={variant === "primary" ? "2px" : "0.12em"}
          textTransform="uppercase"
          color="theme.textSecondary"
        >
          {title}
        </Text>
        {meta ? (
          <Text
            fontFamily="mono"
            fontSize="10px"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color="theme.textSecondary"
            opacity={0.6}
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
  onOpenCollection,
}: GroupLandingBOverviewProps) {
  const { adminMembers, stewardMembers, isLoading: membersLoading } = useMembers(group.slug);
  const { collections } = useCollections({ sponsor_type: "group", sponsor_id: group.id });
  const { stall } = useStall("group", group.id);
  const isAdminOrSteward = canUserModerateGroup(group);

  const aboutText = group.body?.trim() || group.description?.trim() || "";

  const leaders = useMemo(() => {
    const stewards = stewardMembers.filter((member) => !member.roles.includes("admin"));
    return [...adminMembers, ...stewards].slice(0, 5);
  }, [adminMembers, stewardMembers]);

  const orderedCollections = useMemo(() => {
    if (!collections) return [];
    return [...collections].sort((a, b) => {
      if (a.title === "Core Resources") return -1;
      if (b.title === "Core Resources") return 1;
      return a.title.localeCompare(b.title);
    });
  }, [collections]);

  return (
    <Stack gap={12}>
      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={{ base: 8, lg: 10, xl: 12 }} alignItems="start">
        {/* I · About Us */}
        <Section title="I · About us">
          <Text
            fontFamily="serifBody"
            fontSize={{ base: "md", md: "lg" }}
            lineHeight="1.8"
            color="theme.textSecondary"
            whiteSpace="pre-wrap"
            _firstLetter={{
              fontSize: { base: "4rem", md: "6rem" },
              lineHeight: "1",
              fontWeight: "600",
              mr: "0.1em",
              mt: "0.25em",
              float: "left",
              color: "theme.text",
            }}
          >
            {aboutText || "This group is still writing its introduction."}
          </Text>
          {(group.author_name || group.submitted_by_username) && (
            <Text
              fontFamily="mono"
              fontSize="10px"
              letterSpacing="0.1em"
              textTransform="uppercase"
              color="theme.textSecondary"
              mt={5}
            >
              {group.author_name || group.submitted_by_username}
              {group.submitted_by_username && group.author_name
                ? ` — ${group.submitted_by_username}`
                : ""}
              {" · group steward"}
            </Text>
          )}
        </Section>

        <Stack gap={8}>
          {/* II · Open Question */}
          <Section title="II · Open question">
            <Stack gap={5}>
              <Text
                fontFamily="serifBody"
                fontSize={{ base: "lg", md: "xl" }}
                lineHeight="1.4"
                color="theme.text"
                fontStyle="italic"
              >
                What&apos;s a small thing you noticed this week that nobody else seems to have?
              </Text>

              <HStack gap={3} flexWrap="wrap">
                <Button size="xs" variant="outline">
                  Submit a reply
                </Button>
              </HStack>

              {stall?.offerings_count ? (
                <Text
                  fontFamily="mono"
                  fontSize="11px"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  color="theme.textSecondary"
                >
                  {stall.offerings_count} bazaar offering{stall.offerings_count === 1 ? "" : "s"} live
                </Text>
              ) : null}
            </Stack>
          </Section>

          <Section title="Announcements" variant="sub">
            <Text
              fontFamily="serifBody"
              fontSize="14px"
              fontStyle="italic"
              color="theme.textSecondary"
              opacity={0.6}
              lineHeight="1.5"
            >
              None this week. The board is clear.
            </Text>
          </Section>
        </Stack>

        <Stack gap={8}>
          {/* III · Library */}
          <Section title="III · Library">
            <Stack gap={5}>
              {orderedCollections.length > 0 ? (
                <VStack align="stretch" gap={4}>
                  {orderedCollections.map((collection) => (
                    <Box key={collection.id}>
                      <Box
                        asChild
                        _hover={{ opacity: 0.82 }}
                        transition="opacity 0.15s ease"
                      >
                        <button
                          type="button"
                          onClick={() => onOpenCollection?.(String(collection.id))}
                          style={{ width: "100%", textAlign: "left" }}
                        >
                          <HStack gap={3} align="start">
                            {/* Item count — left column */}
                            <Text
                              fontFamily="mono"
                              fontSize="10px"
                              letterSpacing="0.08em"
                              color="theme.textSecondary"
                              flexShrink={0}
                              minW="28px"
                              textAlign="right"
                              pt="3px"
                            >
                              {collection.item_count ?? 0}
                            </Text>
                            {/* Title + summary — right column */}
                            <Box flex="1">
                              <Text
                                fontFamily="serifBody"
                                fontWeight="600"
                                fontSize={{ base: "md", md: "md" }}
                                lineHeight="1.3"
                                color="theme.text"
                                mb={collection.summary ? 1 : 0}
                              >
                                {collection.title}
                              </Text>
                              {collection.summary?.trim() ? (
                                <Text
                                  fontFamily="serifBody"
                                  fontSize="sm"
                                  fontStyle="italic"
                                  color="theme.textSecondary"
                                  lineHeight="1.6"
                                  opacity={0.8}
                                >
                                  {collection.summary.trim()}
                                </Text>
                              ) : isAdminOrSteward ? (
                                <Text
                                  fontFamily="mono"
                                  fontSize="10px"
                                  letterSpacing="0.08em"
                                  textTransform="uppercase"
                                  color="theme.accent"
                                  opacity={0.7}
                                >
                                  Add summary
                                </Text>
                              ) : null}
                            </Box>
                          </HStack>
                        </button>
                      </Box>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text color="theme.textSecondary">No collections have been pinned here yet.</Text>
              )}
            </Stack>
          </Section>

          <Section title="Contributors" variant="sub">
            <Box>
              {membersLoading ? (
                <Text color="theme.textSecondary">Loading contributors…</Text>
              ) : leaders.length > 0 ? (
                <VStack align="stretch" gap={4}>
                  {leaders.map((member) => {
                    const displayName = member.display_name || member.username || "Member";
                    const role = member.roles.includes("admin") ? "Admin" : "Steward";
                    return (
                      <HStack key={member.member_id} gap={3} align="start">
                        <Avatar.Root size="sm" bg="theme.border">
                          {member.profile_image ? (
                            <Avatar.Image src={member.profile_image} alt={displayName} />
                          ) : (
                            <Avatar.Fallback>{displayName.charAt(0).toUpperCase()}</Avatar.Fallback>
                          )}
                        </Avatar.Root>
                        <Box>
                          <Text color="theme.text" fontFamily="serifBody" fontWeight="600">
                            {displayName}
                          </Text>
                          <Text fontSize="xs" color="theme.textSecondary">
                            {role}
                          </Text>
                        </Box>
                      </HStack>
                    );
                  })}
                </VStack>
              ) : (
                <Text color="theme.textSecondary">No contributors listed yet.</Text>
              )}
            </Box>
          </Section>
        </Stack>
      </SimpleGrid>

      {/* IV · Threads of intention */}
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
              fontFamily="serifBody"
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
