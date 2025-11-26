// lib/chat/createOrGetConversation.ts

import { axiosInstance } from "@providers/auth-provider/axiosInstance";

export const createOrGetConversation = async (
  participants: string[],
): Promise<any | null> => {
  try {
    const res = await axiosInstance.post("/api/chat/conversations", {
      participants,
    });
    return res.data; // includes slug, etc.
  } catch (err) {
    console.error("❌ Failed to create/fetch conversation", err);
    return null;
  }
};
