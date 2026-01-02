// src/lib/dispatch/yjs/YjsSocketAdapter.ts

import * as Y from "yjs";
import { Socket } from "socket.io-client";
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from "y-protocols/awareness";
import { initializeSocket } from "@mixtape/api/lib/socket";

type UpdatePayload =
  | number[]
  | Uint8Array
  | { documentId: string; update: number[] | Uint8Array };

type AwarenessUser = Record<string, unknown>;

export class YjsSocketAdapter {
  public doc: Y.Doc;
  public roomName: string;
  public user: AwarenessUser;
  public socket: Socket | undefined;
  public awareness: Awareness;

  private contentId?: string;

  private _readyResolve?: () => void;
  private _readyPromise: Promise<void> = new Promise((res) => (this._readyResolve = res));

  private _synced = false;
  private _connected = false;

  /**
   * IMPORTANT:
   * - _joined should mean "server has acknowledged and we've joined the doc flow"
   *   (i.e. we received yjs-synced for this document).
   * - _joinInFlight prevents repeated yjs-init spam.
   */
  private _joined = false;
  private _joinInFlight = false;

  /** Queue outbound local updates until we are joined (server acked). */
  private _outbox: Uint8Array[] = [];

  private _awarenessUpdateTimeout: NodeJS.Timeout | null = null;

  private _handleYjsUpdate = (payload: UpdatePayload) => {
    this._onYjsUpdate(payload as UpdatePayload);
  };

  private _onYjsUpdate = (payload: UpdatePayload) => {
    const { documentId, updateArray } = this.normalizePayload(payload);

    // Ignore updates for other docs (critical when multiple docs open)
    if (documentId && documentId !== this.roomName) return;

    Y.applyUpdate(this.doc, updateArray, this);

    // We’ve applied at least one state/update, so UI can consider this “synced enough”
    if (!this._synced) this._synced = true;
  };

  private _onAwareness = (payload: UpdatePayload) => {
    const { documentId, updateArray } = this.normalizePayload(payload);
    if (documentId && documentId !== this.roomName) return;
    applyAwarenessUpdate(this.awareness, updateArray, this);
  };

  private _onSynced = (payload?: { documentId?: string } | string) => {
    const documentId =
      typeof payload === "string" ? payload : payload?.documentId;

    // If server includes docId, filter.
    if (documentId && documentId !== this.roomName) return;

    // This is the key: joined === server acknowledged doc init
    this._synced = true;
    this._joined = true;
    this._joinInFlight = false;

    console.log("✅ [YjsAdapter] Sync confirmed by server:", {
      documentId: this.roomName,
      socketId: this.socket?.id,
      outboxCount: this._outbox.length,
    });

    // Flush buffered updates now that server acks join
    if (this.socket?.connected && this._outbox.length) {
      for (const u of this._outbox) {
        this.socket.emit("yjs-update", {
          documentId: this.roomName,
          update: Array.from(u),
        });
      }
      this._outbox = [];
    }
  };

  private _onConnect = () => {
    this._connected = true;
    this._synced = false;

    // Reset join state; reconnect requires re-init.
    this._joined = false;
    this._joinInFlight = false;

    console.log("✅ [YjsAdapter] Socket connected; ensure join:", {
      documentId: this.roomName,
      socketId: this.socket?.id,
      hasContentId: !!this.contentId,
    });

    // Deterministic join (no fragment heuristics)
    this.ensureJoined();
  };

  private _onDisconnect = () => {
    console.log("❌ [YjsAdapter] Socket disconnected", {
      documentId: this.roomName,
      socketId: this.socket?.id,
    });

    this._connected = false;
    this._synced = false;
    this._joined = false;
    this._joinInFlight = false;
    // NOTE: keep outbox — user may type during reconnect; we’ll flush after next yjs-synced.
  };

  constructor(
    doc: Y.Doc,
    roomName: string,
    options: { user: AwarenessUser; contentId?: string }
  ) {
    this.doc = doc;
    this.roomName = roomName;
    this.user = options.user;
    this.contentId = options.contentId;

    this.awareness = new Awareness(this.doc);
    this.awareness.setLocalStateField("user", options.user);

    // Ensure fragment exists
    this.doc.getXmlFragment("default");

    this.setupYjsListeners();

    this.setupSocket().catch((err) => {
      console.error("❌ [YjsAdapter] Failed to setup socket:", err);
    });
  }

