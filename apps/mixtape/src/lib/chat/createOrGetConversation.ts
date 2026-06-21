// lib/chat/createOrGetConversation.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import type { Conversation, TrustProfile } from "@/components/chat/interfaces";

export const createOrGetConversation = async (
  participants: string[],
  trustProfile: TrustProfile = "standard",
): Promise<Conversation | null> => {
  try {
    const res = await axiosInstance.post("/api/chat/conversations", {
      participants,
      trust_profile: trustProfile,
    });
    return res.data;
  } catch (err) {
    console.error("❌ Failed to create/fetch conversation", err);
    return null;
  }
};
