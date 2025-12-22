// src/lib/dispatch/yjs/useYjsSocketProvider.ts

import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { YjsSocketAdapter } from "./YjsSocketAdapter";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";

interface DispatchContentMinimal {
  id: string; // UUID for REST API calls
  yjs_document_id: string; // UUID for Socket.IO room name
}

type Status = "connecting" | "connected" | "disconnected";

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
        if (adapter) adapter.disconnect?.();
      } catch {}

      try {
        if (doc) doc.destroy();
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

      // // 2) Load saved yjs_state from backend
      // try {
      //   console.log("📥 [YjsProvider] fetching yjs_state:", contentId);
      //   const res = await axiosInstance.get(`/api/dispatch/content/${contentId}/yjs-state`);
      //   if (didCancel) return;

      //   if (res.data?.yjs_state) {
      //     const base64State: string = res.data.yjs_state;

      //     // base64 -> Uint8Array
      //     const binaryString = atob(base64State);
      //     const bytes = new Uint8Array(binaryString.length);
      //     for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

      //     Y.applyUpdate(doc, bytes);
      //     console.log("✅ [YjsProvider] applied yjs_state");
      //   } else {
      //     console.log("ℹ️ [YjsProvider] no yjs_state found");
      //   }
      // } catch (err) {
      //   console.error("⚠️ [YjsProvider] failed to load yjs_state:", err);
      // }

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
            (doc as any).__dispatchContentId = contentId;
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

        // ready means: connected + have doc + have provider + (synced OR fallback fired)
        const ready = connected && !!doc && !!adapter && !!adapter.synced;
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

      const onSynced = (payload: any) => {
        const docId = payload?.documentId;
        if (docId && docId !== roomId) return;

        console.log("✅ [YjsProvider] yjs-synced:", docId || roomId);

        // trust adapter.synced if it flips, but also force ready if connected
        if (s.connected) {
          setStatus("connected");
          setIsReady(true);
        } else {
          recompute();
        }
      };

      s.on("connect", onConnect);
      s.on("disconnect", onDisconnect);
      s.on("yjs-synced", onSynced);

      // Initial compute
      recompute();

      // 6) Fallback: if we’re connected but missed yjs-synced, don’t deadlock editing forever.
      const fallbackTimer = setTimeout(() => {
        if (didCancel) return;
        const connected = !!s.connected;
        if (connected && doc) {
          console.warn("⚠️ [YjsProvider] no yjs-synced seen; falling back to ready=true");
          setStatus("connected");
          setIsReady(true);
        }
      }, 2000);

      // Replace cleanup to include listener removal
      cleanupRef.current = () => {
        didCancel = true;
        clearTimeout(fallbackTimer);

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

    boot();

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
    isReady,
  };
}
