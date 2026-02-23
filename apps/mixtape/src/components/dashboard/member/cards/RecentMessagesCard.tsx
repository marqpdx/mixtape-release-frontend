"use client";

import { Box, HStack, Text, VStack, Badge } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useConversations } from "@mixtape/api/hooks/chat/useConversations";
import { useChatUnread } from "@/contexts/ChatUnreadContext";
import { useAuth } from "@/lib/auth/AuthContext";
import type { UserIdentity } from "@mixtape/core/types/auth";
import DashboardCard from "./DashboardCard";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface RecentMessagesCardProps {
  identity: UserIdentity;
  onViewAll: () => void;
}

export default function RecentMessagesCard({ onViewAll }: RecentMessagesCardProps) {
  const { conversations, isLoading } = useConversations();
  const { unreads } = useChatUnread();
  const { user } = useAuth();
  const username = user?.username;

  const sorted = [...conversations]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4);

  const timeColor = useColorModeValue("gray.500", "gray.400");
  const snippetColor = useColorModeValue("gray.600", "gray.300");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const getParticipantDisplay = (participants: string[]) => {
    const others = participants.filter((p) => p !== username);
    if (others.length === 0) return "You";
    if (others.length <= 2) return others.join(", ");
    return `${others[0]}, ${others[1]} +${others.length - 2}`;
  };

  return (
    <DashboardCard
      title="Recent Messages"
      viewAllOnClick={onViewAll}
      isLoading={isLoading}
      isEmpty={sorted.length === 0}
      emptyMessage="No messages yet"
      emptyCta={{ label: "Open Messages", onClick: onViewAll }}
    >
      <VStack gap={0} align="stretch">
        {sorted.map((conv) => {
          const unreadCount = unreads?.[conv.slug] ?? 0;
          return (
            <HStack
              key={conv.slug}
              px={2}
              py={2}
              borderRadius="md"
              _hover={{ bg: hoverBg }}
              cursor="pointer"
              onClick={() => { window.location.href = `/app/chat/${conv.slug}`; }}
              gap={3}
            >
              <Box flex="1" minW={0}>
                <HStack gap={2}>
                  <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                    {conv.title || getParticipantDisplay(conv.participants)}
                  </Text>
                  {unreadCount > 0 && (
                    <Badge size="sm" colorPalette="blue" borderRadius="full">
                      {unreadCount}
                    </Badge>
                  )}
                </HStack>
                {conv.last_message && (
                  <Text fontSize="xs" color={snippetColor} lineClamp={1} mt={0.5}>
                    {conv.last_message.text}
                  </Text>
                )}
              </Box>
              <Text fontSize="xs" color={timeColor} flexShrink={0}>
                {timeAgo(conv.updated_at)}
              </Text>
            </HStack>
          );
        })}
      </VStack>
    </DashboardCard>
  );
}
