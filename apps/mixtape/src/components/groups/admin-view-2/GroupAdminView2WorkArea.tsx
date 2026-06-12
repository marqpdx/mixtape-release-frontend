"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Text,
  Heading,
  HStack,
  VStack,
  Button,
  Input,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import ProgressBar from "@components/common/Progress";
import {
  IconSearch,
  IconUsers,
  IconCalendar,
  IconHome,
  IconActivity,
  IconShield,
  IconFlag,
  IconMail,
  IconChevronRight,
  IconExternalLink,
} from "@tabler/icons-react";
import { useMembers } from "@mixtape/api/hooks/useMembers";
import { useGroupEvents } from "@mixtape/api/hooks/almanac/useGroupEvents";
import { useGroupActivityFeed } from "@mixtape/api/hooks/activity/useActivity";
import {
  fetchJoinRequests,
  respondToJoinRequest,
  type JoinRequest,
} from "@mixtape/api/clients/group/groupApi";
import type { Group } from "@mixtape/core/types/groupTypes";
import type { GroupActivityFeedItem } from "@mixtape/api/clients/activity/activityApi";
import { useRouter } from "next/navigation";

interface GroupAdminView2WorkAreaProps {
  group: Group;
}

// ─── Local types ────────────────────────────────────────────────────────────

type NavSection = "overview" | "activity" | "queue" | "members" | "events";

