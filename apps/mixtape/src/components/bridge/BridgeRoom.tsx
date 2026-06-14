"use client";

import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { Flex } from "@chakra-ui/react";
import { BridgeParticipantGrid } from "./BridgeParticipantGrid";
import { BridgeControls } from "./BridgeControls";

interface BridgeRoomProps {
  token: string;
  livekitUrl: string;
}

export function BridgeRoom({ token, livekitUrl }: BridgeRoomProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      video={true}
      audio={true}
      connectOptions={{ autoSubscribe: true }}
    >
      <Flex className="bridge-room" direction="column" h="100dvh" bg="gray.900">
        <BridgeParticipantGrid />
        <BridgeControls />
      </Flex>
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
