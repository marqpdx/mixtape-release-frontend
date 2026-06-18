"use client";

import { Fragment, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Box, Flex, Grid, GridItem, Image, Text, Button, IconButton } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  IconHome2,
  IconUsers,
  IconMessageCircle,
  IconFolder,
  IconUserCircle,
  IconCalendarEvent,
  IconPin,
  IconSwitchHorizontal,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import type { Group } from "@mixtape/core/types/groupTypes";
import { useUserGroups } from "@mixtape/api/hooks/groups/useGroups";
import { getBestEmblemUrl } from "@mixtape/core/types/emblemTypes";
import { isDiscussionPinned } from "@mixtape/core/types/threadworksTypes";
import { fetchForums } from "@mixtape/api/clients/threadworks/threadworksApi";
import { useGroupMemberViewData } from "../member-views/useGroupMemberViewData";
import { ThreadworksTab } from "../tabs/ThreadworksTab";
import { CollectionsTab } from "../tabs/CollectionsTab";
import { UnifiedRoleSwitcher } from "../UnifiedRoleSwitcher";
import { useAuth } from "@/lib/auth/AuthContext";
import { useColorModeValue } from "@components/ui/color-mode";
import { GroupLandingDStartHere, GroupLandingDIntroduce } from "./GroupLandingDContent";
import { GroupLandingDRail } from "./GroupLandingDRail";
import { GroupMemberEventsPanel } from "./GroupMemberEventsPanel";
import { GroupLandingDTellAboutYourself } from "./GroupLandingDTellAboutYourself";
import { GroupLandingDDiscussionThread } from "./GroupLandingDDiscussionThread";
import { AnnouncementViewBox } from "../announcements/AnnouncementViewBox";
import { QuickAnnouncementCreate } from "../announcements/QuickAnnouncementCreate";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
  DialogBackdrop,
} from "@/components/ui/dialog";
import MemberProfileEdit from "@/components/dashboard/member/MemberProfileEdit";

// ── types ──────────────────────────────────────────────────────────────────

type DestinationId =
  | "start"
  | "introduce"
  | "share"
  | "converse"
  | "members"
  | "events"
  | "files"
  | "findings"
  | `discussion:${string}`;

interface NavItemDef {
  id: DestinationId;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  rail: boolean;
}

interface NavSectionDef {
  label: string;
  items: NavItemDef[];
}

// ── nav config ─────────────────────────────────────────────────────────────

function buildNavSections(): NavSectionDef[] {
  return [
    {
      label: "Welcome",
      items: [
        { id: "start",     label: "Start Here",   icon: IconHome2,  rail: true  },
        { id: "introduce", label: "Who We Are",   icon: IconUsers,  rail: false },
      ],
    },
    {
      label: "Connect",
      items: [
        { id: "converse", label: "Converse", icon: IconMessageCircle, rail: false },
        { id: "members",  label: "Members",  icon: IconUsers,          rail: false },
        { id: "events",   label: "Events",   icon: IconCalendarEvent, rail: false },
      ],
    },
    {
      label: "Resources",
      items: [
        { id: "files",    label: "Collections", icon: IconFolder, rail: false },
      ],
    },
  ];
}

const CONNECT_META: Record<string, { title: string; filterLabel: string; actionLabel: string }> = {
  share:    { title: "Share Your Wins",  filterLabel: "Latest", actionLabel: "+ New Post"   },
  converse: { title: "Discussions",      filterLabel: "Active",  actionLabel: "+ New Thread" },
};

// ── sub-components ─────────────────────────────────────────────────────────

function NavItem({
  item,
  isActive,
  onSelect,
}: {
  item: NavItemDef;
  isActive: boolean;
  onSelect: (id: DestinationId) => void;
}) {
  const Icon = item.icon;
  return (
    <Box
      as="button"
      position="relative"
      w="full"
      px="12px"
      py="9px"
      borderRadius="10px"
      textAlign="left"
      cursor="pointer"
      bg={isActive ? "theme.accentSoft" : "transparent"}
      _hover={{ bg: isActive ? "theme.accentSoft" : "theme.bgSubtle" }}
      transition="background 0.15s"
      onClick={() => onSelect(item.id)}
    >
      {isActive && (
        <Box
          position="absolute"
          left="0"
          top="8px"
          bottom="8px"
          w="3px"
          bg="theme.accent"
          borderRadius="0 3px 3px 0"
        />
      )}
      <Flex align="center" gap="11px">
        <Box color={isActive ? "theme.accent" : "theme.textMuted"} flexShrink={0}>
          <Icon size={18} />
        </Box>
        <Text
          flex="1"
          fontSize="14.5px"
          fontWeight={isActive ? "600" : "500"}
          color={isActive ? "theme.accent" : "theme.textSecondary"}
          lineHeight="1.2"
        >
          {item.label}
        </Text>
      </Flex>
    </Box>
  );
}

