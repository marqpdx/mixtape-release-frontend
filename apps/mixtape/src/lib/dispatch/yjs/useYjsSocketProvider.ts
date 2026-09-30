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

type EmitterListener = (...args: unknown[]) => void;
type ProviderEmitter = {
  on?: (event: string, cb: EmitterListener) => void;
  off?: (event: string, cb: EmitterListener) => void;
  emit?: (event: string, ...args: unknown[]) => void;
  __mt_listeners?: Record<string, Set<EmitterListener>>;
};
type ProviderEmitterTarget = Record<string, unknown> & ProviderEmitter;

type YDocWithMeta = Y.Doc & {
  __serverSynced?: boolean;
  __yjsRoomId?: string;
  __dispatchContentId?: string;
  __initialContent?: Record<string, unknown>;
  __forceOverwrite?: boolean;
};

type SyncPayload = { documentId?: string; canWrite?: boolean };

/**
 * Tiny event emitter shim so TipTapCollabEditor can do:
 *   provider.on("synced", cb)
 * even if YjsSocketAdapter doesn't implement .on/.off itself.
 */
function ensureProviderEmitter(adapter: object | null) {
  if (!adapter) return;
  const target = adapter as ProviderEmitterTarget;

  if (typeof target.on === "function" && typeof target.off === "function" && typeof target.emit === "function") {
    return; // already has an event API
  }

  const listeners: Record<string, Set<EmitterListener>> =
    target.__mt_listeners || (target.__mt_listeners = {});

  target.on = (event: string, cb: EmitterListener) => {
    if (!listeners[event]) listeners[event] = new Set();
    listeners[event].add(cb);
  };

  target.off = (event: string, cb: EmitterListener) => {
    listeners[event]?.delete(cb);
  };

  target.emit = (event: string, ...args: unknown[]) => {
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
    initialContent?: Record<string, unknown>;
  }
) {
  const [status, setStatus] = useState<Status>("disconnected");
  const [provider, setProvider] = useState<YjsSocketAdapter | null>(null);
  const [ydoc, setYDoc] = useState<Y.Doc | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [canWrite, setCanWrite] = useState(false);

  const cleanupRef = useRef<(() => void) | null>(null);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    // Hard reset when disabled or no IDs
    if (!enabled || !dispatchContent?.id || !dispatchContent?.yjs_document_id) {
      setStatus("disconnected");
      setIsReady(false);
      setCanWrite(false);
      return;
    }

    const contentId = dispatchContent.id;
    const roomId = dispatchContent.yjs_document_id;

    console.log("🔧 [YjsProvider] init:", { contentId, roomId, enabled });

    let didCancel = false;

    let adapter: YjsSocketAdapter | null = null;
    let doc: YDocWithMeta | null = null;

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
      setCanWrite(false);
    };

    cleanupRef.current = cleanup;

    const boot = async () => {
      setStatus("connecting");
      setIsReady(false);
      setCanWrite(false);

      // 1) Create Y.Doc
      doc = new Y.Doc() as YDocWithMeta;

      // IMPORTANT: deterministic sync flag owned by this hook.
      // TipTapCollabEditor should only seed after this becomes true.
      doc.__serverSynced = false;
      doc.__yjsRoomId = roomId;
      doc.__dispatchContentId = contentId;

      // 3) Fetch content_snapshot for seeding (TipTap will seed it)
      // Always fetch so we can detect external_update (yjs_state_updated_at === null)
      try {
        console.log("🌱 [YjsProvider] fetching content_snapshot:", contentId);
        const contentRes = await axiosInstance.get(`/api/dispatch/content/${contentId}`);
        if (didCancel) return;

        const contentSnapshot = contentRes.data?.content_snapshot as Record<string, unknown> | undefined;
        if (contentSnapshot && Object.keys(contentSnapshot).length > 0) {
          doc.__initialContent = contentSnapshot;
          console.log("✅ [YjsProvider] stored snapshot for seeding");
        } else {
          console.log("ℹ️ [YjsProvider] no content_snapshot found");
        }

        // If yjs_state was cleared by an external save (DualPanelEditor), the room's
        // in-memory state is stale. Signal TipTap to force-overwrite after sync.
        const yjsStateCleared = contentRes.data?.yjs_state_updated_at === null;
        if (yjsStateCleared && doc.__initialContent) {
          doc.__forceOverwrite = true;
          console.log("🔥 [YjsProvider] yjs_state_updated_at is null — marking __forceOverwrite");
        }
      } catch (err) {
        console.error("⚠️ [YjsProvider] failed to fetch content_snapshot:", err);
      }

      if (didCancel) return;

      setYDoc(doc);

      // 4) Create adapter (joins socket room)
      adapter = new YjsSocketAdapter(doc, roomId, { user: userRef.current, contentId });

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
        setCanWrite(false);
        return;
      }

      const recompute = () => {
        const connected = !!s.connected;
        setStatus(connected ? "connected" : "disconnected");

        // READY IS DETERMINISTIC:
        // connected + doc + provider + server has ACKed yjs-synced
        const synced = !!doc?.__serverSynced;
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
        setCanWrite(false);
      };

      // 🔥 The key change: yjs-synced is the ONLY sync signal.
      const onSynced = (payload: unknown) => {
        const docId =
          typeof payload === "string"
            ? payload
            : (payload as SyncPayload | null)?.documentId;
        if (docId && docId !== roomId) return;

        if (!doc) return;

        doc.__serverSynced = true;
        setCanWrite(typeof payload === "string" ? false : (payload as SyncPayload | null)?.canWrite === true);

        // If adapter tracks a .synced flag, keep it aligned.
        try {
          (adapter as YjsSocketAdapter & { synced?: boolean }).synced = true;
        } catch {}

        console.log("✅ [YjsProvider] yjs-synced (authoritative):", docId || roomId);

        // Emit provider-level event for the editor seed gate (deterministic now)
        const adapterEmitter = adapter as ProviderEmitter;
        adapterEmitter.emit?.("synced", { documentId: docId || roomId });

        recompute();
      };

      const onDenied = (payload: { documentId?: string; reason?: string }) => {
        if (payload.documentId !== roomId) return;
        setCanWrite(false);
        if (payload.reason === "write_denied") return;
        if (doc) doc.__serverSynced = false;
        setIsReady(false);
      };

      const onPermissions = (payload: { documentId?: string; canWrite?: boolean }) => {
        if (payload.documentId === roomId) setCanWrite(payload.canWrite === true);
      };

      s.on("connect", onConnect);
      s.on("disconnect", onDisconnect);
      s.on("yjs-synced", onSynced);
      s.on("yjs-denied", onDenied);
      s.on("yjs-permissions", onPermissions);

      // Initial compute (will be ready=false until yjs-synced arrives)
      recompute();

      // Replace cleanup to include listener removal
      cleanupRef.current = () => {
        didCancel = true;

        try {
          s.off("connect", onConnect);
          s.off("disconnect", onDisconnect);
          s.off("yjs-synced", onSynced);
          s.off("yjs-denied", onDenied);
          s.off("yjs-permissions", onPermissions);
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
        setCanWrite(false);
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
  }, [provider, user]);

  return {
    provider,
    ydoc,
    status,
    isReady, // now deterministic: only true after yjs-synced
    canWrite,
  };
}
