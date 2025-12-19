// src/lib/dispatch/yjs/useYjsSocketProvider.ts

// Primary socket provider for yjs collaborative editing
// Uses shared socket connection for efficiency

import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { YjsSocketAdapter } from "./YjsSocketAdapter";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";

interface DispatchContentMinimal {
  id: string;  // UUID for REST API calls
  yjs_document_id: string;  // UUID for Socket.IO room name
}

export function useYjsSocketProvider(
  dispatchContent: DispatchContentMinimal | null,
  {
    user,
    enabled = true,
    initialContent,
  }: {
    user: { name: string; color?: string };
    enabled?: boolean;
    initialContent?: any; // TipTap JSON content to initialize Y.Doc if empty
  }
) {
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [provider, setProvider] = useState<YjsSocketAdapter | null>(null);
  const [ydoc, setYDoc] = useState<Y.Doc | null>(null);
  const [isReady, setIsReady] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !dispatchContent?.id || !dispatchContent?.yjs_document_id) {
      setStatus("disconnected");
      setIsReady(false);
      return;
    }

    console.log(" 🔧 [YjsProvider] Effect running - document:", dispatchContent.yjs_document_id);
    console.log(" 🔧 [YjsProvider] Effect deps:", {
      contentId: dispatchContent.id,
      yjsDocId: dispatchContent.yjs_document_id,
      enabled,
      userName: user?.name,
      userColor: user?.color,
    });

    const initializeYjsDocument = async () => {
      // Create Y.js document
      const doc = new Y.Doc();
      console.log(" 📄 [YjsProvider] Created Y.Doc:", doc);

      // Load saved yjs state from backend using DispatchContent.id
      try {
        console.log(" 📥 [YjsProvider] Fetching saved yjs state...");
        const res = await axiosInstance.get(`/api/dispatch/content/${dispatchContent.id}/yjs-state`);

        if (res.data.yjs_state) {
          // Decode base64 state
          const base64State = res.data.yjs_state;
          const binaryString = atob(base64State);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Apply saved state to the document
          Y.applyUpdate(doc, bytes);
          console.log(" ✅ [YjsProvider] Applied saved yjs state to document");
        } else {
          console.log(" ℹ️ [YjsProvider] No saved state found, starting fresh");
        }
      } catch (err) {
        console.error(" ⚠️ [YjsProvider] Failed to load saved state, starting fresh:", err);
      }

      // Check if Y.Doc is empty - if so, we need to seed it from backend content_snapshot
      const fragment = doc.getXmlFragment('default');
      const isEmpty = fragment.length === 0;

      if (isEmpty) {
        console.log(" 🔧 [YjsProvider] Y.Doc is empty, fetching content_snapshot to seed...");
        try {
          // Fetch content_snapshot from backend
          const contentRes = await axiosInstance.get(`/api/dispatch/content/${dispatchContent.id}`);
          const contentSnapshot = contentRes.data.content_snapshot;

          if (contentSnapshot && Object.keys(contentSnapshot).length > 0) {
            console.log(" 🌱 [YjsProvider] Found content_snapshot for seeding");
            // Store snapshot and ID for TipTap to seed and save back
            (doc as any).__initialContent = contentSnapshot;
            (doc as any).__dispatchContentId = dispatchContent.id;
          } else {
            console.log(" ℹ️ [YjsProvider] No content_snapshot found, starting with empty doc");
          }
        } catch (err) {
          console.error(" ⚠️ [YjsProvider] Failed to fetch content_snapshot:", err);
        }
      } else {
        console.log(" ✅ [YjsProvider] Y.Doc fragment has content:", fragment.length, "children");
      }

      // Don't create the text type here - let TipTap handle it
      setYDoc(doc);

      // Create adapter using yjs_document_id for Socket.IO room name
      const adapter = new YjsSocketAdapter(doc, dispatchContent.yjs_document_id, { user });
      console.log(" 🔌 [YjsProvider] Created adapter:", adapter);

      setProvider(adapter);

      return { doc, adapter };
    };

    let adapter: YjsSocketAdapter | null = null;
    let doc: Y.Doc | null = null;

    const setupPromise = initializeYjsDocument();

    setupPromise.then((result) => {
      if (!result) return;

      adapter = result.adapter;
      doc = result.doc;

      const recomputeReady = () => {
        const connected = !!adapter?.socket?.connected;
        const ready = connected && !!doc && !!adapter && !!adapter.synced;
        setStatus(connected ? "connected" : "disconnected");
        setIsReady(ready);
        return ready;
      };

      // Initial compute
      recomputeReady();

      // Attach listeners once socket exists
      const attach = () => {
        if (!adapter?.socket) return false;

        const s = adapter.socket;

        const onConnect = () => {
          console.log(" ✅ [YjsProvider] Socket connected");
          recomputeReady();
        };

        const onDisconnect = () => {
          console.log(" ❌ [YjsProvider] Socket disconnected");
          setStatus("disconnected");
          setIsReady(false);
        };

        const onSynced = (payload: any) => {
          const docId = payload?.documentId;
          if (docId && docId !== dispatchContent.yjs_document_id) return;

          console.log(" ✅ [YjsProvider] yjs-synced received for:", docId);

          // Force ready if socket is connected and doc exists.
          const connected = !!adapter?.socket?.connected;
          if (connected && doc) {
            setStatus("connected");
            setIsReady(true);
          } else {
            recomputeReady();
          }
        };

        s.on("connect", onConnect);
        s.on("disconnect", onDisconnect);
        s.on("yjs-synced", onSynced);

        // Optional: if server sends documentId, filter here to be extra safe
        // s.on("yjs-synced", ({ documentId }) => { if (documentId === dispatchContent.yjs_document_id) onSynced(); });

        // Store cleanup that removes listeners (important on shared sockets)
        const prevCleanup = cleanupRef.current;
        cleanupRef.current = () => {
          try {
            s.off("connect", onConnect);
            s.off("disconnect", onDisconnect);
            s.off("yjs-synced", onSynced);
          } catch {}
          prevCleanup?.();
        };

        // One more compute after attaching
        recomputeReady();
        return true;
      };

      // Attach now or soon
      if (!attach()) {
        const t = setInterval(() => {
          if (attach()) clearInterval(t);
        }, 50);
        setTimeout(() => clearInterval(t), 10000);
      }
    });


    const cleanup = () => {
      console.log(" 🧹 [YjsProvider] Cleaning up...");
      console.warn(" ⚠️ [YjsProvider] Y.Doc being destroyed - this will lose unsaved changes!");
      console.log(" 🧹 [YjsProvider] Document ID:", dispatchContent.yjs_document_id);
      console.trace(" 🧹 [YjsProvider] Cleanup stack trace:");
      if (adapter) {
        adapter.disconnect?.();
      }
      if (doc) {
        doc.destroy();
      }
      setProvider(null);
      setYDoc(null);
      setStatus("disconnected");
      setIsReady(false);
    };

    cleanupRef.current = cleanup;

    return cleanup;
  }, [
    dispatchContent?.id,
    dispatchContent?.yjs_document_id,
    enabled,
    // REMOVED user?.name and user?.color - should NOT recreate Y.Doc when user info changes
    // User info is only used for awareness, which can update without recreating everything
  ]);

  // Update awareness when user info changes (without recreating Y.Doc)
  useEffect(() => {
    if (provider?.awareness && user) {
      console.log(" 👤 [YjsProvider] Updating awareness with user info:", user);
      provider.awareness.setLocalStateField("user", user);
    }
  }, [provider, user?.name, user?.color]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    provider,
    ydoc,
    status,
    isReady, // Flag to indicate everything is properly initialized
  };
}
