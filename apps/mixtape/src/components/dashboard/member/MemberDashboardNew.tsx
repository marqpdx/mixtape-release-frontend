"use client";

// MemberDashboardNew — redesigned member home
// Layout: full-width banner → 3-col grid (248px | 1fr | 332px)
// Reference: design_handoff_member_dashboard/README.md

import { useState } from "react";
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Text,
  HStack,
  VStack,
  Image,
  Button,
  Link,
  Progress,
} from "@chakra-ui/react";
import NextLink from "next/link";
import {
  IconHome2,
  IconActivity,
  IconPencil,
  IconFileText,
  IconPlus,
  IconUsers,
  IconMessageCircle,
  IconAdjustments,
  IconCheck,
} from "@tabler/icons-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useUserGroups } from "@mixtape/api/hooks/groups/useGroups";
import { useWriting } from "@mixtape/api/hooks/useWriting";
import { useNotificationsPage } from "@mixtape/api/hooks/activity/useActivity";
import { getBestEmblemUrl } from "@mixtape/core/types/emblemTypes";
import MemberWorkArea from "./MemberWorkArea";

// ── helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function memberSinceYear(iso: string): string {
  return new Date(iso).getFullYear().toString();
}

// ── nav config ─────────────────────────────────────────────────────────────

type SectionKey =
  | "overview"
  | "activity"
  | "writing"
  | "my-drafts"
  | "write"
  | "my-groups"
  | "messages"
  | "preferences";

interface NavItem {
  key: SectionKey;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    label: "HOME",
    items: [
      { key: "overview", label: "Overview", icon: IconHome2 },
      { key: "activity", label: "Activity", icon: IconActivity },
    ],
  },
  {
    label: "WRITING",
    items: [
      { key: "writing", label: "My Writing", icon: IconPencil },
      { key: "my-drafts", label: "Drafts", icon: IconFileText },
      { key: "write", label: "New Piece", icon: IconPlus },
    ],
  },
  {
    label: "CONNECT",
    items: [
      { key: "my-groups", label: "My Groups", icon: IconUsers },
      { key: "messages", label: "Private Chats", icon: IconMessageCircle },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { key: "preferences", label: "Preferences", icon: IconAdjustments },
    ],
  },
];

// ── sub-components ─────────────────────────────────────────────────────────

function NavItemRow({
  item,
  isActive,
  onSelect,
}: {
  item: NavItem;
  isActive: boolean;
  onSelect: (key: SectionKey) => void;
}) {
  const Icon = item.icon;
  return (
    <Box
      as="button"
      className="mdn-nav-item"
      position="relative"
      w="full"
      px="12px"
      py="9px"
      borderRadius="10px"
      textAlign="left"
      cursor="pointer"
      bg={isActive ? "theme.accentSoft" : "transparent"}
      _hover={{ bg: isActive ? "theme.accentSoft" : "theme.bgSubtle" }}
      transition="background 0.12s"
      onClick={() => onSelect(item.key)}
    >
      {isActive && (
        <Box
          position="absolute"
          left={0}
          top="6px"
          bottom="6px"
          w="3px"
          borderRadius="0 3px 3px 0"
          bg="theme.accent"
        />
      )}
      <HStack gap="10px">
        <Box color={isActive ? "theme.accent" : "theme.textMuted"} flexShrink={0}>
          <Icon size={16} />
        </Box>
        <Text
          fontSize="15px"
          lineHeight="1.2"
          fontWeight={isActive ? "600" : "400"}
          color={isActive ? "theme.accent" : "theme.textSecondary"}
        >
          {item.label}
        </Text>
      </HStack>
    </Box>
  );
}

// ── Banner ─────────────────────────────────────────────────────────────────

interface BannerProps {
  displayName: string;
  username: string;
  avatarUrl?: string;
  backgroundImageUrl?: string;
  groupCount: number;
  memberSince: string;
}

