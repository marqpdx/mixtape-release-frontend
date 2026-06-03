"use client";

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
import type { GroupMemberViewData } from "../member-views/useGroupMemberViewData";

interface GroupLandingBOverviewProps {
  viewData: GroupMemberViewData;
  onNavigateToTab?: (tab: string) => void;
  onOpenCollection?: (collectionId: string) => void;
}

function parseSectionTitle(title: string): [string | null, string] {
  const m = title.match(/^([IVX]+\s·)\s*(.+)$/i);
  return m ? [m[1], m[2]] : [null, title];
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
  const [numeral, rest] = parseSectionTitle(title);
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
          as="span"
          fontFamily="mono"
          fontSize="10px"
          textTransform="uppercase"
        >
          {numeral && (
            <Box as="span" color="theme.accent" letterSpacing="1.2px">
              {numeral}{" "}
            </Box>
          )}
          <Box
            as="span"
            color="theme.textMuted"
            letterSpacing={variant === "primary" ? "1.2px" : "0.12em"}
          >
            {rest}
          </Box>
        </Text>
        {meta ? (
          <Text
            fontFamily="mono"
            fontSize="10px"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color="theme.textMuted"
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
  viewData,
  onNavigateToTab,
  onOpenCollection,
}: GroupLandingBOverviewProps) {
  const { group } = viewData;
  const aboutText = viewData.copy.about;
  const leaders = viewData.members.leaders;
  const orderedCollections = viewData.collections.ordered;
  const isAdminOrSteward = viewData.permissions.canModerateGroup;

  const showDropCap = Boolean(aboutText && aboutText.length >= 100);

  return (
    <Stack className="glbo-root" gap={12}>
      <SimpleGrid className="glbo-grid" columns={{ base: 1, lg: 3 }} gap={{ base: 8, lg: 10, xl: 12 }} alignItems="start">
        {/* I · About Us */}
        <Section title="I · About us">
          <Text
            fontFamily="serifBody"
            fontSize="17px"
            lineHeight="1.65"
            color="theme.text"
            maxW="64ch"
            whiteSpace="pre-wrap"
            _firstLetter={showDropCap ? {
              fontSize: "56px",
              lineHeight: "0.82",
              fontWeight: "600",
              mr: "0.15em",
              mt: "0.25em",
              float: "left",
              color: "theme.text",
            } : undefined}
          >
            {aboutText || "This group is still writing its introduction."}
          </Text>
          {viewData.copy.authorLabel && (
            <Text
              fontFamily="mono"
              fontSize="10px"
              letterSpacing="0.1em"
              textTransform="uppercase"
              color="theme.textSecondary"
              mt={5}
            >
              {viewData.copy.authorLabel}
            </Text>
          )}
        </Section>

        <Stack className="glbo-middle-col" gap={8}>
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
                <Button
                  size="xs"
                  bg="theme.text"
                  color="theme.bg"
                  _hover={{ opacity: 0.88 }}
                >
                  Submit a reply
                </Button>
              </HStack>

              {viewData.bazaar.offeringsCount ? (
                <Text
                  fontFamily="mono"
                  fontSize="11px"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  color="theme.textMuted"
                >
                  {viewData.bazaar.offeringsCount} bazaar offering{viewData.bazaar.offeringsCount === 1 ? "" : "s"} live
                </Text>
              ) : null}
            </Stack>
          </Section>

          <Section title="Announcements" variant="sub">
            <Text
              fontFamily="serifBody"
              fontSize="14px"
              fontStyle="italic"
              color="theme.textMuted"
              lineHeight="1.55"
            >
              None this week. The board is clear.
            </Text>
          </Section>
        </Stack>

        <Stack className="glbo-right-col" gap={8}>
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
                            <Text
                              fontFamily="mono"
                              fontSize="10px"
                              letterSpacing="0.08em"
                              color="theme.textFaint"
                              flexShrink={0}
                              minW="28px"
                              textAlign="right"
                              pt="3px"
                            >
                              {collection.item_count ?? 0}
                            </Text>
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
                <Text
                  fontFamily="serifBody"
                  fontSize="14px"
                  fontStyle="italic"
                  color="theme.textMuted"
                >
                  No collections have been pinned here yet.
                </Text>
              )}
            </Stack>
          </Section>

          <Section title="Contributors" variant="sub">
            <Box>
              {viewData.members.isLoading ? (
                <Text
                  fontFamily="serifBody"
                  fontSize="14px"
                  fontStyle="italic"
                  color="theme.textMuted"
                >
                  Loading contributors…
                </Text>
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
                          <Text fontSize="xs" color="theme.textMuted">
                            {role}
                          </Text>
                        </Box>
                      </HStack>
                    );
                  })}
                </VStack>
              ) : (
                <Text
                  fontFamily="serifBody"
                  fontSize="14px"
                  fontStyle="italic"
                  color="theme.textMuted"
                >
                  No contributors listed yet.
                </Text>
              )}
            </Box>
          </Section>
        </Stack>
      </SimpleGrid>

      {/* IV · Threads of intention */}
      <Box
        className="glbo-threads"
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
              letterSpacing="1.2px"
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
          <Stack direction={{ base: "column", sm: "row" }} gap={3} flexShrink={0}>
            <Button
              bg="theme.accent"
              color="white"
              _hover={{ opacity: 0.9 }}
              onClick={() => onNavigateToTab?.("threadworks")}
            >
              Open conversations
            </Button>
            {viewData.bazaar.offeringsCount ? (
              <Link as={NextLink} href={`/groups/${group.slug}/stall`}>
                <Button
                  variant="outline"
                  borderColor="theme.border"
                  color="theme.textSecondary"
                  _hover={{ bg: "theme.bgSubtle" }}
                >
                  <IconShoppingBag size={16} />
                  View stall
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                borderColor="theme.border"
                color="theme.textSecondary"
                _hover={{ bg: "theme.bgSubtle" }}
                onClick={() => onNavigateToTab?.("members")}
              >
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
