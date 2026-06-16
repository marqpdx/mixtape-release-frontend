"use client";

import { Box, Flex, Image, Text, Spinner } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchGroupEvents } from "@mixtape/api/clients/almanac/almanacApi";
import type { GroupMemberViewData } from "../member-views/useGroupMemberViewData";

interface RailProps {
  viewData: GroupMemberViewData;
  onNavigate: (id: "introduce" | "files" | "events" | "members", collectionId?: string, memberUsername?: string) => void;
}

function RailCard({ children }: { children: React.ReactNode }) {
  return (
    <Box
      bg="theme.surface"
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="16px"
      boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
      overflow="hidden"
    >
      {children}
    </Box>
  );
}

function RailHeader({ title, count }: { title: string; count: number | string }) {
  return (
    <Box px={5} pt={5} pb={3} borderBottomWidth="1px" borderColor="theme.border">
      <Text fontFamily="heading" fontSize="18px" fontWeight="600" color="theme.text">
        {title}{" "}
        <Box as="span" fontWeight="400" fontSize="15px" color="theme.textSecondary">
          ({count})
        </Box>
      </Text>
    </Box>
  );
}

function RailFooter({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Box
      as="button"
      display="block"
      w="full"
      textAlign="left"
      px={5}
      py={3}
      borderTopWidth="1px"
      borderColor="theme.border"
      fontSize="14px"
      fontWeight="600"
      color="theme.accent"
      cursor="pointer"
      _hover={{ bg: "theme.bgSubtle" }}
      onClick={onClick}
    >
      {label}
    </Box>
  );
}

function formatRailEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric" });
}

function UpcomingEventsRailCard({
  groupSlug,
  onNavigate,
}: {
  groupSlug: string;
  onNavigate: RailProps["onNavigate"];
}) {
  const { data: events, isLoading } = useQuery({
    queryKey: ["almanac", "events", "published", groupSlug],
    queryFn: () => fetchGroupEvents(groupSlug, { status: "published" }),
  });

  const now = new Date();
  const upcoming = (events ?? [])
    .filter((e) => e.next_occurrence?.start && new Date(e.next_occurrence.start) >= now)
    .sort((a, b) =>
      new Date(a.next_occurrence!.start).getTime() - new Date(b.next_occurrence!.start).getTime()
    )
    .slice(0, 3);

  if (!isLoading && upcoming.length === 0) return null;

  return (
    <RailCard>
      <RailHeader title="Events" count={upcoming.length} />
      <Box>
        {isLoading && (
          <Flex justify="center" py={4}>
            <Spinner size="sm" color="theme.accent" />
          </Flex>
        )}
        {!isLoading && upcoming.map((event) => (
          <Flex
            key={event.id}
            className="gld-rail-event"
            align="center"
            gap={3}
            px={5}
            py="10px"
            borderBottomWidth="1px"
            borderColor="theme.border"
            _last={{ borderBottomWidth: 0 }}
          >
            <Box
              flexShrink={0}
              px="7px"
              py="3px"
              borderRadius="6px"
              bg="theme.accentSoft"
              minW="44px"
              textAlign="center"
            >
              <Text fontSize="11px" fontWeight="700" color="theme.accent" lineHeight="1.4">
                {event.next_occurrence?.start
                  ? formatRailEventDate(event.next_occurrence.start)
                  : "—"}
              </Text>
            </Box>
            <Text flex="1" fontSize="13.5px" fontWeight="500" color="theme.text" truncate>
              {event.title}
            </Text>
          </Flex>
        ))}
      </Box>
      <RailFooter label="See all events" onClick={() => onNavigate("events")} />
    </RailCard>
  );
}