function DashboardBanner({
  displayName,
  username,
  avatarUrl,
  backgroundImageUrl,
  groupCount,
  memberSince,
}: BannerProps) {
  return (
    <Box
      className="mdn-banner"
      position="relative"
      h="240px"
      overflow="hidden"
      bg={backgroundImageUrl ? undefined : "theme.bgSubtle"}
    >
      {backgroundImageUrl && (
        <Image
          src={backgroundImageUrl}
          alt=""
          position="absolute"
          inset={0}
          w="full"
          h="full"
          objectFit="cover"
        />
      )}
      {/* scrim */}
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(180deg, transparent 38%, rgba(15,23,32,.62) 100%)"
      />
      {/* overlaid identity row */}
      <Flex
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        px="32px"
        pb="24px"
        align="flex-end"
        justify="space-between"
      >
        <HStack align="flex-end" gap="18px">
          {/* avatar */}
          <Box
            className="mdn-banner-avatar"
            w="96px"
            h="96px"
            borderRadius="18px"
            border="4px solid"
            borderColor="theme.surface"
            boxShadow="0 2px 8px rgba(15,23,32,.25)"
            overflow="hidden"
            bg="theme.accent"
            flexShrink={0}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} w="full" h="full" objectFit="cover" />
            ) : (
              <Flex align="center" justify="center" h="full">
                <Text fontSize="36px" fontWeight="700" color="white">
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </Flex>
            )}
          </Box>

          <VStack align="flex-start" gap="4px" pb="4px">
            <Text
              fontFamily="heading"
              fontSize="40px"
              lineHeight="1.1"
              color="white"
              style={{ textShadow: "0 1px 4px rgba(15,23,32,.3)" }}
            >
              {displayName}
            </Text>
            <HStack gap="6px" color="rgba(255,255,255,.92)" fontSize="13px">
              <Text fontFamily="mono">@{username}</Text>
              <Text color="rgba(255,255,255,.5)">·</Text>
              <Text>
                <Text as="span" fontWeight="700">{groupCount}</Text> Groups
              </Text>
              <Text color="rgba(255,255,255,.5)">·</Text>
              <Text>
                Member since <Text as="span" fontWeight="700">{memberSince}</Text>
              </Text>
            </HStack>
          </VStack>
        </HStack>

        <Link as={NextLink} href="/dashboard?section=edit-profile" _hover={{ textDecoration: "none" }}>
          <Button
            className="mdn-banner-edit-btn"
            size="sm"
            bg="rgba(255,255,255,.18)"
            color="white"
            borderRadius="9999px"
            border="1px solid rgba(255,255,255,.3)"
            backdropFilter="blur(8px)"
            _hover={{ bg: "rgba(255,255,255,.28)" }}
            mb="4px"
          >
            Edit profile
          </Button>
        </Link>
      </Flex>
    </Box>
  );
}

// ── Left nav ───────────────────────────────────────────────────────────────