function LeftNav({
  sections,
  active,
  onSelect,
  pinnedItems,
}: {
  sections: NavSectionDef[];
  active: DestinationId;
  onSelect: (id: DestinationId) => void;
  pinnedItems: NavItemDef[];
}) {
  return (
    <Box className="gld-nav" display="flex" flexDirection="column" gap="22px">
      {sections.map((section) => (
        <Box key={section.label}>
          <Text
            px="12px"
            pb="8px"
            fontSize="11.5px"
            fontWeight="600"
            letterSpacing="0.14em"
            textTransform="uppercase"
            color="theme.textMuted"
          >
            {section.label}
          </Text>
          <Flex direction="column" gap="2px">
            {section.items.map((item) => (
              <Fragment key={item.id}>
                {/* Soft divider above Events */}
                {section.label === "Connect" && item.id === "events" && (
                  <Box
                    borderTopWidth="1px"
                    borderColor="theme.border"
                    mx="12px"
                    my="6px"
                  />
                )}
                <NavItem item={item} isActive={active === item.id} onSelect={onSelect} />
                {/* Pinned discussion items injected after Converse */}
                {section.label === "Connect" && item.id === "converse" &&
                  pinnedItems.map((pinned) => (
                    <NavItem
                      key={pinned.id}
                      item={pinned}
                      isActive={active === pinned.id}
                      onSelect={onSelect}
                    />
                  ))
                }
              </Fragment>
            ))}
          </Flex>
        </Box>
      ))}
    </Box>
  );
}

function ConnectSubtoolbar({ destination }: { destination: DestinationId }) {
  const meta = CONNECT_META[destination];
  if (!meta) return null;
  return (
    <Flex
      className="gld-subtoolbar"
      bg="theme.surface"
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="14px"
      px={4}
      py="10px"
      align="center"
      gap={3}
      mb={4}
    >
      <Text fontWeight="700" fontSize="15px" color="theme.text" whiteSpace="nowrap">
        {meta.title}
      </Text>
      <Box
        as="button"
        px="12px"
        py="4px"
        borderRadius="full"
        borderWidth="1px"
        borderColor="theme.border"
        bg="theme.bg"
        fontSize="13px"
        fontWeight="600"
        color="theme.textSecondary"
        cursor="pointer"
        _hover={{ bg: "theme.bgSubtle" }}
        flexShrink={0}
      >
        {meta.filterLabel} ▾
      </Box>
      <Box flex="1" />
      <Button
        size="sm"
        bg="theme.accent"
        color="white"
        borderRadius="full"
        fontWeight="600"
        fontSize="13px"
        px={4}
        _hover={{ opacity: 0.9 }}
      >
        {meta.actionLabel}
      </Button>
    </Flex>
  );
}

// ── group switcher ─────────────────────────────────────────────────────────