export function GroupLandingDRail({ viewData, onNavigate }: RailProps) {
  const { members, collections, circles, identity } = viewData;
  const router = useRouter();

  return (
    <Flex className="gld-rail" direction="column" gap={4}>
      {/* Members card */}
      <RailCard>
        <RailHeader title="Members" count={members.memberCount} />
        <Box>
          {members.active.slice(0, 5).map((member) => (
            <Flex
              key={member.member_id}
              as="button"
              className="gld-rail-member"
              align="center"
              gap={3}
              px={5}
              py="10px"
              w="full"
              textAlign="left"
              cursor="pointer"
              _hover={{ bg: "theme.bgSubtle" }}
              transition="background 0.12s"
              onClick={() => onNavigate("members", undefined, member.username ?? undefined)}
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
                  fontSize="15px"
                  fontWeight="700"
                  flexShrink={0}
                >
                  {(member.display_name || member.username || "?")
                    .charAt(0)
                    .toUpperCase()}
                </Flex>
              )}
              <Box flex="1" minW={0}>
                <Text
                  fontWeight="600"
                  fontSize="14.5px"
                  color="theme.text"
                  lineHeight="1.2"
                  truncate
                >
                  {member.display_name || member.username}
                </Text>
                <Flex align="center" gap={1}>
                  {member.roles.includes("admin") && (
                    <Box
                      w="6px"
                      h="6px"
                      bg="theme.accent"
                      transform="rotate(45deg)"
                      flexShrink={0}
                    />
                  )}
                  <Text
                    fontSize="11px"
                    fontWeight="600"
                    letterSpacing="0.06em"
                    textTransform="uppercase"
                    color="theme.textMuted"
                  >
                    {member.roles.includes("admin")
                      ? "Admin"
                      : member.roles.includes("steward")
                      ? "Steward"
                      : "Member"}
                  </Text>
                </Flex>
              </Box>
            </Flex>
          ))}
        </Box>
        <RailFooter label="View all members" onClick={() => onNavigate("members")} />
      </RailCard>

      {/* Upcoming Events card */}
      <UpcomingEventsRailCard groupSlug={identity.slug} onNavigate={onNavigate} />

      {/* Collections card */}
      <RailCard>
        <RailHeader title="Collections" count={collections.count} />
        <Box>
          {collections.ordered.slice(0, 5).map((col) => (
            <Flex
              key={col.id}
              as="button"
              className="gld-rail-collection"
              align="center"
              gap={3}
              px={5}
              py="10px"
              w="full"
              textAlign="left"
              cursor="pointer"
              _hover={{ bg: "theme.bgSubtle" }}
              transition="background 0.12s"
              onClick={() => onNavigate("files", col.id)}
            >
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg="theme.accent"
                flexShrink={0}
              />
              <Text flex="1" fontSize="14px" color="theme.accent" truncate fontWeight="500">
                {col.title}
              </Text>
              <Text fontSize="13px" color="theme.textMuted" flexShrink={0}>
                ({col.item_count ?? 0})
              </Text>
            </Flex>
          ))}
          {collections.ordered.length === 0 && !collections.isLoading && (
            <Text px={5} py={4} fontSize="14px" color="theme.textMuted">
              No collections yet.
            </Text>
          )}
        </Box>
        <RailFooter label="Browse collections" onClick={() => onNavigate("files")} />
      </RailCard>

      {/* Circles card — only shown when the group has circles */}
      {(circles.count > 0 || circles.isLoading) && (
        <RailCard>
          <RailHeader title="Circles" count={circles.count} />
          <Box>
            {circles.all.slice(0, 5).map((circle) => (
              <Flex
                key={circle.id}
                as="button"
                className="gld-rail-circle"
                align="center"
                gap={3}
                px={5}
                py="10px"
                w="full"
                textAlign="left"
                cursor="pointer"
                _hover={{ bg: "theme.bgSubtle" }}
                transition="background 0.12s"
                onClick={() =>
                  router.push(`/groups/${identity.slug}/circles/${circle.slug}`)
                }
              >
                <Box
                  w="8px"
                  h="8px"
                  borderRadius="2px"
                  bg="theme.accent"
                  flexShrink={0}
                  transform="rotate(45deg)"
                />
                <Text flex="1" fontSize="14px" color="theme.accent" truncate fontWeight="500">
                  {circle.title}
                </Text>
                <Text fontSize="13px" color="theme.textMuted" flexShrink={0}>
                  ({circle.member_count ?? 0})
                </Text>
              </Flex>
            ))}
            {circles.count === 0 && !circles.isLoading && (
              <Text px={5} py={4} fontSize="14px" color="theme.textMuted">
                No circles yet.
              </Text>
            )}
          </Box>
        </RailCard>
      )}
    </Flex>
  );
}
