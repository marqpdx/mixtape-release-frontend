// src/contexts/ChatUnreadContext.tsx
"use client";
import React, { createContext, useContext, useMemo, useCallback, useState } from "react";

export type Unreads = Record<string, number>;

type ChatUnreadCtx = {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  unreads: Unreads;
  setAllUnreads: React.Dispatch<React.SetStateAction<Unreads>>; // expose the real setter
  incrementUnread: (cid: string, delta?: number) => void;
  resetUnread: (cid: string) => void;
};

const Ctx = createContext<ChatUnreadCtx | null>(null);

export const ChatUnreadProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [unreads, setUnreads] = useState<Unreads>({});

  const incrementUnread = useCallback((cid: string, delta = 1) => {
    setUnreads((u) => ({ ...u, [cid]: Math.max(0, (u[cid] ?? 0) + delta) }));
  }, []);

  const resetUnread = useCallback((cid: string) => {
    setUnreads((u) => (u[cid] ? { ...u, [cid]: 0 } : u));
  }, []);

  const value = useMemo(
    () => ({
      activeConversationId,
      setActiveConversationId,        // React setter (stable)
      unreads,
      setAllUnreads: setUnreads,      // React setter (stable)
      incrementUnread,                // memoized
      resetUnread,                    // memoized
    }),
    [activeConversationId, unreads, incrementUnread, resetUnread]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useChatUnread = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChatUnread must be used inside ChatUnreadProvider");
  return ctx;
};
