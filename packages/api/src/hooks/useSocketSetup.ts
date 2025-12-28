// src/hooks/useSocketSetup.ts

"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { getSocket, initializeSocket } from "@/lib/socket";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { UserIdentity } from "@mixtape/core/types/auth";

/**
 * Initializes the shared socket, registers the user, and joins all conversation rooms.
 * Cleans up by leaving the rooms it joined (no disconnects, no handler off() here).
 */
export function useSocketSetup(identity: UserIdentity | null | undefined) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const joinedSlugsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!identity?.username) {
        console.log("[useSocketSetup] No username, skipping socket setup");
        return;
      }

      console.log("[useSocketSetup] Initializing socket for:", identity.username);
      const s = await initializeSocket();
      if (!mounted || !s) {
        console.warn("[useSocketSetup] Failed to initialize socket");
        return;
      }

      setSocket(s);

      // Optional legacy: if your server still listens to "register"
      s.emit("register", identity.username);
      console.log("[useSocketSetup] Registered user:", identity.username);

      // Join all existing conversations
      try {
        const res = await axiosInstance.get("/api/chat/conversations");
        const conversations: Array<{ slug?: string }> = Array.isArray(res.data) ? res.data : [];

        conversations.forEach((conv) => {
          if (conv?.slug) {
            // 🔁 Standardize on join_conversation / leave_conversation
            s.emit("join_conversation", { conversationSlug: conv.slug });
            joinedSlugsRef.current.add(conv.slug);
            console.log("[useSocketSetup] Joined chat:", conv.slug);
          }
        });

        console.log(`[useSocketSetup] Joined ${joinedSlugsRef.current.size} chat conversations`);
      } catch (err) {
        console.error("[useSocketSetup] Failed to join chat conversations:", err);
      }
    })();

    return () => {
      mounted = false;

      const s2 = getSocket();
      if (!s2) return;

      // Leave only the rooms this hook joined
      joinedSlugsRef.current.forEach((slug) => {
        s2.emit("leave_conversation", { conversationSlug: slug });
      });
      joinedSlugsRef.current.clear();

      // ❌ Do NOT disconnect the shared socket here
      // ❌ Do NOT off() handlers here (this hook didn't attach any)
    };
  }, [identity?.username]);

  return socket;
}
