// apps/mixtape/src/components/groups/tabs/GroupOverviewTab.tsx

"use client";

import { useState } from "react";
import { Avatar, AvatarGroup, Box, Button, Card, Flex, Heading, Stack, Text, Badge, Grid, Collapsible, Link, GridItem, IconButton } from "@chakra-ui/react";
import { Tooltip } from "@components/ui/tooltip";
import { IconShoppingBag, IconFolder, IconChevronDown, IconChevronRight, IconX, IconMessage, IconSpeakerphone, IconUsers } from "@tabler/icons-react";
import NextLink from "next/link";
import type { Group, GroupOverviewBlock } from "@mixtape/core/types/groupTypes";
import { useGroupWelcomePin, useMembers, useGroupOverviewLayout } from "@mixtape/api/hooks";
import { useMyPermissions } from "@mixtape/api/hooks/groups/useGroupPermissions";
import { useStall } from "@mixtape/api/hooks/useBazaar";
import { useCollections } from "@mixtape/api/hooks/stackroom/useCollections";
import { TipTapRenderer } from "@components/tiptap/TipTapRenderer";

interface GroupOverviewTabProps {
  group: Group;
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

const DISMISSABLE_BLOCKS = [
  { key: "welcome", label: "Welcome", icon: IconMessage },
  { key: "announcements", label: "Announcements", icon: IconSpeakerphone },
  { key: "pinned_resources", label: "Core Resources", icon: IconFolder },
  { key: "member_highlights", label: "Members", icon: IconUsers },
] as const;

type DismissableKey = (typeof DISMISSABLE_BLOCKS)[number]["key"];

export function GroupOverviewTab({ group }: GroupOverviewTabProps) {
  const dismissStorageKey = `group:${group.slug}:dismissed-blocks`;
  const [dismissedBlocks, setDismissedBlocks] = useState<DismissableKey[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(dismissStorageKey);
      return raw ? (JSON.parse(raw) as DismissableKey[]) : [];
    } catch {
      return [];
    }
  });

  const dismissBlock = (key: DismissableKey) => {
    const next = [...dismissedBlocks, key];
    setDismissedBlocks(next);
    localStorage.setItem(dismissStorageKey, JSON.stringify(next));
  };

  const restoreBlock = (key: DismissableKey) => {
    const next = dismissedBlocks.filter((k) => k !== key);
    setDismissedBlocks(next);
    localStorage.setItem(dismissStorageKey, JSON.stringify(next));
  };

  const isDismissed = (key: DismissableKey) => dismissedBlocks.includes(key);

  const welcomeStorageKey = `group:${group.slug}:welcome-collapsed`;
  const [welcomeOpen, setWelcomeOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(welcomeStorageKey) !== "1";
  });
  const [showFullDescription, setShowFullDescription] = useState(false);
  const description = group.summary?.trim() || group.description?.trim() || "No summary provided yet.";
  const shouldTruncate = description.length > 320;
  const displayDescription =
    shouldTruncate && !showFullDescription
      ? `${description.slice(0, 320)}...`
      : description;
  const { activeMembers, isLoading: membersLoading } = useMembers(group.slug);
  const { pin: welcomePin } = useGroupWelcomePin(group.slug);
  const { data: myPermissions } = useMyPermissions(group.slug);
  const { layout, isLoading: layoutLoading } = useGroupOverviewLayout(group.slug);
  const { stall } = useStall("group", group.id);
  const { collections } = useCollections({ sponsor_type: 'group', sponsor_id: group.id });
  const canCreateWelcomeNote =
    myPermissions?.is_admin ||
    myPermissions?.decorators?.includes("create_post") ||
    false;


  const renderWelcomeBlock = () => {
    if (isDismissed("welcome")) return null;
    if (!welcomePin) {
      return canCreateWelcomeNote ? null : null;
    }

    return (
      <Card.Root>
        <Card.Body>
          <Flex justify="flex-end" mb={1}>
            <Tooltip content="Dismiss Welcome">
              <IconButton aria-label="Dismiss" size="2xs" variant="ghost" onClick={() => dismissBlock("welcome")}>
                <IconX size={12} />
              </IconButton>
            </Tooltip>
          </Flex>
          <Collapsible.Root
            open={welcomeOpen}
            onOpenChange={({ open }) => {
              setWelcomeOpen(open);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(welcomeStorageKey, open ? "0" : "1");
              }
            }}
          >
            <Collapsible.Trigger asChild>
              <Button variant="outline" size="sm" width="full" justifyContent="space-between">
                <Flex align="center" gap={2}>
                  {welcomeOpen ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  <Text>Welcome</Text>
                </Flex>
                <Collapsible.Indicator />
              </Button>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <Box pt={4}>
                {(() => {
                  const body = (welcomePin.display?.body_json || welcomePin.piece.body_json) as TipTapLikeNode | undefined;
                  const text = collectNodeText(body).replace(/\s+/g, " ").trim();
                  const wordCount = text ? text.split(/\s+/).length : 0;
                  const hasImage = bodyHasImage(body);
                  const shouldShowReadMore = hasImage || wordCount > WELCOME_INLINE_WORD_LIMIT;
                  const excerptFallback = (welcomePin.display?.excerpt || welcomePin.piece.excerpt || "").trim();
                  const previewText = excerptFallback || truncateWordsAtBoundary(text, WELCOME_PREVIEW_WORD_LIMIT);

                  return (
                    <>
                      <Heading size="md" mb={2}>
                        {welcomePin.display?.title || welcomePin.piece.title}
                      </Heading>
                      {body && !shouldShowReadMore ? (
                        <Box mb={3}>
                          <TipTapRenderer content={body as { type: "doc"; [key: string]: unknown }} />
                        </Box>
                      ) : previewText ? (
                        <Text color="fg.muted" mb={3}>
                          {previewText}
                        </Text>
                      ) : hasImage ? (
                        <Text color="fg.muted" mb={3}>
                          This welcome note includes rich media.
                        </Text>
                      ) : (
                        <Text color="fg.muted" mb={3}>
                          Welcome to {group.title}.
                        </Text>
                      )}
                      {shouldShowReadMore && welcomePin.piece.slug ? (
                        <Link as={NextLink} href={`/groups/${group.slug}/writing/${welcomePin.piece.slug}`}>
                          <Button size="xs" variant="outline">
                            Read more
                          </Button>
                        </Link>
                      ) : null}
                    </>
                  );
                })()}
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        </Card.Body>
      </Card.Root>
    );
  };

  const renderAnnouncementsBlock = () => {
    if (isDismissed("announcements")) return null;
    return (
      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">Announcements</Heading>
            <Tooltip content="Dismiss Announcements">
              <IconButton aria-label="Dismiss" size="2xs" variant="ghost" onClick={() => dismissBlock("announcements")}>
                <IconX size={12} />
              </IconButton>
            </Tooltip>
          </Flex>
        </Card.Header>
        <Card.Body>
          <Text color="fg.muted">No announcements yet.</Text>
        </Card.Body>
      </Card.Root>
    );
  };

  const renderRecentPostsBlock = () => null; // Hidden until wired up

  const renderMemberHighlightsBlock = () => {
    if (isDismissed("member_highlights")) return null;
    return (
    <Card.Root>
      <Card.Header>
        <Flex justify="space-between" align="center">
          <Heading size="md">Members</Heading>
          <Tooltip content="Dismiss Members">
            <IconButton aria-label="Dismiss" size="2xs" variant="ghost" onClick={() => dismissBlock("member_highlights")}>
              <IconX size={12} />
            </IconButton>
          </Tooltip>
        </Flex>
      </Card.Header>
      <Card.Body>
        {membersLoading ? (
          <Text color="fg.muted">Loading members…</Text>
        ) : (
          <Stack gap={3}>
            <AvatarGroup gap={2}>
              {activeMembers.slice(0, 12).map((member) => {
                const displayName = member.display_name || member.username || "Member";
                const initial = displayName.charAt(0).toUpperCase();
                const memberHref = member.username ? `/members/${member.username}` : null;
                return (
                  memberHref ? (
                    <Link as={NextLink} href={memberHref} key={member.member_id}>
                      <Avatar.Root size="sm" cursor="pointer">
                        {member.profile_image ? (
                          <Avatar.Image src={member.profile_image} alt={displayName} />
                        ) : (
                          <Avatar.Fallback>{initial}</Avatar.Fallback>
                        )}
                      </Avatar.Root>
                    </Link>
                  ) : (
                    <Avatar.Root key={member.member_id} size="sm">
                      {member.profile_image ? (
                        <Avatar.Image src={member.profile_image} alt={displayName} />
                      ) : (
                        <Avatar.Fallback>{initial}</Avatar.Fallback>
                      )}
                    </Avatar.Root>
                  )
                );
              })}
            </AvatarGroup>
            <Text color="fg.muted">{group.member_count ?? activeMembers.length} members</Text>
          </Stack>
        )}
      </Card.Body>
    </Card.Root>
    );
  };

  const totalCollectionItems = collections?.reduce((sum, c) => sum + (c.item_count || 0), 0) ?? 0;

  const renderPinnedResourcesBlock = () => {
    if (isDismissed("pinned_resources")) return null;
    return (
    <Card.Root>
      <Card.Header>
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={2}>
            <IconFolder size={20} />
            <Heading size="md">Core Resources</Heading>
          </Flex>
          <Tooltip content="Dismiss Core Resources">
            <IconButton aria-label="Dismiss" size="2xs" variant="ghost" onClick={() => dismissBlock("pinned_resources")}>
              <IconX size={12} />
            </IconButton>
          </Tooltip>
        </Flex>
      </Card.Header>
      <Card.Body>
        {!collections || collections.length === 0 ? (
          <Text color="fg.muted">No collections yet.</Text>
        ) : (
          <Stack gap={3}>
            <Text color="fg.muted">
              {collections.length} {collections.length === 1 ? "collection" : "collections"} with {totalCollectionItems} {totalCollectionItems === 1 ? "item" : "items"}
            </Text>
            {collections.slice(0, 3).map((c) => (
              <Text key={c.id} fontWeight="medium">{c.title}</Text>
            ))}
          </Stack>
        )}
      </Card.Body>
    </Card.Root>
    );
  };

  const renderQuickLinksBlock = () => (
    <Card.Root>
      <Card.Header>
        <Heading size="md">Quick Links</Heading>
      </Card.Header>
      <Card.Body>
        <Text color="fg.muted">Quick links will appear here.</Text>
      </Card.Body>
    </Card.Root>
  );

  const renderBlock = (block: GroupOverviewBlock) => {
    switch (block.type) {
      case "welcome":
        return renderWelcomeBlock();
      case "announcements":
        return renderAnnouncementsBlock();
      case "upcoming_events":
        return null;
      case "recent_posts":
        return renderRecentPostsBlock();
      case "member_highlights":
        return renderMemberHighlightsBlock();
      case "stewards":
        return null;
      case "pinned_resources":
        return renderPinnedResourcesBlock();
      case "pinned_writing":
        return null;
      case "quick_links":
        return renderQuickLinksBlock();
      default:
        return null;
    }
  };

  const blocks = (layout?.blocks ?? []) as GroupOverviewBlock[];
  const shouldRenderLegacy = !layoutLoading && blocks.length === 0;

  const renderLegacyLayout = () => (
    <Grid templateColumns={{ base: "1fr", lg: "3fr 2fr" }} gap={6}>
      <Stack gap={6}>
        {renderWelcomeBlock()}

        <Card.Root>
          <Card.Header>
            <Heading size="lg">Recent Activity</Heading>
          </Card.Header>
          <Card.Body>
            <Text color="fg.muted">Recent activity is coming soon.</Text>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Heading size="md">Highlights</Heading>
          </Card.Header>
          <Card.Body>
            <Text color="fg.muted">Highlights are coming soon.</Text>
          </Card.Body>
        </Card.Root>
      </Stack>

      <Stack gap={6}>
        <Card.Root>
          <Card.Header>
            <Heading size="lg">About this Group</Heading>
          </Card.Header>
          <Card.Body>
            <Text whiteSpace="pre-line" color="fg.muted">
              {displayDescription}
            </Text>
            {shouldTruncate && (
              <Button
                variant="ghost"
                size="sm"
                mt={2}
                onClick={() => setShowFullDescription((prev) => !prev)}
              >
                {showFullDescription ? "Show less" : "Read more"}
              </Button>
            )}
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Heading size="md">Details</Heading>
          </Card.Header>
          <Card.Body>
            <Flex wrap="wrap" gap={3}>
              <Badge size="sm" variant="subtle">
                {group.group_type}
              </Badge>
              <Badge size="sm" variant="subtle">
                {group.visibility}
              </Badge>
              <Badge size="sm" variant="subtle">
                {group.is_active ? "Active" : "Inactive"}
              </Badge>
            </Flex>
            <Stack gap={2} mt={4}>
              <Box>
                <Text fontSize="sm" color="fg.muted">
                  Members
                </Text>
                <Text fontWeight="semibold">{group.member_count ?? "—"}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="fg.muted">
                  Created
                </Text>
                <Text fontWeight="semibold">{group.created_at ?? "—"}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="fg.muted">
                  Updated
                </Text>
                <Text fontWeight="semibold">{group.updated_at ?? "—"}</Text>
              </Box>
            </Stack>
          </Card.Body>
        </Card.Root>

        {stall && stall.offerings_count > 0 && (
          <Card.Root>
            <Card.Header>
              <Flex align="center" gap={2}>
                <IconShoppingBag size={20} />
                <Heading size="md">Bazaar</Heading>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Text color="fg.muted" mb={3}>
                {stall.offerings_count} {stall.offerings_count === 1 ? "offering" : "offerings"} available
              </Text>
              <Link as={NextLink} href={`/groups/${group.slug}/stall`}>
                <Button size="sm" variant="outline" width="full">
                  <IconShoppingBag size={16} />
                  View Stall
                </Button>
              </Link>
            </Card.Body>
          </Card.Root>
        )}
      </Stack>
    </Grid>
  );

  const getColSpan = (block: GroupOverviewBlock) => {
    switch (block.width) {
      case "full":
        return { base: 12, md: 12 };
      case "two_thirds":
        return { base: 12, md: 8 };
      case "half":
        return { base: 12, md: 6 };
      case "one_third":
        return { base: 12, md: 4 };
      default:
        return { base: 12, md: 12 };
    }
  };

  const renderBlocks = () => (
    <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(12, 1fr)" }} gap={6}>
      {blocks.map((block) => (
        <GridItem key={block.id} colSpan={getColSpan(block)}>
          {renderBlock(block)}
        </GridItem>
      ))}
    </Grid>
  );

  const dismissedMeta = DISMISSABLE_BLOCKS.filter((b) => dismissedBlocks.includes(b.key));

  return (
    <Stack gap={6}>
      {/* Restore bar — shows icons for any dismissed blocks */}
      {dismissedMeta.length > 0 && (
        <Flex align="center" gap={2} justify="flex-end" flexWrap="wrap">
          <Text fontSize="xs" color="fg.muted">Dismissed:</Text>
          {dismissedMeta.map(({ key, label, icon: Icon }) => (
            <Tooltip key={key} content={`Restore ${label}`}>
              <IconButton
                aria-label={`Restore ${label}`}
                size="xs"
                variant="outline"
                onClick={() => restoreBlock(key as DismissableKey)}
              >
                <Icon size={14} />
              </IconButton>
            </Tooltip>
          ))}
        </Flex>
      )}

      {layoutLoading && (
        <Card.Root>
          <Card.Body>
            <Text color="fg.muted">Loading layout…</Text>
          </Card.Body>
        </Card.Root>
      )}
      {!layoutLoading && blocks.length > 0 && renderBlocks()}
      {shouldRenderLegacy && renderLegacyLayout()}
    </Stack>
  );
}
