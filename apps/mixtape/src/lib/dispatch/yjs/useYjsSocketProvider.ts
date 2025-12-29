// src/lib/dispatch/yjs/useYjsSocketProvider.ts

import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { YjsSocketAdapter } from "./YjsSocketAdapter";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

interface DispatchContentMinimal {
  id: string; // UUID for REST API calls
  yjs_document_id: string; // UUID for Socket.IO room name
}

type Status = "connecting" | "connected" | "disconnected";

/**
 * Tiny event emitter shim so TipTapCollabEditor can do:
 *   provider.on("synced", cb)
 * even if YjsSocketAdapter doesn't implement .on/.off itself.
 */
function ensureProviderEmitter(adapter: any) {
  if (!adapter) return;

  if (typeof adapter.on === "function" && typeof adapter.off === "function" && typeof adapter.emit === "function") {
    return; // already has an event API
  }

  const listeners: Record<string, Set<(...args: any[]) => void>> =
    adapter.__mt_listeners || (adapter.__mt_listeners = {});

  adapter.on = (event: string, cb: (...args: any[]) => void) => {
    if (!listeners[event]) listeners[event] = new Set();
    listeners[event].add(cb);
  };

  adapter.off = (event: string, cb: (...args: any[]) => void) => {
    listeners[event]?.delete(cb);
  };

  adapter.emit = (event: string, ...args: any[]) => {
    const set = listeners[event];
    if (!set || set.size === 0) return;
    for (const cb of Array.from(set)) {
      try {
        cb(...args);
      } catch (e) {
        console.warn("⚠️ [YjsProvider] listener threw:", event, e);
      }
    }
  };
}

export function useYjsSocketProvider(
  dispatchContent: DispatchContentMinimal | null,
  {
    user,
    enabled = true,
  }: {
    user: { name: string; color?: string };
    enabled?: boolean;
    initialContent?: any;
  }
) {
  const [status, setStatus] = useState<Status>("disconnected");
  const [provider, setProvider] = useState<YjsSocketAdapter | null>(null);
  const [ydoc, setYDoc] = useState<Y.Doc | null>(null);
  const [isReady, setIsReady] = useState(false);

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Hard reset when disabled or no IDs
    if (!enabled || !dispatchContent?.id || !dispatchContent?.yjs_document_id) {
      setStatus("disconnected");
      setIsReady(false);
      return;
    }

    const contentId = dispatchContent.id;
    const roomId = dispatchContent.yjs_document_id;

    console.log("🔧 [YjsProvider] init:", { contentId, roomId, enabled });

    let didCancel = false;

    let adapter: YjsSocketAdapter | null = null;
    let doc: Y.Doc | null = null;

    const cleanup = () => {
      if (didCancel) return;
      didCancel = true;

      try {
        adapter?.disconnect?.();
      } catch {}

      try {
        doc?.destroy();
      } catch {}

      setProvider(null);
      setYDoc(null);
      setStatus("disconnected");
      setIsReady(false);
    };

    cleanupRef.current = cleanup;

    const boot = async () => {
      setStatus("connecting");
      setIsReady(false);

      // 1) Create Y.Doc
      doc = new Y.Doc();

      // IMPORTANT: deterministic sync flag owned by this hook.
      // TipTapCollabEditor should only seed after this becomes true.
      (doc as any).__serverSynced = false;
      (doc as any).__yjsRoomId = roomId;
      (doc as any).__dispatchContentId = contentId;

      // 3) If empty, fetch content_snapshot for seeding (TipTap will seed it)
      try {
        const frag = doc.getXmlFragment("default");
        const isEmpty = frag.length === 0;

        if (isEmpty) {
          console.log("🌱 [YjsProvider] doc empty; fetching content_snapshot:", contentId);
          const contentRes = await axiosInstance.get(`/api/dispatch/content/${contentId}`);
          if (didCancel) return;

          const contentSnapshot = contentRes.data?.content_snapshot;
          if (contentSnapshot && Object.keys(contentSnapshot).length > 0) {
            (doc as any).__initialContent = contentSnapshot;
            console.log("✅ [YjsProvider] stored snapshot for seeding");
          } else {
            console.log("ℹ️ [YjsProvider] no content_snapshot found");
          }
        } else {
          console.log("✅ [YjsProvider] doc has content:", frag.length);
        }
      } catch (err) {
        console.error("⚠️ [YjsProvider] failed to fetch content_snapshot:", err);
      }

      if (didCancel) return;

      setYDoc(doc);

      // 4) Create adapter (joins socket room)
      adapter = new YjsSocketAdapter(doc, roomId, { user, contentId });

      // Ensure provider has on/off/emit for "synced" event (editor listens to this)
      ensureProviderEmitter(adapter);

      setProvider(adapter);

      // 5) Attach listeners once socket exists
      await adapter.whenReady();
      const s = adapter.socket;
      if (!s) {
        console.error("❌ [YjsProvider] adapter.socket missing (cannot sync)");
        setStatus("disconnected");
        setIsReady(false);
        return;
      }

      const recompute = () => {
        const connected = !!s.connected;
        setStatus(connected ? "connected" : "disconnected");

        // READY IS DETERMINISTIC:
        // connected + doc + provider + server has ACKed yjs-synced
        const synced = !!(doc as any).__serverSynced;
        const ready = connected && !!doc && !!adapter && synced;
        setIsReady(ready);
      };

      const onConnect = () => {
        console.log("✅ [YjsProvider] socket connected");
        recompute();
      };

      const onDisconnect = () => {
        console.log("❌ [YjsProvider] socket disconnected");
        setStatus("disconnected");
        setIsReady(false);
      };

      // 🔥 The key change: yjs-synced is the ONLY sync signal.
      const onSynced = (payload: any) => {
        const docId = payload?.documentId;
        if (docId && docId !== roomId) return;

        if (!doc) return;

        (doc as any).__serverSynced = true;

        // If adapter tracks a .synced flag, keep it aligned.
        try {
          (adapter as any).synced = true;
        } catch {}

        console.log("✅ [YjsProvider] yjs-synced (authoritative):", docId || roomId);

        // Emit provider-level event for the editor seed gate (deterministic now)
        try {
          (adapter as any).emit?.("synced", { documentId: docId || roomId });
        } catch {}

        recompute();
      };

      s.on("connect", onConnect);
      s.on("disconnect", onDisconnect);
      s.on("yjs-synced", onSynced);

      // Initial compute (will be ready=false until yjs-synced arrives)
      recompute();

      // Replace cleanup to include listener removal
      cleanupRef.current = () => {
        didCancel = true;

        try {
          s.off("connect", onConnect);
          s.off("disconnect", onDisconnect);
          s.off("yjs-synced", onSynced);
        } catch {}

        try {
          adapter?.disconnect?.();
        } catch {}

        try {
          doc?.destroy();
        } catch {}

        setProvider(null);
        setYDoc(null);
        setStatus("disconnected");
        setIsReady(false);
      };
    };

    void boot();

    return () => {
      cleanupRef.current?.();
    };
  }, [dispatchContent?.id, dispatchContent?.yjs_document_id, enabled]);

  // Update awareness when user info changes (without recreating Y.Doc)
  useEffect(() => {
    if (provider?.awareness && user) {
      provider.awareness.setLocalStateField("user", user);
    }
  }, [provider, user?.name, user?.color]);

  return {
    provider,
    ydoc,
    status,
    isReady, // now deterministic: only true after yjs-synced
  };
}
