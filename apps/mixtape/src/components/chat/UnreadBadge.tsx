// components/chat/UnreadBadge.tsx

import { Box } from "@chakra-ui/react";

interface UnreadBadgeProps {
  name: string | null;
  participants: string[];
  unreadCount: number;
}

export const UnreadBadge = ({ name, participants, unreadCount }: UnreadBadgeProps) => (
  <Box position="relative">
    {void name}
    {void participants}
    {/* <Text fontWeight="bold">
      {name || participants.join(", ")}
    </Text> */}
    {unreadCount > 0 && (
      <Box
        position="absolute"
        top={1}
        right={2}
        bg="red.500"
        color="white"
        fontSize="xs"
        px={2}
        py={0.5}
        borderRadius="md"
      >
        {unreadCount}
      </Box>
    )}
  </Box>
);
