// apps/mixtape/src/components/groups/membeview-d/GroupLandingDContent.tsx

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Flex, Grid, Image, Text, Button } from "@chakra-ui/react";
import NextLink from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchDiscussion } from "@mixtape/api/clients/threadworks/threadworksApi";
import {
  IconUpload,
  IconMessageCircle,
  IconFolder,
  IconUsers,
  IconUserPlus,
  IconArrowUpRight,
  IconMessageDots,
  IconCalendarEvent,
  IconBell,
  IconUser,
} from "@tabler/icons-react";
import { useGroupActivityFeed } from "@mixtape/api/hooks/activity";
import { useAuth } from "@/lib/auth/AuthContext";
import type { GroupActivityFeedItem } from "@mixtape/api/clients/activity/activityApi";
import { Spinner } from "@chakra-ui/react";
import type { GroupMemberViewData } from "../member-views/useGroupMemberViewData";
import { MembersTab } from "../tabs/MembersTab";
import { GroupMemberProfilePanel } from "../members/GroupMemberProfilePanel";

// ── shared primitives ──────────────────────────────────────────────────────

function Card({
  children,
  accentRail = false,
  className,
}: {
  children: React.ReactNode;
  accentRail?: boolean;
  className?: string;
}) {
  return (
    <Box
      className={className}
      bg="theme.surface"
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="16px"
      boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
      px="26px"
      py="24px"
      position="relative"
      overflow="hidden"
    >
      {accentRail && (
        <Box
          position="absolute"
          left="0"
          top="0"
          bottom="0"
          w="4px"
          bg="theme.accent"
        />
      )}
      {children}
    </Box>
  );
}

function SectionHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <Flex align="baseline" justify="space-between" mb={4}>
      <Box>
        <Text
          as="h2"
          fontFamily="heading"
          fontSize="22px"
          fontWeight="600"
          color="theme.text"
          lineHeight="1.2"
        >
          {title}
        </Text>
        {subtitle && (
          <Text fontSize="14px" color="theme.textSecondary" mt="2px">
            {subtitle}
          </Text>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Flex>
  );
}

// ── Start Here ─────────────────────────────────────────────────────────────

const WHAT_HERE_TILES = [
  { id: "share",    icon: IconUpload,        title: "Share",     desc: "Post wins, updates, and finds." },
  { id: "converse", icon: IconMessageCircle, title: "Converse",  desc: "Open-ended threads & discussion." },
  { id: "files",    icon: IconFolder,        title: "Resources", desc: "Core files & findings." },
] as const;

type StartTab = "welcome" | "recent";
const TAB_KEY = "mixtape-gld-start-tab";

