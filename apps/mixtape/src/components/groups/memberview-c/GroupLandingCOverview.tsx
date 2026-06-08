"use client";

import {
  Avatar,
  Box,
  Grid,
  HStack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { IconChevronRight, IconFolder, IconPin } from "@tabler/icons-react";
import Link from "next/link";
import { TipTapRenderer } from "@components/tiptap/TipTapRenderer";
import type { TipTapDocument } from "@components/tiptap/TipTapRenderer";
import type { GroupMemberViewData } from "../member-views/useGroupMemberViewData";
import type { GroupMembership } from "@mixtape/core/types/groupTypes";

interface GroupLandingCOverviewProps {
  viewData: GroupMemberViewData;
  onNavigateToTab?: (tab: string) => void;
  onOpenCollection?: (collectionId: string) => void;
}

const WELCOME_INLINE_WORD_LIMIT = 55;
const WELCOME_PREVIEW_WORD_LIMIT = 55;

type TipTapLikeNode = {
  type?: string;
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

function bodyHasImage(node: TipTapLikeNode | null | undefined): boolean {
  if (!node) return false;
  if (node.type === "image") return true;
  if (node.content && Array.isArray(node.content)) {
    return node.content.some((child) => bodyHasImage(child));
  }
  return false;
}

function truncateWordsAtBoundary(input: string, limit: number): string {
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) return input.trim();
  return `${words.slice(0, limit).join(" ")}...`;
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <Text
      as="span"
      fontFamily="mono"
      fontSize="11px"
      letterSpacing="0.16em"
      textTransform="uppercase"
      color="theme.textMuted"
    >
      {children}
    </Text>
  );
}

function Card({
  children,
  accentRail = false,
}: {
  children: React.ReactNode;
  accentRail?: boolean;
}) {
  return (
    <Box
      className="glco-card"
      bg="theme.surface"
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="16px"
      px="28px"
      py="26px"
      pl={accentRail ? "34px" : "28px"}
      position="relative"
      _before={
        accentRail
          ? {
              content: '""',
              position: "absolute",
              top: "18px",
              bottom: "18px",
              left: "16px",
              width: "3px",
              borderRadius: "full",
              bg: "theme.accent",
              opacity: 0.85,
            }
          : undefined
      }
    >
      {children}
    </Box>
  );
}

function memberRoleLabel(member: GroupMembership): { label: string; isSteward: boolean } {
  if (member.roles.includes("admin")) return { label: "Admin", isSteward: true };
  if (member.roles.includes("steward")) return { label: "Steward", isSteward: true };
  return { label: "Member", isSteward: false };
}

function MemberRow({ member }: { member: GroupMembership }) {
  const displayName = member.display_name || member.username || "Member";
  const { label, isSteward } = memberRoleLabel(member);
  return (
    <HStack className="glco-member-row" gap={3} align="center" py="8px">
      <Avatar.Root size="sm" w="34px" h="34px" bg="theme.border">
        {member.profile_image ? (
          <Avatar.Image src={member.profile_image} alt={displayName} />
        ) : (
          <Avatar.Fallback>{displayName.charAt(0).toUpperCase()}</Avatar.Fallback>
        )}
      </Avatar.Root>
      <Box minW={0}>
        <Text
          fontSize="14.5px"
          fontWeight="600"
          color="theme.text"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {displayName}
        </Text>
        <Text fontFamily="mono" fontSize="10.5px" textTransform="uppercase" color="theme.textMuted">
          {isSteward && (
            <Box as="span" color="theme.accent">
              ◆{" "}
            </Box>
          )}
          {label}
        </Text>
      </Box>
    </HStack>
  );
}