function GroupSwitcherButton({ currentGroupSlug }: { currentGroupSlug: string }) {
  const router = useRouter();
  const { groups } = useUserGroups();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const bgColor = useColorModeValue("background.light", "background.dark");

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <Box ref={ref} position="relative">
      <Box
        bg={bgColor}
        backdropFilter="blur(8px)"
        borderRadius="md"
        p={1}
        boxShadow="sm"
      >
        <IconButton
          aria-label="Switch group"
          size="xs"
          variant="ghost"
          w="40px"
          onClick={() => setOpen((o) => !o)}
          title="Switch group"
        >
          <IconSwitchHorizontal size={16} />
        </IconButton>
      </Box>

      {open && (
        <Box
          position="absolute"
          top="calc(100% + 6px)"
          right={0}
          minW="220px"
          bg="theme.surface"
          borderRadius="12px"
          boxShadow="0 4px 24px rgba(15,23,32,.14)"
          border="1px solid"
          borderColor="theme.border"
          py="6px"
          zIndex={400}
          overflow="hidden"
        >
          {groups.length === 0 && (
            <Box px="14px" py="10px">
              <Text fontSize="13px" color="theme.textMuted">No other groups</Text>
            </Box>
          )}
          {groups.map((g) => {
            const emblemSrc = getBestEmblemUrl(g.emblem, 32) ?? g.profile_image_url;
            const isCurrent = g.slug === currentGroupSlug;
            return (
              <Box
                key={g.id}
                as="button"
                w="full"
                display="flex"
                alignItems="center"
                gap="10px"
                px="14px"
                py="9px"
                textAlign="left"
                cursor={isCurrent ? "default" : "pointer"}
                bg={isCurrent ? "theme.accentSoft" : "transparent"}
                _hover={isCurrent ? {} : { bg: "theme.bgSubtle" }}
                transition="background 0.1s"
                onClick={() => {
                  if (!isCurrent) {
                    router.push(`/groups/${g.slug}`);
                    setOpen(false);
                  }
                }}
              >
                <Box
                  w="28px"
                  h="28px"
                  borderRadius="7px"
                  bg="theme.accentSoft"
                  flexShrink={0}
                  overflow="hidden"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {emblemSrc ? (
                    <Image src={emblemSrc} alt={g.title} w="full" h="full" objectFit="cover" />
                  ) : (
                    <Text fontSize="12px" fontWeight="700" color="theme.accent">
                      {g.title.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </Box>
                <Text
                  fontSize="13px"
                  fontWeight={isCurrent ? "600" : "400"}
                  color={isCurrent ? "theme.accent" : "theme.text"}
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  flex="1"
                >
                  {g.title}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

// ── main component ─────────────────────────────────────────────────────────

interface GroupLandingDProps {
  group: Group;
  testRole?: "admin" | "member" | "public" | null;
  onRoleChange?: (role: "admin" | "member" | "public") => void;
  isMember?: boolean;
  isAdminOrSteward?: boolean;
  canEditGroup?: boolean;
  isSuperuser?: boolean;
}

export function GroupLandingD({
  group,
  testRole,
  onRoleChange,
  isMember = false,
  isAdminOrSteward = false,
  isSuperuser = false,
}: GroupLandingDProps) {
  const { user } = useAuth();
  const viewData = useGroupMemberViewData(group);
  const [active, setActive] = useState<DestinationId>(() => {
    if (typeof window === "undefined") return "start";
    return (localStorage.getItem(`gld:${group.slug}:active`) as DestinationId) ?? "start";
  });
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedMemberUsername, setSelectedMemberUsername] = useState<string | null>(null);
  const [isIntroCollapsed, setIsIntroCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`gld:${group.slug}:introCollapsed`) === "true";
  });
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const hasIntro = !!user?.profile?.quick_intro;
  const navSections = useMemo(() => buildNavSections(), []);

  const forumsQuery = useQuery({
    queryKey: ["threadworks", "forums", group.slug],
    queryFn: () => fetchForums(group.slug),
  });

  const pinnedNavItems = useMemo((): NavItemDef[] => {
    if (!forumsQuery.data) return [];
    return forumsQuery.data.flatMap((forum) =>
      forum.discussions
        .filter(isDiscussionPinned)
        // "who-we-are" is owned by the hard-coded "introduce" nav item
        .filter((d) => d.slug !== "who-we-are")
        .map((d) => ({
          id: `discussion:${forum.slug}:${d.slug}` as DestinationId,
          label: d.pinned_nav_name || d.title.slice(0, 32),
          icon: IconPin,
          rail: false,
        }))
    );
  }, [forumsQuery.data]);

  const handleSelect = useCallback((id: DestinationId) => {
    setActive(id);
    localStorage.setItem(`gld:${group.slug}:active`, id);
    if (id !== "files" && id !== "findings") setSelectedCollectionId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [group.slug]);

  const handleStartHereNavigate = useCallback((id: Parameters<typeof handleSelect>[0]) => {
    // Only expand the card if there's no intro yet — card doesn't exist once intro is set
    if (id === "introduce" && !hasIntro) {
      setIsIntroCollapsed(false);
      localStorage.setItem(`gld:${group.slug}:introCollapsed`, "false");
    }
    handleSelect(id);
  }, [handleSelect, group.slug, hasIntro]);

  const handleRailNavigate = useCallback((id: "introduce" | "files" | "events" | "members", collectionId?: string, memberUsername?: string) => {
    setActive(id);
    localStorage.setItem(`gld:${group.slug}:active`, id);
    setSelectedCollectionId(collectionId ?? null);
    setSelectedMemberUsername(memberUsername ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [group.slug]);

  const activeItem = navSections.flatMap((s) => s.items).find((i) => i.id === active);
  const showRail = activeItem?.rail ?? false;

  const isPinnedDiscussion = active.startsWith("discussion:");
  const [, pinnedForumSlug = "", pinnedDiscussionSlug = ""] = isPinnedDiscussion
    ? active.split(":")
    : [];

  return (
    <Box className="gld-root" bg="theme.bg" minH="100vh">
      {/* Role chooser + group switcher — zero-height sticky anchor; takes no vertical space */}
      <Box position="sticky" top={0} h="0" overflow="visible" zIndex={300}>
        <Flex position="absolute" top={2} right={2} gap={2} align="center">
          <GroupSwitcherButton currentGroupSlug={group.slug} />
          {isAdminOrSteward && onRoleChange && (
            <UnifiedRoleSwitcher
              testRole={testRole}
              onRoleChange={onRoleChange}
              isAdminOrSteward={isAdminOrSteward}
              isSuperuser={isSuperuser}
            />
          )}
        </Flex>
        {/* Me button — hidden until Group Profile feature is built; see gld-me-btn */}
        {user?.username && (
          <NextLink href={`/groups/${group.slug}/me`} style={{ display: "none" }}>
            <Flex
              className="gld-me-btn"
              as="span"
              position="absolute"
              top={2}
              right="50px"
              align="center"
              justify="center"
              w="38px"
              h="38px"
              borderRadius="10px"
              bg="theme.accent"
              color="white"
              cursor="pointer"
              title="Your group profile"
            >
              <IconUserCircle size={18} />
            </Flex>
          </NextLink>
        )}
      </Box>

      {/* Compact header */}
      <Box
        className="gld-header"
        position="relative"
        borderBottomWidth="1px"
        borderColor="theme.border"
        bg="theme.bg"
        px={{ base: "18px", xl: "48px" }}
        py="5px"
      >
        <Flex align="center" gap="20px">
          {viewData.media.heroImage ? (
            <Image
              className="gld-cover"
              src={viewData.media.heroImage}
              alt={`${group.title} cover`}
              w="140px"
              h="140px"
              m="10px 0"
              objectFit="cover"
              borderRadius="16px"
              borderWidth="1px"
              borderColor="theme.border"
              flexShrink={0}
            />
          ) : (
            <Flex
              className="gld-cover-placeholder"
              w="140px"
              h="140px"
              m="10px 0"
              borderRadius="16px"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor="theme.border"
              align="center"
              justify="center"
              flexShrink={0}
              bg="theme.bgSubtle"
            />
          )}
          <Box className="gld-header-text" flex="1" minW={0} mr={isAdminOrSteward ? 3 : 0}>
            <Text
              as="h1"
              fontFamily="heading"
              fontSize={{ base: "30px", md: "38px" }}
              fontWeight="700"
              lineHeight="1.02"
              letterSpacing="-0.01em"
              color="theme.text"
            >
              {viewData.identity.title}
            </Text>
            <Text
              fontFamily="serifBody"
              fontStyle="italic"
              fontSize="18px"
              color="theme.textSecondary"
              mt="3px"
              lineClamp={1}
            >
              {viewData.copy.summary}
            </Text>
            <Text
              fontSize="11.5px"
              fontWeight="600"
              letterSpacing="0.14em"
              textTransform="uppercase"
              color="theme.textMuted"
              mt="4px"
            >
              {viewData.members.memberCount} MEMBERS
            </Text>
          </Box>
          {isAdminOrSteward && (
            <QuickAnnouncementCreate groupSlug={group.slug} />
          )}
        </Flex>
        {isMember && user && (
          <Flex justify="flex-end" mt={2}>
            <Button
              className="gld-edit-profile-btn"
              size="xs"
              variant="outline"
              borderRadius="9999px"
              fontSize="12px"
              px="12px"
              onClick={() => setEditProfileOpen(true)}
            >
              Edit profile
            </Button>
          </Flex>
        )}
        {/* My Intro restore pill — only when card exists (no intro yet) and is collapsed */}
        {active === "introduce" && !hasIntro && isIntroCollapsed && (
          <Box
            position="absolute"
            bottom="10px"
            right={{ base: "18px", xl: "48px" }}
          >
            <Box
              as="button"
              display="inline-flex"
              alignItems="center"
              px="10px"
              py="3px"
              borderRadius="full"
              bg="theme.accentSoft"
              borderWidth="1px"
              borderColor="theme.accent"
              fontSize="11px"
              fontWeight="600"
              color="theme.accent"
              cursor="pointer"
              _hover={{ bg: "theme.accent", color: "white" }}
              transition="all 0.15s"
              onClick={() => {
                setIsIntroCollapsed(false);
                localStorage.setItem(`gld:${group.slug}:introCollapsed`, "false");
              }}
            >
              My Intro
            </Box>
          </Box>
        )}
      </Box>

      {/* 3-column body */}
      <Box
        className="gld-body"
        maxW="1360px"
        mx="auto"
        px={{ base: "18px", xl: "48px" }}
        pt={6}
        pb={12}
      >
        <Grid
          className="gld-grid"
          templateColumns={{
            base: "1fr",
            md: "244px 1fr",
            xl: showRail ? "244px 1fr 312px" : "244px 1fr",
          }}
          gap={{ base: 6, xl: "32px" }}
          alignItems="start"
        >
          {/* Left nav */}
          <GridItem>
            <Box
              className="gld-nav-sticky"
              position={{ base: "static", md: "sticky" }}
              top={{ md: "68px" }}
            >
              <LeftNav sections={navSections} active={active} onSelect={handleSelect} pinnedItems={pinnedNavItems} />
            </Box>
          </GridItem>

          {/* Main content */}
          <GridItem className="gld-main" minW={0}>
            <AnnouncementViewBox groupSlug={group.slug} />
            {active === "start" && (
              <GroupLandingDStartHere viewData={viewData} onNavigate={handleStartHereNavigate} />
            )}
            {active === "introduce" && (
              <>
                <GroupLandingDTellAboutYourself
                  groupSlug={group.slug}
                  isCollapsed={isIntroCollapsed}
                  onCollapse={() => {
                    setIsIntroCollapsed(true);
                    localStorage.setItem(`gld:${group.slug}:introCollapsed`, "true");
                  }}
                />
                <Box mt={4}>
                  <GroupLandingDIntroduce viewData={viewData} />
                </Box>
              </>
            )}
            {active === "members" && (
              <GroupLandingDIntroduce viewData={viewData} initialMemberUsername={selectedMemberUsername} />
            )}
            {(active === "share" || active === "converse") && (
              <Box>
                <ConnectSubtoolbar destination={active} />
                <ThreadworksTab group={group} />
              </Box>
            )}
            {isPinnedDiscussion && (
              <GroupLandingDDiscussionThread
                groupSlug={group.slug}
                forumSlug={pinnedForumSlug}
                discussionSlug={pinnedDiscussionSlug}
              />
            )}
            {active === "events" && (
              <GroupMemberEventsPanel groupSlug={group.slug} />
            )}
            {(active === "files" || active === "findings") && (
              <CollectionsTab group={group} selectedCollectionId={selectedCollectionId} />
            )}
          </GridItem>

          {/* Right rail — only on Welcome destinations */}
          {showRail && (
            <GridItem
              display={{ base: "none", xl: "block" }}
              className="gld-rail-col"
            >
              <Box position="sticky" top="68px">
                <GroupLandingDRail viewData={viewData} onNavigate={handleRailNavigate} />
              </Box>
            </GridItem>
          )}
        </Grid>
      </Box>

      {/* Edit profile modal — keeps focus within the group view */}
      <DialogRoot
        open={editProfileOpen}
        onOpenChange={(e) => setEditProfileOpen(e.open)}
        size="xl"
        scrollBehavior="inside"
      >
        <DialogBackdrop />
        <DialogContent maxH="90vh">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody pb={8}>
            <MemberProfileEdit
              onSave={() => setEditProfileOpen(false)}
              onCancel={() => setEditProfileOpen(false)}
            />
          </DialogBody>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}