// Maps activity_code → icon component
type IconComponent = React.ComponentType<{ size?: number }>;
const CODE_ICON: Record<string, IconComponent> = {
  "group.member.joined":               IconUserPlus,
  "group.member.profile_updated":      IconUser,
  "group.post.created":                IconArrowUpRight,
  "group.threadworks.post_created":    IconMessageDots,
  "group.livewire.message":            IconMessageCircle,
  "group.collection.item_added":       IconFolder,
  "group.collection.updated":          IconFolder,
  "group.almanac.event_published":     IconCalendarEvent,
  "group.almanac.occurrence_updated":  IconCalendarEvent,
  "group.circle.active":               IconUsers,
  "group.announcement":                IconBell,
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function feedItemSummary(item: GroupActivityFeedItem): string {
  const base = item.verb;
  const objectTitle = (item.metadata.object_title || item.metadata.object_name) as string | undefined;
  if (objectTitle) return `${base} "${objectTitle}"`;
  return base;
}

function RecentActivity({ groupSlug }: { groupSlug: string }) {
  const { feed, isLoading } = useGroupActivityFeed(groupSlug);

  if (isLoading) {
    return <Flex justify="center" py={6}><Spinner size="sm" color="theme.textMuted" /></Flex>;
  }

  if (feed.length === 0) {
    return (
      <Text fontSize="14px" color="theme.textMuted" py={4} textAlign="center">
        No recent activity yet.
      </Text>
    );
  }

  return (
    <Flex direction="column" gap={0}>
      {feed.map((item, i) => {
        const Icon = CODE_ICON[item.activity_code] ?? IconArrowUpRight;
        return (
          <Flex
            key={item.id}
            align="flex-start"
            gap={3}
            py="13px"
            borderTopWidth={i === 0 ? "0" : "1px"}
            borderColor="theme.border"
          >
            <Flex
              w="32px"
              h="32px"
              borderRadius="8px"
              bg="theme.bgSubtle"
              align="center"
              justify="center"
              color="theme.textMuted"
              flexShrink={0}
              mt="1px"
            >
              <Icon size={15} />
            </Flex>
            <Box flex="1" minW={0}>
              <Text fontSize="14px" color="theme.textSecondary" lineHeight="1.4">
                <Box as="span" fontWeight="600" color="theme.text">{item.actor_name}</Box>{" "}{feedItemSummary(item)}
              </Text>
            </Box>
            <Text fontSize="12px" color="theme.textFaint" flexShrink={0} mt="2px">
              {relativeTime(item.occurs_at)}
            </Text>
          </Flex>
        );
      })}
    </Flex>
  );
}

interface StartHereProps {
  viewData: GroupMemberViewData;
  onNavigate: (id: "start" | "introduce" | "share" | "converse" | "files" | "findings") => void;
}

export function GroupLandingDStartHere({ viewData, onNavigate }: StartHereProps) {
  const { user } = useAuth();
  const { data: wwaDiscussion } = useQuery({
    queryKey: ["threadworks", "discussion", viewData.group.slug, "welcome", "who-we-are"],
    queryFn: () => fetchDiscussion("welcome", "who-we-are", viewData.group.slug),
  });
  const hasPostedToThread = (wwaDiscussion?.posts ?? []).some(
    (p) => p.author.username === user?.username
  );
  const [tab, setTab] = useState<StartTab>("welcome");

  useEffect(() => {
    const saved = localStorage.getItem(TAB_KEY);
    if (saved === "welcome" || saved === "recent") setTab(saved);
  }, []);

  const handleTabChange = (t: StartTab) => {
    setTab(t);
    localStorage.setItem(TAB_KEY, t);
  };

  return (
    <Flex direction="column" gap={4} className="gld-start-root">
      <Card accentRail className="gld-welcome-card">
        {/* Header row: h2 + tab pills flush right */}
        <Flex align="center" justify="space-between" gap={3} mb={4}>
          <Text
            as="h2"
            fontFamily="heading"
            fontSize="26px"
            fontWeight="700"
            color="theme.text"
            lineHeight="1.1"
          >
            Welcome to {viewData.identity.title}
          </Text>
          <Flex gap="4px" flexShrink={0}>
            {(["welcome", "recent"] as StartTab[]).map((t) => (
              <Box
                key={t}
                as="button"
                px="14px"
                py="5px"
                borderRadius="9999px"
                fontSize="13px"
                fontWeight="600"
                cursor="pointer"
                bg={tab === t ? "theme.accent" : "theme.bgSubtle"}
                color={tab === t ? "white" : "theme.textSecondary"}
                _hover={{ bg: tab === t ? "theme.accent" : "theme.border" }}
                transition="background 0.15s"
                onClick={() => handleTabChange(t)}
              >
                {t === "welcome" ? "Welcome" : "Recent"}
              </Box>
            ))}
          </Flex>
        </Flex>

        {tab === "welcome" && (
          <Flex direction="column" gap={3}>
            <Text fontSize="15px" lineHeight="1.5" color="theme.textSecondary">
              This is your group's home. Use the <strong style={{ color: "inherit" }}>left navigation</strong> to move
              between welcome materials, conversations, and resources.
            </Text>
            {!hasPostedToThread && (
              <Text className="gld-content-head-to" fontSize="15px" lineHeight="1.5" color="theme.textSecondary">
                Head to{" "}
                <Box
                  as="button"
                  fontWeight="600"
                  color="theme.accent"
                  cursor="pointer"
                  onClick={() => onNavigate("introduce")}
                  _hover={{ textDecoration: "underline" }}
                  display="inline"
                >
                  Who We Are
                </Box>{" "}
                to write a short intro — it's how other members get to know you here.
              </Text>
            )}
            <Text fontSize="15px" lineHeight="1.5" color="theme.textSecondary">
              Everything the group makes together lives under{" "}
              <strong style={{ color: "inherit" }}>Resources</strong> — core files, findings, and links.
            </Text>
          </Flex>
        )}

        {tab === "recent" && <RecentActivity groupSlug={viewData.group.slug} />}
      </Card>

      {tab === "welcome" && (
        <Card className="gld-whats-here-card">
          <SectionHead title="What's here" subtitle="A quick map of the space." />
          <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={3}>
            {WHAT_HERE_TILES.map((tile) => {
              const Icon = tile.icon;
              return (
                <Box
                  key={tile.id}
                  as="button"
                  textAlign="left"
                  p={4}
                  borderRadius="10px"
                  borderWidth="1px"
                  borderColor="theme.border"
                  cursor="pointer"
                  _hover={{ borderColor: "theme.accent", transform: "translateY(-1px)" }}
                  transition="border-color 0.15s, transform 0.15s"
                  onClick={() => onNavigate(tile.id as Parameters<StartHereProps["onNavigate"]>[0])}
                >
                  <Flex align="center" gap={3} mb={2}>
                    <Flex
                      w="32px"
                      h="32px"
                      borderRadius="8px"
                      bg="theme.accentSoft"
                      align="center"
                      justify="center"
                      color="theme.accent"
                      flexShrink={0}
                    >
                      <Icon size={16} />
                    </Flex>
                    <Text fontWeight="600" fontSize="15px" color="theme.text">
                      {tile.title}
                    </Text>
                  </Flex>
                  <Text fontSize="13px" color="theme.textSecondary" lineHeight="1.4">
                    {tile.desc}
                  </Text>
                </Box>
              );
            })}
          </Grid>
        </Card>
      )}
    </Flex>
  );
}

// ── Introduce Yourselves ───────────────────────────────────────────────────

interface IntroduceProps {
  viewData: GroupMemberViewData;
  initialMemberUsername?: string | null;
}

export function GroupLandingDIntroduce({ viewData, initialMemberUsername }: IntroduceProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const members = viewData.members.active;

  // Stable random order for this mount — reshuffles on each page visit
  const shuffledMembers = useMemo(
    () => [...members].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Jump to a member when navigated from the rail
  useEffect(() => {
    if (!initialMemberUsername) return;
    const idx = shuffledMembers.findIndex((m) => m.username === initialMemberUsername);
    if (idx >= 0) setSelectedIndex(idx);
  }, [initialMemberUsername, shuffledMembers]);

  const handleReturn = useCallback(() => setSelectedIndex(null), []);
  const handlePrev = useCallback(() => setSelectedIndex((i) => Math.max(0, (i ?? 0) - 1)), []);
  const handleNext = useCallback(
    () => setSelectedIndex((i) => Math.min(shuffledMembers.length - 1, (i ?? 0) + 1)),
    [shuffledMembers.length],
  );

  const selectedMember = selectedIndex !== null ? shuffledMembers[selectedIndex] : null;

  return (
    <Flex direction="column" gap={4} className="gld-introduce-root">
      {/* Intro prompt banner */}
      <Box
        className="gld-intro-prompt"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="theme.accent"
        borderRadius="14px"
        px={5}
        py={4}
        bg="theme.accentSoft"
      >
        <Flex align="center" gap={4}>
          <Flex
            w="40px"
            h="40px"
            borderRadius="full"
            bg="theme.accent"
            align="center"
            justify="center"
            color="white"
            flexShrink={0}
            fontSize="16px"
            fontWeight="700"
          >
            Me
          </Flex>
          <Box flex="1">
            <Text fontWeight="600" fontSize="15px" color="theme.text">
              Introduce yourself
            </Text>
            <Text fontSize="14px" color="theme.textSecondary">
              Add a photo, a short bio, and what you're here for.
            </Text>
          </Box>
          <Button
            size="sm"
            bg="theme.accent"
            color="white"
            borderRadius="10px"
            fontWeight="600"
            _hover={{ opacity: 0.9 }}
            flexShrink={0}
            asChild
          >
            <NextLink href="/dashboard?section=edit-profile">
              Set up profile
            </NextLink>
          </Button>
        </Flex>
      </Box>

      {/* Member intros card */}
      <Card className="gld-member-intros-card">
        {selectedMember?.username ? (
          <GroupMemberProfilePanel
            username={selectedMember.username}
            displayName={selectedMember.display_name || selectedMember.username || ""}
            avatarUrl={selectedMember.profile_image || undefined}
            onReturn={handleReturn}
            onPrev={handlePrev}
            onNext={handleNext}
            hasPrev={(selectedIndex ?? 0) > 0}
            hasNext={(selectedIndex ?? 0) < shuffledMembers.length - 1}
            backFrom={`/groups/${viewData.group.slug}`}
            backLabel={viewData.group.title}
          />
        ) : (
          <>
            <SectionHead
              title="Member intros"
              subtitle="How the group gets to know each other."
            />
            {shuffledMembers.length === 0 && !viewData.members.isLoading ? (
              <Flex
                align="center"
                justify="center"
                py={12}
                direction="column"
                gap={2}
                color="theme.textMuted"
              >
                <IconUsers size={32} />
                <Text fontSize="14px">No members yet.</Text>
              </Flex>
            ) : (
              <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={3}>
                {shuffledMembers.slice(0, 6).map((member, idx) => (
                  <Flex
                    key={member.member_id}
                    as="button"
                    className="gld-intro-card"
                    p={4}
                    borderRadius="12px"
                    borderWidth="1px"
                    borderColor="theme.border"
                    gap={3}
                    align="flex-start"
                    textAlign="left"
                    cursor="pointer"
                    _hover={{ borderColor: "theme.accent", bg: "theme.bgSubtle" }}
                    transition="border-color 0.15s, background 0.15s"
                    onClick={() => setSelectedIndex(idx)}
                  >
                    {member.profile_image ? (
                      <Image
                        src={member.profile_image}
                        alt={member.display_name || "member"}
                        w="40px"
                        h="40px"
                        borderRadius="full"
                        objectFit="cover"
                        flexShrink={0}
                      />
                    ) : (
                      <Flex
                        w="40px"
                        h="40px"
                        borderRadius="full"
                        bg="theme.accent"
                        align="center"
                        justify="center"
                        color="white"
                        fontSize="16px"
                        fontWeight="700"
                        flexShrink={0}
                      >
                        {(member.display_name || member.username || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </Flex>
                    )}
                    <Box minW={0}>
                      <Text fontWeight="600" fontSize="14px" color="theme.text" lineHeight="1.2">
                        {member.display_name || member.username}
                      </Text>
                      <Text fontSize="12px" color="theme.textMuted" textTransform="capitalize">
                        {member.roles.includes("admin") ? "Admin" : member.roles.includes("steward") ? "Steward" : "Member"}
                      </Text>
                      <Box mt={2} h="8px" bg="theme.bgSubtle" borderRadius="4px" w="80%" />
                      <Box mt={1} h="8px" bg="theme.bgSubtle" borderRadius="4px" w="60%" />
                    </Box>
                  </Flex>
                ))}
              </Grid>
            )}
            {shuffledMembers.length > 6 && (
              <Box mt={4} pt={4} borderTopWidth="1px" borderColor="theme.border">
                <MembersTab group={viewData.group} />
              </Box>
            )}
          </>
        )}
      </Card>
    </Flex>
  );
}