function DashboardNav({
  activeSection,
  onSelect,
}: {
  activeSection: SectionKey;
  onSelect: (key: SectionKey) => void;
}) {
  return (
    <Box
      className="mdn-nav"
      bg="theme.surface"
      borderRadius="16px"
      boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
      py="12px"
      px="8px"
    >
      <VStack align="stretch" gap={0}>
        {NAV.map((section, si) => (
          <Box key={section.label}>
            {si > 0 && <Box h="1px" bg="theme.border" mx="12px" my="8px" />}
            <Text
              fontFamily="mono"
              fontSize="11px"
              fontWeight="600"
              letterSpacing=".13em"
              textTransform="uppercase"
              color="theme.textMuted"
              px="12px"
              pb="4px"
              pt={si === 0 ? "2px" : "0"}
            >
              {section.label}
            </Text>
            {section.items.map((item) => (
              <NavItemRow
                key={item.key}
                item={item}
                isActive={activeSection === item.key}
                onSelect={onSelect}
              />
            ))}
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

// ── Center: Overview cards ─────────────────────────────────────────────────

function CardShell({
  children,
  accentBar,
}: {
  children: React.ReactNode;
  accentBar?: boolean;
}) {
  return (
    <Box
      className="mdn-card"
      bg="theme.surface"
      borderRadius="16px"
      boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
      overflow="hidden"
      borderLeft={accentBar ? "4px solid" : undefined}
      borderLeftColor={accentBar ? "theme.accent" : undefined}
    >
      {children}
    </Box>
  );
}

function JumpBackInCard({
  username,
  onNavigate,
}: {
  username: string;
  onNavigate: (key: SectionKey) => void;
}) {
  const [tab, setTab] = useState<"drafts" | "published">("drafts");
  const { drafts, isLoading } = useWriting("member", username);

  const recentDrafts = drafts.slice(0, 3);

  return (
    <CardShell accentBar>
      <Box px="24px" pt="22px" pb="20px">
        <Flex align="center" justify="space-between" mb="12px">
          <Text fontFamily="heading" fontSize="22px" color="theme.text">
            Jump back in
          </Text>
          <HStack gap={0} bg="theme.bgSubtle" borderRadius="9999px" p="3px">
            {(["drafts", "published"] as const).map((t) => (
              <Button
                key={t}
                size="xs"
                borderRadius="9999px"
                bg={tab === t ? "theme.accent" : "transparent"}
                color={tab === t ? "white" : "theme.textSecondary"}
                fontWeight={tab === t ? "600" : "400"}
                px="14px"
                py="6px"
                h="auto"
                _hover={{ bg: tab === t ? "theme.accent" : "theme.border" }}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </HStack>
        </Flex>

        {tab === "drafts" && (
          <>
            {isLoading && (
              <Text color="theme.textMuted" fontSize="14px">Loading…</Text>
            )}
            {!isLoading && recentDrafts.length === 0 && (
              <Text color="theme.textMuted" fontSize="14px">No drafts yet.</Text>
            )}
            <VStack align="stretch" gap={0}>
              {recentDrafts.map((draft, i) => (
                <Box key={draft.id}>
                  {i > 0 && <Box h="1px" bg="theme.border" />}
                  <Flex align="center" justify="space-between" py="12px" gap="12px">
                    <HStack gap="12px" flex="1" minW={0}>
                      <Flex
                        w="32px"
                        h="32px"
                        borderRadius="8px"
                        bg="theme.bgSubtle"
                        align="center"
                        justify="center"
                        flexShrink={0}
                        color="theme.textMuted"
                      >
                        <IconFileText size={15} />
                      </Flex>
                      <VStack align="flex-start" gap="2px" minW={0}>
                        <Text
                          fontSize="14px"
                          fontWeight="500"
                          color="theme.text"
                          lineHeight="1.3"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                        >
                          {draft.title || draft.piece?.title || "Untitled"}
                        </Text>
                        <Text fontSize="12px" color="theme.textMuted">
                          Draft · edited {timeAgo(draft.last_saved_at)}
                        </Text>
                      </VStack>
                    </HStack>
                    <Link
                      as={NextLink}
                      href={`/writing/${draft.piece?.slug ?? draft.id}`}
                      fontSize="13px"
                      fontWeight="600"
                      color="theme.accent"
                      _hover={{ textDecoration: "underline" }}
                      flexShrink={0}
                    >
                      Continue
                    </Link>
                  </Flex>
                </Box>
              ))}
            </VStack>
          </>
        )}

        {tab === "published" && (
          <Flex
            align="center"
            justify="space-between"
            pt="4px"
          >
            <Text fontSize="14px" color="theme.textMuted">
              View your published writing.
            </Text>
            <Link
              as={NextLink}
              href="#"
              fontSize="13px"
              fontWeight="600"
              color="theme.accent"
              onClick={(e) => { e.preventDefault(); onNavigate("writing"); }}
            >
              My Writing →
            </Link>
          </Flex>
        )}
      </Box>
    </CardShell>
  );
}

function ActivityFeedCard({ onViewAll }: { onViewAll: () => void }) {
  const { page, isLoading } = useNotificationsPage({});
  const items = (page?.results ?? []).slice(0, 5);

  return (
    <CardShell>
      <Box px="24px" pt="20px" pb="20px">
        <Flex align="center" justify="space-between" mb="14px">
          <Text fontFamily="heading" fontSize="20px" color="theme.text">
            Across your groups
          </Text>
          <Link
            fontSize="13px"
            fontWeight="600"
            color="theme.accent"
            cursor="pointer"
            onClick={onViewAll}
            _hover={{ textDecoration: "underline" }}
          >
            View all
          </Link>
        </Flex>

        {isLoading && (
          <Text color="theme.textMuted" fontSize="14px">Loading…</Text>
        )}
        {!isLoading && items.length === 0 && (
          <Text color="theme.textMuted" fontSize="14px">No recent activity.</Text>
        )}

        <VStack align="stretch" gap={0}>
          {items.map((item, i) => (
            <Box key={item.id}>
              {i > 0 && <Box h="1px" bg="theme.border" />}
              <Flex align="flex-start" gap="12px" py="12px">
                <Box
                  w="38px"
                  h="38px"
                  borderRadius="9999px"
                  bg="theme.accentSoft"
                  flexShrink={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="14px" fontWeight="700" color="theme.accent">
                    {(item.actor_name ?? "?").charAt(0).toUpperCase()}
                  </Text>
                </Box>
                <VStack align="flex-start" gap="2px" flex="1">
                  <Text fontSize="13px" color="theme.textSecondary" lineHeight="1.4">
                    <Text as="span" fontWeight="600" color="theme.text">
                      {item.actor_name ?? "Someone"}
                    </Text>{" "}
                    {item.verb ?? "did something"}
                    {item.object_name && (
                      <>
                        {" in "}
                        <Text as="span" color="theme.accent" fontWeight="500">
                          {item.object_name}
                        </Text>
                      </>
                    )}
                  </Text>
                  <Text fontSize="11px" color="theme.textMuted">
                    {timeAgo(item.last_occurred_at)}
                  </Text>
                </VStack>
              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>
    </CardShell>
  );
}

function WhatsHereCard({ onNavigate }: { onNavigate: (key: SectionKey) => void }) {
  const tiles: { key: SectionKey; icon: React.ReactNode; title: string; desc: string }[] = [
    { key: "writing", icon: <IconPencil size={16} />, title: "Writing", desc: "Pieces, drafts, and new work" },
    { key: "my-groups", icon: <IconUsers size={16} />, title: "Groups", desc: "Communities you belong to" },
    { key: "messages", icon: <IconMessageCircle size={16} />, title: "Private Chats", desc: "Direct messages" },
    { key: "preferences", icon: <IconAdjustments size={16} />, title: "Preferences", desc: "Notifications and settings" },
  ];

  return (
    <CardShell>
      <Box px="24px" pt="20px" pb="20px">
        <Text fontFamily="heading" fontSize="20px" color="theme.text" mb="16px">
          What&rsquo;s here
        </Text>
        <Grid templateColumns="1fr 1fr" gap="12px">
          {tiles.map((tile) => (
            <Box
              key={tile.key}
              as="button"
              textAlign="left"
              p="14px"
              borderRadius="10px"
              bg="theme.bgSubtle"
              _hover={{ bg: "theme.border" }}
              transition="background 0.12s"
              cursor="pointer"
              onClick={() => onNavigate(tile.key)}
            >
              <Flex
                w="30px"
                h="30px"
                borderRadius="8px"
                bg="theme.accentSoft"
                align="center"
                justify="center"
                color="theme.accent"
                mb="8px"
              >
                {tile.icon}
              </Flex>
              <Text fontSize="13px" fontWeight="600" color="theme.text" lineHeight="1.2" mb="3px">
                {tile.title}
              </Text>
              <Text fontSize="12px" color="theme.textMuted" lineHeight="1.3">
                {tile.desc}
              </Text>
            </Box>
          ))}
        </Grid>
      </Box>
    </CardShell>
  );
}

// ── Right rail ─────────────────────────────────────────────────────────────

function MyGroupsCard({ onNavigate }: { onNavigate: (key: SectionKey) => void }) {
  const { groups, isLoading } = useUserGroups();
  const shown = [...groups]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <Box
      className="mdn-rail-groups"
      bg="theme.surface"
      borderRadius="16px"
      boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
    >
      <Box px="20px" pt="20px" pb="18px">
        <Flex align="center" gap="6px" mb="14px">
          <Text fontFamily="heading" fontSize="18px" color="theme.text">
            My Groups
          </Text>
          {!isLoading && (
            <Text fontFamily="mono" fontSize="12px" color="theme.textMuted">
              ({groups.length})
            </Text>
          )}
        </Flex>

        {isLoading && (
          <Text color="theme.textMuted" fontSize="14px">Loading…</Text>
        )}

        <VStack align="stretch" gap={0}>
          {shown.map((group, i) => {
            const emblemSrc = getBestEmblemUrl(group.emblem, 40) ?? group.profile_image_url;
            const primaryRole = (group.user_roles?.[0] ?? "member").toUpperCase();
            return (
              <Box key={group.id}>
                {i > 0 && <Box h="1px" bg="theme.border" />}
                <Link
                  as={NextLink}
                  href={`/groups/${group.slug}`}
                  _hover={{ textDecoration: "none" }}
                >
                  <Flex align="center" gap="12px" py="10px" _hover={{ opacity: 0.8 }}>
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="9999px"
                      bg="theme.accentSoft"
                      flexShrink={0}
                      overflow="hidden"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {emblemSrc ? (
                        <Image src={emblemSrc} alt={group.title} w="full" h="full" objectFit="cover" />
                      ) : (
                        <Text fontSize="15px" fontWeight="700" color="theme.accent">
                          {group.title.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </Box>
                    <VStack align="flex-start" gap="1px" flex="1" minW={0}>
                      <Text
                        fontSize="13px"
                        fontWeight="500"
                        color="theme.text"
                        lineHeight="1.3"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                      >
                        {group.title}
                      </Text>
                      <Text
                        fontFamily="mono"
                        fontSize="10px"
                        fontWeight="600"
                        letterSpacing=".1em"
                        textTransform="uppercase"
                        color="theme.textMuted"
                      >
                        {primaryRole}
                      </Text>
                    </VStack>
                  </Flex>
                </Link>
              </Box>
            );
          })}
        </VStack>

        {groups.length > 0 && (
          <Box mt="8px">
            <Link
              fontSize="13px"
              fontWeight="600"
              color="theme.accent"
              cursor="pointer"
              onClick={() => onNavigate("my-groups")}
              _hover={{ textDecoration: "underline" }}
            >
              Browse groups
            </Link>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function ProfileCompletenessCard({
  displayName,
  quickIntro,
  avatarUrl,
}: {
  displayName?: string;
  quickIntro?: string;
  avatarUrl?: string;
}) {
  const checks = [
    { label: "Add a display name", done: !!displayName },
    { label: "Write a quick intro", done: !!quickIntro },
    { label: "Upload an avatar", done: !!avatarUrl },
  ];
  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);

  return (
    <Box
      className="mdn-rail-profile"
      bg="theme.surface"
      borderRadius="16px"
      boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
    >
      <Box px="20px" pt="20px" pb="20px">
        <Text
          fontFamily="mono"
          fontSize="11px"
          fontWeight="600"
          letterSpacing=".13em"
          textTransform="uppercase"
          color="theme.textMuted"
          mb="10px"
        >
          Your Profile
        </Text>

        <Flex align="center" justify="space-between" mb="8px">
          <Text fontSize="14px" fontWeight="600" color="theme.text">
            {pct}% complete
          </Text>
          <Text fontFamily="mono" fontSize="11px" color="theme.textMuted">
            {done} of {checks.length}
          </Text>
        </Flex>

        <Progress.Root value={pct} size="sm" colorPalette="green" mb="14px" borderRadius="9999px">
          <Progress.Track borderRadius="9999px" bg="theme.bgSubtle">
            <Progress.Range borderRadius="9999px" bg="theme.accent" />
          </Progress.Track>
        </Progress.Root>

        <VStack align="stretch" gap="8px">
          {checks.map((c) => (
            <HStack key={c.label} gap="8px">
              <Flex
                w="18px"
                h="18px"
                borderRadius="9999px"
                bg={c.done ? "theme.accent" : "theme.bgSubtle"}
                border="1px solid"
                borderColor={c.done ? "theme.accent" : "theme.border"}
                align="center"
                justify="center"
                flexShrink={0}
              >
                {c.done && <IconCheck size={10} color="white" />}
              </Flex>
              {c.done ? (
                <Text
                  fontSize="13px"
                  color="theme.textMuted"
                  textDecoration="line-through"
                >
                  {c.label}
                </Text>
              ) : (
                <Link
                  as={NextLink}
                  href="/dashboard?section=edit-profile"
                  fontSize="13px"
                  color="theme.accent"
                  _hover={{ textDecoration: "underline" }}
                >
                  {c.label}
                </Link>
              )}
            </HStack>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface MemberDashboardNewProps {
  initialSection?: SectionKey;
}

export function MemberDashboardNew({ initialSection = "overview" }: MemberDashboardNewProps) {
  const { user: identity } = useAuth();
  const { groups } = useUserGroups();

  const [activeSection, setActiveSection] = useState<SectionKey>(initialSection);

  if (!identity) return null;

  const profile = identity.profile;
  const displayName = profile?.display_name || identity.first_name || identity.username;

  const isOverview = activeSection === "overview";

  // sections that stay in the new 3-col layout center column
  const NEW_LAYOUT_SECTIONS: SectionKey[] = ["overview"];
  const useNewCenter = NEW_LAYOUT_SECTIONS.includes(activeSection);

  return (
    <Box className="mdn-root" bg="theme.bg" minH="100vh">
      {/* Banner */}
      <DashboardBanner
        displayName={displayName}
        username={identity.username}
        avatarUrl={profile?.avatar_url}
        backgroundImageUrl={undefined}
        groupCount={groups.length}
        memberSince={memberSinceYear(identity.date_joined)}
      />

      {/* Body */}
      <Box
        className="mdn-body"
        maxW="1440px"
        mx="auto"
        px={{ base: "16px", md: "28px" }}
        pt={{ base: "20px", md: "28px" }}
        pb="48px"
      >
        <Grid
          templateColumns={{ base: "1fr", lg: "248px minmax(0,1fr) 332px" }}
          gap={{ base: "16px", md: "28px" }}
        >
          {/* Left nav */}
          <GridItem className="mdn-col-nav">
            <DashboardNav
              activeSection={activeSection}
              onSelect={setActiveSection}
            />
          </GridItem>

          {/* Center */}
          <GridItem className="mdn-col-center" minW={0}>
            {useNewCenter && isOverview ? (
              <VStack align="stretch" gap="22px">
                <JumpBackInCard
                  username={identity.username}
                  onNavigate={setActiveSection}
                />
                <ActivityFeedCard onViewAll={() => setActiveSection("activity")} />
                <WhatsHereCard onNavigate={setActiveSection} />
              </VStack>
            ) : (
              <Box
                bg="theme.surface"
                borderRadius="16px"
                overflow="hidden"
                boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
              >
                <MemberWorkArea
                  section={activeSection}
                  setActiveSection={(s) => setActiveSection(s as SectionKey)}
                  identity={identity}
                />
              </Box>
            )}
          </GridItem>

          {/* Right rail */}
          <GridItem className="mdn-col-rail">
            <VStack align="stretch" gap="22px">
              <MyGroupsCard onNavigate={setActiveSection} />
              <ProfileCompletenessCard
                displayName={profile?.display_name}
                quickIntro={profile?.quick_intro}
                avatarUrl={profile?.avatar_url}
              />
            </VStack>
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
}