  private setupYjsListeners() {
    // Local doc updates -> emit to server
    this.doc.on("update", (update: Uint8Array, origin: unknown) => {
      if (origin === this) return; // avoid loopback

      // Additional diagnostic log (recommended)
      console.log("✉️ [YjsAdapter] local update", {
        documentId: this.roomName,
        joined: this._joined,
        joinInFlight: this._joinInFlight,
        connected: this.socket?.connected === true,
        bytes: update.length,
      });

      if (!this.socket?.connected) {
        console.log("⏸️ [YjsAdapter] Update occurred before socket connected", {
          documentId: this.roomName,
          updateSize: update.length,
        });
        // We could queue here too, but without a socket there’s no guarantee of continuity.
        // Keeping the log is still valuable.
        return;
      }

      if (!this._joined) {
        // Critical: DO NOT DROP — queue and ensure join is in progress
        this._outbox.push(update);
        console.log("📥 [YjsAdapter] Queued update until joined", {
          documentId: this.roomName,
          queued: this._outbox.length,
          bytes: update.length,
        });
        this.ensureJoined();
        return;
      }

      this.socket.emit("yjs-update", {
        documentId: this.roomName,
        update: Array.from(update),
      });
    });

    // Awareness updates -> emit (throttled)
    this.awareness.on("update", ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      if (!this.socket?.connected) return;

      if (this._awarenessUpdateTimeout) clearTimeout(this._awarenessUpdateTimeout);

      this._awarenessUpdateTimeout = setTimeout(() => {
        const update = encodeAwarenessUpdate(this.awareness, [
          ...added,
          ...updated,
          ...removed,
        ]);

        this.socket!.emit("yjs-awareness", {
          documentId: this.roomName,
          update: Array.from(update),
        });

        this._awarenessUpdateTimeout = null;
      }, 500);
    });
  }

  async setupSocket() {
    const socket = await initializeSocket();
    if (!socket) throw new Error("Unable to initialize shared socket");

    this.socket = socket;

    // Attach ONLY our listeners (shared socket safe)
    this.socket.on("yjs-update", this._handleYjsUpdate);
    this.socket.on("yjs-awareness", this._onAwareness);
    this.socket.on("yjs-synced", this._onSynced);
    this.socket.on("connect", this._onConnect);
    this.socket.on("disconnect", this._onDisconnect);

    this._readyResolve?.();

    if (this.socket.connected) {
      this._onConnect();
    }
  }

  private ensureJoined() {
    if (!this.socket?.connected) return;
    if (this._joined) return;
    if (this._joinInFlight) return;

    this._joinInFlight = true;

    if (!this.contentId) {
      console.warn(
        "⚠️ [YjsAdapter] Missing contentId; joining without persistence mapping",
        { documentId: this.roomName }
      );
      this.socket.emit("yjs-init", this.roomName);
    } else {
      this.socket.emit("yjs-init", {
        documentId: this.roomName,
        contentId: this.contentId,
      });
    }

    console.log("🧩 [YjsAdapter] yjs-init emitted:", {
      documentId: this.roomName,
      socketId: this.socket?.id,
      hasContentId: !!this.contentId,
    });

    // NOTE: we do NOT set _joined=true here anymore.
    // _joined flips only after yjs-synced ack from server.
  }

  get synced(): boolean {
    return this._synced && this.socket?.connected === true;
  }

  get connected(): boolean {
    return this._connected && this.socket?.connected === true;
  }

  disconnect() {
    if (this._awarenessUpdateTimeout) {
      clearTimeout(this._awarenessUpdateTimeout);
      this._awarenessUpdateTimeout = null;
    }

    // Tell server we're leaving this document room
    if (this.socket && this._joined && this.socket.connected) {
      console.log("🚪 [YjsAdapter] Leaving room:", {
        documentId: this.roomName,
        socketId: this.socket.id,
      });
      this.socket.emit("yjs-leave", { documentId: this.roomName });
    }

    if (this.socket) {
      // Detach only our listeners
      this.socket.off("yjs-update", this._handleYjsUpdate);
      this.socket.off("yjs-awareness", this._onAwareness);
      this.socket.off("yjs-synced", this._onSynced);
      this.socket.off("connect", this._onConnect);
      this.socket.off("disconnect", this._onDisconnect);
    }

    this.awareness.destroy();

    this._synced = false;
    this._connected = false;
    this._joined = false;
    this._joinInFlight = false;

    // Optional: clear outbox on explicit disconnect so we don’t send stale edits later
    this._outbox = [];
  }

  destroy() {
    this.disconnect();
  }

  private normalizePayload(
    payload: UpdatePayload
  ): { documentId?: string; updateArray: Uint8Array } {
    // New shape: { documentId, update }
    if (payload && typeof payload === "object" && "update" in payload) {
      const p = payload as { documentId: string; update: number[] | Uint8Array };
      const updateArray =
        p.update instanceof Uint8Array ? p.update : new Uint8Array(p.update);
      return { documentId: p.documentId, updateArray };
    }

    // Legacy: number[] or Uint8Array
    if (payload instanceof Uint8Array) return { updateArray: payload };
    return { updateArray: new Uint8Array(payload as number[]) };
  }

  public whenReady(): Promise<void> {
    return this._readyPromise;
  }
}
