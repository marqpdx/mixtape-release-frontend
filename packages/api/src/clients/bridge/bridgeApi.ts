import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export interface RoomTokenResponse {
  token: string;
  room_name: string;
  livekit_url: string;
}

export const fetchBridgeRoomToken = async (sessionId: string): Promise<RoomTokenResponse> => {
  const response = await axiosInstance.post<RoomTokenResponse>("/api/bridge/room-token/", {
    session_id: sessionId,
  });
  return response.data;
};