export function GroupLandingCOverview({
  viewData,
  onNavigateToTab,
  onOpenCollection,
}: GroupLandingCOverviewProps) {
  const { group } = viewData;
  const welcomePin = viewData.overview.welcomePin;
  const welcomeTitle = welcomePin?.display?.title || welcomePin?.piece.title;
  const welcomeBody = (welcomePin?.display?.body_json || welcomePin?.piece.body_json) as
    | TipTapLikeNode
    | undefined;
  const welcomeText = collectNodeText(welcomeBody).replace(/\s+/g, " ").trim();
  const welcomeWordCount = welcomeText ? welcomeText.split(/\s+/).length : 0;
  const welcomeHasImage = bodyHasImage(welcomeBody);
  const welcomeShouldShowReadMore = welcomeHasImage || welcomeWordCount > WELCOME_INLINE_WORD_LIMIT;
  const welcomeExcerptFallback = (welcomePin?.display?.excerpt || welcomePin?.piece.excerpt || "").trim();
  const welcomePreviewText =
    welcomeExcerptFallback || truncateWordsAtBoundary(welcomeText, WELCOME_PREVIEW_WORD_LIMIT);

  const aboutText = viewData.copy.about;
  const members = viewData.members.active.length ? viewData.members.active : viewData.members.all;
  const visibleMembers = members.slice(0, 5);
  const remainingCount = Math.max(viewData.members.memberCount - visibleMembers.length, 0);
  const collections = viewData.collections.ordered;

  return (
    <Grid
      className="glco-grid"
      templateColumns={{ base: "1fr", lg: "1fr 330px" }}
      gap="24px"
      alignItems="start"
    >
      <Stack className="glco-col-main" gap="20px">
        {/* Pinned welcome — the group's actual pinned writing piece, when one exists */}
        <Card accentRail>
          {welcomePin ? (
            <>
              <HStack gap="10px" mb="10px" align="center">
                <Kicker>Welcome</Kicker>
                <HStack
                  gap="4px"
                  align="center"
                  bg="theme.accentSoft"
                  color="theme.accent"
                  borderRadius="full"
                  px="8px"
                  py="2px"
                  fontSize="11px"
                  fontWeight="600"
                >
                  <IconPin size={11} />
                  <Text as="span">Pinned</Text>
                </HStack>
              </HStack>
              <Text fontFamily="serifBody" fontWeight="600" fontSize="19px" color="theme.text" mb={3}>
                {welcomeTitle}
              </Text>

              {welcomeBody && !welcomeShouldShowReadMore ? (
                <TipTapRenderer content={welcomeBody as TipTapDocument} />
              ) : welcomePreviewText ? (
                <Text fontSize="15.5px" lineHeight="1.65" color="theme.textSecondary">
                  {welcomePreviewText}
                </Text>
              ) : welcomeHasImage ? (
                <Text fontSize="15.5px" lineHeight="1.65" color="theme.textSecondary">
                  This welcome note includes rich media.
                </Text>
              ) : (
                <Text fontSize="15.5px" lineHeight="1.65" color="theme.textSecondary">
                  Welcome to {group.title}.
                </Text>
              )}

              {welcomeShouldShowReadMore && welcomePin.piece.slug && (
                <Box asChild mt={3} _hover={{ opacity: 0.8 }} transition="opacity 0.15s ease">
                  <Link href={`/groups/${group.slug}/writing/${welcomePin.piece.slug}`}>
                    <HStack gap="2px" align="center">
                      <Kicker>Read more</Kicker>
                      <IconChevronRight size={13} style={{ color: "var(--theme-text-faint)" }} />
                    </HStack>
                  </Link>
                </Box>
              )}
            </>
          ) : (
            <>
              <Kicker>Welcome</Kicker>
              <Text fontFamily="serifBody" fontWeight="600" fontSize="19px" color="theme.text" mt="12px" mb={3}>
                Welcome to {group.title}
              </Text>
              <VStack align="stretch" gap={3}>
                <Text fontSize="15.5px" lineHeight="1.65" color="theme.textSecondary">
                  This is your group&apos;s home. Use the tabs above to browse members, conversations, and content.
                </Text>
                <Text fontSize="15.5px" lineHeight="1.65" color="theme.textSecondary">
                  Click <Text as="span" fontWeight="600" color="theme.text">Me</Text> in the tab bar to set up your
                  group profile — a photo, a short intro, your intention. It&apos;s how other members get to know you here.
                </Text>
                <Text fontSize="15.5px" lineHeight="1.65" color="theme.textSecondary">
                  The <Text as="span" fontWeight="600" color="theme.text">Collections</Text> tab holds the
                  group&apos;s materials, links, and files.
                </Text>
              </VStack>
            </>
          )}
        </Card>

        {/* The group's own editable description */}
        <Card>
          <Kicker>About</Kicker>
          <Text fontFamily="serifBody" fontWeight="600" fontSize="19px" color="theme.text" mt="12px" mb={3}>
            What we&apos;re about
          </Text>
          <Text fontSize="15.5px" lineHeight="1.65" color="theme.textSecondary" whiteSpace="pre-wrap">
            {aboutText || "This group is still writing its introduction."}
          </Text>
        </Card>
      </Stack>

      <Stack className="glco-col-side" gap="20px">
        <Card>
          <HStack justify="space-between" align="baseline" mb={3}>
            <Text fontFamily="serifBody" fontWeight="600" fontSize="19px" color="theme.text">
              Members
            </Text>
            <Text fontFamily="mono" fontSize="11px" color="theme.textMuted">
              {viewData.members.memberCount}
            </Text>
          </HStack>
          {viewData.members.isLoading ? (
            <Text fontSize="14px" fontStyle="italic" color="theme.textMuted">
              Loading members…
            </Text>
          ) : visibleMembers.length > 0 ? (
            <VStack align="stretch" gap={0}>
              {visibleMembers.map((member) => (
                <MemberRow key={member.member_id} member={member} />
              ))}
            </VStack>
          ) : (
            <Text fontSize="14px" fontStyle="italic" color="theme.textMuted">
              No members yet.
            </Text>
          )}
          {remainingCount > 0 && (
            <Box asChild mt={3} _hover={{ opacity: 0.8 }} transition="opacity 0.15s ease">
              <button type="button" onClick={() => onNavigateToTab?.("members")}>
                <Kicker>+ {remainingCount} more</Kicker>
              </button>
            </Box>
          )}
        </Card>

        <Card>
          <HStack justify="space-between" align="baseline" mb={2}>
            <Text fontFamily="serifBody" fontWeight="600" fontSize="19px" color="theme.text">
              Collections
            </Text>
            <Text fontFamily="mono" fontSize="11px" color="theme.textMuted">
              {viewData.collections.count}
            </Text>
          </HStack>
          {viewData.collections.isLoading ? (
            <Text fontSize="14px" fontStyle="italic" color="theme.textMuted">
              Loading collections…
            </Text>
          ) : collections.length > 0 ? (
            <VStack align="stretch" gap={0}>
              {collections.map((collection, index) => (
                <Box
                  key={collection.id}
                  asChild
                  borderTopWidth={index > 0 ? "1px" : 0}
                  borderColor="theme.border"
                  py="12px"
                  _hover={{ opacity: 0.82 }}
                  transition="opacity 0.15s ease"
                >
                  <button
                    type="button"
                    onClick={() => onOpenCollection?.(String(collection.id))}
                    style={{ width: "100%", textAlign: "left" }}
                  >
                    <HStack gap={3} align="center">
                      <IconFolder size={22} style={{ color: "var(--theme-accent)" }} />
                      <Box flex="1" minW={0}>
                        <Text
                          fontSize="14.5px"
                          fontWeight="600"
                          color="theme.text"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                        >
                          {collection.title}
                        </Text>
                        <Text fontFamily="mono" fontSize="11px" color="theme.textMuted">
                          {collection.item_count ?? 0} items
                        </Text>
                      </Box>
                      <IconChevronRight size={15} style={{ color: "var(--theme-text-faint)" }} />
                    </HStack>
                  </button>
                </Box>
              ))}
            </VStack>
          ) : (
            <Text fontSize="14px" fontStyle="italic" color="theme.textMuted">
              No collections have been pinned here yet.
            </Text>
          )}
        </Card>
      </Stack>
    </Grid>
  );
}