interface ActivityGroup {
  code: string;
  label: string;
  items: GroupActivityFeedItem[];
  expanded: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACTIVITY_LABELS: Record<string, string> = {
  post_published: "New posts",
  post_created: "New posts",
  comment_added: "Discussion replies",
  discussion_reply: "Discussion replies",
  purchase_completed: "Purchases",
  rsvp_created: "New RSVPs",
  rsvp_added: "New RSVPs",
  member_joined: "New members",
  library_item_added: "Library additions",
  writing_published: "New posts",
};

function groupActivityFeed(items: GroupActivityFeedItem[]): ActivityGroup[] {
  const groups: Record<string, GroupActivityFeedItem[]> = {};
  for (const item of items) {
    const label = ACTIVITY_LABELS[item.activity_code] ?? item.verb ?? "Other activity";
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }
  return Object.entries(groups).map(([code, groupItems]) => ({
    code,
    label: code,
    items: groupItems,
    expanded: false,
  }));
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

function formatEventDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatEventTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function GroupAdminView2WorkArea({ group }: GroupAdminView2WorkAreaProps) {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<NavSection>("overview");

  // Last-visit tracking
  const lastVisitKey = `groupAdminView2_lastVisit_${group.slug}`;
  const [lastVisit] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(lastVisitKey);
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(lastVisitKey, new Date().toISOString());
    }
  }, [lastVisitKey]);

  // Data fetching
  const { members, isLoading: membersLoading } = useMembers(group.slug);
  const { events, isLoading: eventsLoading } = useGroupEvents(group.slug);
  const { feed, isLoading: feedLoading } = useGroupActivityFeed(group.slug);

  // Join requests
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [joinLoading, setJoinLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const loadJoinRequests = useCallback(async () => {
    try {
      const raw = await fetchJoinRequests(group.slug);
      // Backend may return paginated { results: [...] } or a plain array
      const data = Array.isArray(raw) ? raw : ((raw as unknown as { results?: JoinRequest[] }).results ?? []);
      setJoinRequests(data);
    } catch {
      setJoinRequests([]);
    } finally {
      setJoinLoading(false);
    }
  }, [group.slug]);

  useEffect(() => { loadJoinRequests(); }, [loadJoinRequests]);

  const handleJoinAction = useCallback(async (id: number, action: "accept" | "decline") => {
    setActioningId(id);
    try {
      await respondToJoinRequest(group.slug, id, action);
      setJoinRequests(prev => prev.filter(r => r.id !== id));
    } finally {
      setActioningId(null);
    }
  }, [group.slug]);

  // Derived stats
  const memberCount = members?.length ?? 0;
  const pendingCount = joinRequests.length;

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => {
        const start = e.next_occurrence?.start;
        return start && new Date(start) >= now && e.status === "published";
      })
      .sort((a, b) => {
        const aDate = a.next_occurrence?.start ?? "";
        const bDate = b.next_occurrence?.start ?? "";
        return aDate.localeCompare(bDate);
      })
      .slice(0, 5);
  }, [events]);

  const nextEvent = upcomingEvents[0];
  const nextEventLabel = nextEvent?.title
    ? `Event ${formatEventDate(nextEvent.next_occurrence?.start)}`
    : null;

  // Activity grouped since last visit
  const activityGroups = useMemo(() => {
    const cutoff = lastVisit
      ? new Date(lastVisit)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = feed.filter(item => new Date(item.occurs_at) >= cutoff);
    return groupActivityFeed(recent);
  }, [feed, lastVisit]);

  // Member pulse
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const newMembers = useMemo(() =>
    (members ?? [])
      .filter(m => m.date_joined && new Date(m.date_joined) >= oneWeekAgo)
      .slice(0, 8),
    [members] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const recentMembers = useMemo(() =>
    (members ?? [])
      .filter(m => m.date_joined && new Date(m.date_joined) >= twoWeeksAgo)
      .sort((a, b) => b.date_joined.localeCompare(a.date_joined))
      .slice(0, 8),
    [members] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Expand/collapse activity groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (code: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  return (
    <Box className="gav2-root" minH="100vh" bg="theme.surface">
      {/* Zone 1 — Command Strip */}
      <CommandStrip
        group={group}
        memberCount={memberCount}
        pendingCount={pendingCount}
        nextEventLabel={nextEventLabel}
      />

      {/* Main grid */}
      <Grid
        className="gav2-grid"
        templateColumns="228px 1fr 320px"
        gap={5}
        px={6}
        py={5}
        maxW="1340px"
        mx="auto"
      >
        {/* Left nav */}
        <GridItem>
          <LeftNav
            active={activeNav}
            onSelect={setActiveNav}
            pendingCount={pendingCount}
          />
        </GridItem>

        {/* Center spine */}
        <GridItem>
          <VStack gap={5} align="stretch">
            {/* Zone 2 — Action Queue */}
            <ActionQueue
              joinRequests={joinRequests}
              joinLoading={joinLoading}
              actioningId={actioningId}
              onJoinAction={handleJoinAction}
            />

            {/* Zone 3 — Activity Stream */}
            <ActivityStream
              groups={activityGroups}
              isLoading={feedLoading}
              lastVisit={lastVisit}
              expandedGroups={expandedGroups}
              onToggle={toggleGroup}
            />
          </VStack>
        </GridItem>

        {/* Right rail */}
        <GridItem>
          <VStack gap={5} align="stretch">
            {/* Zone 4 — Events */}
            <EventsPanel
              events={upcomingEvents}
              isLoading={eventsLoading}
              groupSlug={group.slug}
              router={router}
            />

            {/* Zone 5 — Member Pulse */}
            <MemberPulse
              newMembers={newMembers}
              recentMembers={recentMembers}
              isLoading={membersLoading}
            />
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
}

// ─── Zone 1: Command Strip ────────────────────────────────────────────────────

function CommandStrip({
  group,
  memberCount,
  pendingCount,
  nextEventLabel,
}: {
  group: Group;
  memberCount: number;
  pendingCount: number;
  nextEventLabel: string | null;
}) {
  return (
    <Box
      className="gav2-command-strip"
      bg="theme.bgSecondary"
      borderBottomWidth="1px"
      borderColor="theme.border"
      px={6}
      py={4}
    >
      <Flex align="center" justify="space-between" maxW="1340px" mx="auto" gap={6}>
        <Box minW={0}>
          <Heading size="md" fontWeight="700" mb={0.5} overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">
            {group.title}
          </Heading>
          <HStack gap={2} fontSize="sm" color="theme.textSecondary">
            <Text>{memberCount} members</Text>
            {pendingCount > 0 && (
              <>
                <Text>·</Text>
                <Text color="orange.600" fontWeight="semibold">
                  {pendingCount} pending
                </Text>
              </>
            )}
            {nextEventLabel && (
              <>
                <Text>·</Text>
                <HStack gap={1}>
                  <IconCalendar size={12} />
                  <Text>{nextEventLabel}</Text>
                </HStack>
              </>
            )}
          </HStack>
        </Box>

        {/* Stub search field — TODO: wire Beryl search — see decisions/surfaces/beryl-search-spec.md */}
        <Box flex="1" maxW="480px" position="relative">
          <Input
            placeholder="Search this group… (coming soon)"
            size="sm"
            bg="theme.surface"
            borderRadius="lg"
            disabled
            _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
            pl={8}
          />
          <Box position="absolute" left={2.5} top="50%" transform="translateY(-50%)" color="orange.500" pointerEvents="none" zIndex={1}>
            <IconSearch size={14} />
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}

// ─── Left Nav ─────────────────────────────────────────────────────────────────

type NavItem = { key: NavSection; label: string; icon: React.ReactNode; badge?: number };

function LeftNav({
  active,
  onSelect,
  pendingCount,
}: {
  active: NavSection;
  onSelect: (s: NavSection) => void;
  pendingCount: number;
}) {
  const navItems: NavItem[] = [
    { key: "overview", label: "Command Center", icon: <IconHome size={15} /> },
    { key: "activity", label: "Activity", icon: <IconActivity size={15} /> },
    { key: "queue", label: "Action Queue", icon: <IconShield size={15} />, badge: pendingCount || undefined },
    { key: "members", label: "Members", icon: <IconUsers size={15} /> },
    { key: "events", label: "Events", icon: <IconCalendar size={15} /> },
  ];

  return (
    <Box
      className="gav2-left-nav"
      bg="theme.bgSecondary"
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="xl"
      overflow="hidden"
      position="sticky"
      top="80px"
    >
      <Box px={3} py={2} borderBottomWidth="1px" borderColor="theme.border">
        <Text fontSize="10px" fontWeight="700" letterSpacing="wider" color="theme.textSecondary" textTransform="uppercase">
          Overview
        </Text>
      </Box>

      <VStack gap={0} align="stretch" p={1.5}>
        {navItems.map(item => (
          <Button
            key={item.key}
            variant={active === item.key ? "subtle" : "ghost"}
            colorPalette={active === item.key ? "orange" : "gray"}
            justifyContent="flex-start"
            size="sm"
            borderRadius="lg"
            fontWeight={active === item.key ? "600" : "400"}
            onClick={() => onSelect(item.key)}
          >
            <HStack gap={2} flex={1}>
              {item.icon}
              <Text flex={1}>{item.label}</Text>
              {item.badge ? (
                <Badge colorPalette="orange" variant="solid" borderRadius="full" fontSize="10px">
                  {item.badge}
                </Badge>
              ) : null}
            </HStack>
          </Button>
        ))}
      </VStack>

      {/* Studio link note */}
      <Box mx={2} mb={2} px={3} py={2} bg="theme.surface" borderRadius="lg" borderWidth="1px" borderColor="theme.border">
        <Text fontSize="xs" color="theme.textSecondary">
          Settings, billing &amp; content live in <Text as="span" color="orange.600" fontWeight="600">Studio →</Text>
        </Text>
      </Box>
    </Box>
  );
}

// ─── Zone 2: Action Queue ─────────────────────────────────────────────────────

function ActionQueue({
  joinRequests,
  joinLoading,
  actioningId,
  onJoinAction,
}: {
  joinRequests: JoinRequest[];
  joinLoading: boolean;
  actioningId: number | null;
  onJoinAction: (id: number, action: "accept" | "decline") => void;
}) {
  const totalPending = joinRequests.length;

  return (
    <Box
      className="gav2-action-queue"
      bg="theme.bgSecondary"
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="xl"
      borderLeftWidth="4px"
      borderLeftColor="orange.500"
      overflow="hidden"
    >
      <Box px={5} py={4} borderBottomWidth="1px" borderColor="theme.border">
        <Flex align="center" justify="space-between" gap={3}>
          <Box>
            <Heading size="sm" fontWeight="600" mb={0.5}>Action queue</Heading>
            <Text fontSize="xs" color="theme.textSecondary">
              {totalPending === 0 ? "All clear — nothing waiting." : `${totalPending} item${totalPending > 1 ? "s" : ""} waiting on a decision`}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Join Requests */}
      <QueueSection
        title="Join Requests"
        icon={<IconUsers size={14} />}
        count={joinRequests.length}
        tagColor="green"
      >
        {joinLoading ? (
          <Box py={4} textAlign="center"><Spinner size="sm" /></Box>
        ) : joinRequests.length === 0 ? (
          <Text fontSize="sm" color="theme.textSecondary" py={3} px={5}>No pending join requests.</Text>
        ) : (
          joinRequests.map(req => (
            <JoinRequestRow
              key={req.id}
              request={req}
              isActioning={actioningId === req.id}
              onApprove={() => onJoinAction(req.id, "accept")}
              onDeny={() => onJoinAction(req.id, "decline")}
            />
          ))
        )}
      </QueueSection>

      {/* Open Inquiries */}
      <QueueSection
        title="Open Inquiries"
        icon={<IconMail size={14} />}
        count={0}
        tagColor="purple"
      >
        <Text fontSize="sm" color="theme.textSecondary" py={3} px={5}>No open inquiries.</Text>
      </QueueSection>

      {/* Flagged Content */}
      <QueueSection
        title="Flagged Content"
        icon={<IconFlag size={14} />}
        count={0}
        tagColor="red"
      >
        <Text fontSize="sm" color="theme.textSecondary" py={3} px={5}>Nothing flagged.</Text>
      </QueueSection>
    </Box>
  );
}

function QueueSection({
  title,
  icon,
  count,
  tagColor,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  tagColor: string;
  children: React.ReactNode;
}) {
  return (
    <Box borderTopWidth="1px" borderColor="theme.border">
      <Flex align="center" gap={2} px={5} py={2.5} bg="theme.surface">
        {icon}
        <Text fontSize="xs" fontWeight="600" flex={1}>{title}</Text>
        {count > 0 && (
          <Badge colorPalette={tagColor} variant="subtle" borderRadius="full" fontSize="10px">
            {count}
          </Badge>
        )}
      </Flex>
      {children}
    </Box>
  );
}

function JoinRequestRow({
  request,
  isActioning,
  onApprove,
  onDeny,
}: {
  request: JoinRequest;
  isActioning: boolean;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const displayName = request.invited_user || request.invited_email || `Request #${request.id}`;
  return (
    <Box px={5} py={3} borderTopWidth="1px" borderColor="theme.border" _first={{ borderTopWidth: 0 }}>
      <HStack gap={3} mb={1}>
        <Box w="36px" h="36px" borderRadius="lg" bg="orange.100" flexShrink={0} display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" fontWeight="700" color="orange.700">
            {displayName[0]?.toUpperCase() ?? "?"}
          </Text>
        </Box>
        <Box flex={1} minW={0}>
          <Text fontSize="sm" fontWeight="600" overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">{displayName}</Text>
          {request.message && (
            <Text fontSize="xs" color="theme.textSecondary" fontStyle="italic" overflow="hidden" mt={0.5}>
              "{request.message}"
            </Text>
          )}
        </Box>
      </HStack>
      <Flex gap={2} justify="flex-end" mt={2}>
        <Button
          size="xs"
          colorPalette="green"
          variant="solid"
          loading={isActioning}
          onClick={onApprove}
        >
          Approve
        </Button>
        <Button
          size="xs"
          variant="outline"
          loading={isActioning}
          onClick={onDeny}
        >
          Deny
        </Button>
      </Flex>
    </Box>
  );
}

// ─── Zone 3: Activity Stream ──────────────────────────────────────────────────

function ActivityStream({
  groups,
  isLoading,
  lastVisit,
  expandedGroups,
  onToggle,
}: {
  groups: ActivityGroup[];
  isLoading: boolean;
  lastVisit: string | null;
  expandedGroups: Set<string>;
  onToggle: (code: string) => void;
}) {
  const sinceLabel = lastVisit
    ? `Since ${formatTimeAgo(lastVisit)} ago`
    : "Last 7 days";

  return (
    <Box
      className="gav2-activity-stream"
      bg="theme.bgSecondary"
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="xl"
      overflow="hidden"
    >
      <Flex align="center" justify="space-between" px={5} py={4} borderBottomWidth="1px" borderColor="theme.border">
        <Box>
          <Heading size="sm" fontWeight="600" mb={0.5}>While you were away</Heading>
          <Text fontSize="xs" color="theme.textSecondary">{sinceLabel}</Text>
        </Box>
      </Flex>

      {isLoading ? (
        <Box py={8} textAlign="center"><Spinner size="sm" /></Box>
      ) : groups.length === 0 ? (
        <Text fontSize="sm" color="theme.textSecondary" p={5}>No new activity since your last visit.</Text>
      ) : (
        groups.map(group => (
          <Box key={group.label} borderTopWidth="1px" borderColor="theme.border">
            <Flex
              align="center"
              gap={3}
              px={5}
              py={3}
              cursor="pointer"
              _hover={{ bg: "theme.surface" }}
              onClick={() => onToggle(group.label)}
            >
              <Text fontSize="2xl" fontWeight="600" color="orange.600" w="40px" textAlign="center" lineHeight="1">
                {group.items.length}
              </Text>
              <Text fontSize="sm" flex={1}>{group.label}</Text>
              <IconChevronRight
                size={14}
                style={{
                  transform: expandedGroups.has(group.label) ? "rotate(90deg)" : "none",
                  transition: "transform 0.15s",
                  opacity: 0.5,
                }}
              />
            </Flex>
            {expandedGroups.has(group.label) && (
              <Box px={5} pb={3}>
                {group.items.slice(0, 5).map(item => (
                  <HStack key={item.id} gap={2} py={1.5} borderTopWidth="1px" borderColor="theme.border" _first={{ borderTopWidth: 0 }}>
                    <Text fontSize="xs" flex={1} color="theme.text">
                      <Text as="span" fontWeight="600">{item.actor_name}</Text> {item.verb}
                    </Text>
                    <Text fontSize="xs" color="theme.textSecondary" flexShrink={0}>
                      {formatTimeAgo(item.occurs_at)}
                    </Text>
                  </HStack>
                ))}
              </Box>
            )}
          </Box>
        ))
      )}
    </Box>
  );
}

// ─── Zone 4: Events Panel ─────────────────────────────────────────────────────

function EventsPanel({
  events,
  isLoading,
  groupSlug,
  router,
}: {
  events: ReturnType<typeof useGroupEvents>["events"];
  isLoading: boolean;
  groupSlug: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <Box
      className="gav2-events-panel"
      bg="theme.bgSecondary"
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="xl"
      overflow="hidden"
    >
      <Flex align="center" justify="space-between" px={4} py={3} borderBottomWidth="1px" borderColor="theme.border">
        <Heading size="xs" fontWeight="700" textTransform="uppercase" letterSpacing="wider" color="theme.textSecondary">
          Events
        </Heading>
        <Button
          size="xs"
          variant="ghost"
          colorPalette="orange"
          onClick={() => router.push(`/groups/${groupSlug}?view=admin&section=almanac-landing`)}
        >
          Manage
        </Button>
      </Flex>

      {isLoading ? (
        <Box py={8} textAlign="center"><Spinner size="sm" /></Box>
      ) : events.length === 0 ? (
        <Box px={4} py={4}>
          <Text fontSize="sm" color="theme.textSecondary" mb={2}>No upcoming events.</Text>
          <Button
            size="xs"
            variant="outline"
            colorPalette="orange"
            onClick={() => router.push(`/groups/${groupSlug}?view=admin&section=almanac-landing`)}
          >
            Create one
          </Button>
        </Box>
      ) : (
        <VStack gap={0} align="stretch">
          {events.map((event, idx) => {
            const start = event.next_occurrence?.start;
            const going = event.total_attendees ?? 0;
            const cap = event.max_attendees;
            const fillPct = cap ? Math.min(100, (going / cap) * 100) : null;
            const statusColors: Record<string, string> = {
              published: "green",
              draft: "gray",
              archived: "gray",
            };

            return (
              <Box
                key={event.id}
                px={4}
                py={3}
                borderTopWidth={idx > 0 ? "1px" : 0}
                borderColor="theme.border"
                cursor="pointer"
                _hover={{ bg: "theme.surface" }}
                onClick={() => router.push(`/groups/${groupSlug}/events/${event.slug}`)}
              >
                <Flex align="flex-start" gap={3}>
                  <Box textAlign="center" flexShrink={0} minW="36px">
                    <Text fontSize="10px" fontWeight="700" color="theme.textSecondary" textTransform="uppercase">
                      {start ? new Date(start).toLocaleDateString("en-US", { month: "short" }) : "—"}
                    </Text>
                    <Text fontSize="lg" fontWeight="700" color="orange.600" lineHeight="1">
                      {start ? new Date(start).getDate() : "—"}
                    </Text>
                  </Box>
                  <Box flex={1} minW={0}>
                    <HStack gap={1} mb={0.5}>
                      <Text fontSize="sm" fontWeight="600" flex={1} overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">{event.title}</Text>
                      <Badge colorPalette={statusColors[event.status] ?? "gray"} variant="subtle" fontSize="9px" flexShrink={0}>
                        {event.status}
                      </Badge>
                    </HStack>
                    {start && (
                      <Text fontSize="xs" color="theme.textSecondary" mb={1}>
                        {formatEventDate(start)} · {formatEventTime(start)}
                      </Text>
                    )}
                    {fillPct !== null && (
                      <Box>
                        <ProgressBar value={fillPct} size="xs" mb={0.5} label="" />
                        <Text fontSize="10px" color="theme.textSecondary">
                          {going}/{cap} going
                        </Text>
                      </Box>
                    )}
                    {cap === undefined && going > 0 && (
                      <Text fontSize="10px" color="theme.textSecondary">{going} going</Text>
                    )}
                  </Box>
                  <IconExternalLink size={12} style={{ opacity: 0.4, flexShrink: 0, marginTop: 2 }} />
                </Flex>
              </Box>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}

// ─── Zone 5: Member Pulse ─────────────────────────────────────────────────────

function MemberPulse({
  newMembers,
  recentMembers,
  isLoading,
}: {
  newMembers: ReturnType<typeof useMembers>["members"];
  recentMembers: ReturnType<typeof useMembers>["members"];
  isLoading: boolean;
}) {
  return (
    <Box
      className="gav2-member-pulse"
      bg="theme.bgSecondary"
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="xl"
      overflow="hidden"
    >
      <Box px={4} py={3} borderBottomWidth="1px" borderColor="theme.border">
        <Heading size="xs" fontWeight="700" textTransform="uppercase" letterSpacing="wider" color="theme.textSecondary">
          Member Pulse
        </Heading>
      </Box>

      {isLoading ? (
        <Box py={8} textAlign="center"><Spinner size="sm" /></Box>
      ) : (
        <Grid templateColumns="1fr 1fr" gap={0}>
          <Box px={4} py={3} borderRightWidth="1px" borderColor="theme.border">
            <Text fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="wider" color="theme.textSecondary" mb={2}>
              New this week
            </Text>
            {newMembers.length === 0 ? (
              <Text fontSize="xs" color="theme.textSecondary">No new members this week.</Text>
            ) : (
              <VStack gap={2} align="stretch">
                {newMembers.map(m => (
                  <HStack key={m.member_id} gap={2}>
                    <Box w="26px" h="26px" borderRadius="md" bg="orange.100" flexShrink={0} display="flex" alignItems="center" justifyContent="center">
                      <Text fontSize="10px" fontWeight="700" color="orange.700">
                        {(m.display_name ?? m.username ?? "?")[0]?.toUpperCase()}
                      </Text>
                    </Box>
                    <Box minW={0}>
                      <Text fontSize="xs" fontWeight="600" overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">{m.display_name || m.username}</Text>
                      <Text fontSize="10px" color="theme.textSecondary">{formatTimeAgo(m.date_joined)} ago</Text>
                    </Box>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>

          <Box px={4} py={3}>
            <Text fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="wider" color="theme.textSecondary" mb={2}>
              Recently active
            </Text>
            {recentMembers.length === 0 ? (
              <Text fontSize="xs" color="theme.textSecondary">Quiet this week.</Text>
            ) : (
              <VStack gap={2} align="stretch">
                {recentMembers.map(m => (
                  <HStack key={m.member_id} gap={2}>
                    <Box position="relative" flexShrink={0}>
                      <Box w="26px" h="26px" borderRadius="md" bg="blue.100" display="flex" alignItems="center" justifyContent="center">
                        <Text fontSize="10px" fontWeight="700" color="blue.700">
                          {(m.display_name ?? m.username ?? "?")[0]?.toUpperCase()}
                        </Text>
                      </Box>
                      <Box position="absolute" bottom="-1px" right="-1px" w="8px" h="8px" borderRadius="full" bg="green.400" borderWidth="1.5px" borderColor="theme.bgSecondary" />
                    </Box>
                    <Box minW={0}>
                      <Text fontSize="xs" fontWeight="600" overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">{m.display_name || m.username}</Text>
                      <Text fontSize="10px" color="theme.textSecondary">{formatTimeAgo(m.date_joined)}</Text>
                    </Box>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>
        </Grid>
      )}
    </Box>
  );
}
