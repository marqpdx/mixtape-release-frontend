"use client";

import { useParams } from "next/navigation";
import { Box, Text, Spinner } from "@chakra-ui/react";
import { BridgeRoom } from "@/components/bridge/BridgeRoom";
import { useBridgeRoomToken } from "@/components/bridge/useBridgeRoomToken";

export default function BridgePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { token, livekitUrl, isLoading, error } = useBridgeRoomToken(sessionId);

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" h="100dvh" bg="gray.900">
        <Spinner color="blue.400" size="lg" />
      </Box>
    );
  }

  if (error || !token || !livekitUrl) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" h="100dvh" bg="gray.900">
        <Text color="red.400">Unable to join room.</Text>
      </Box>
    );
  }

  return <BridgeRoom token={token} livekitUrl={livekitUrl} />;
}
