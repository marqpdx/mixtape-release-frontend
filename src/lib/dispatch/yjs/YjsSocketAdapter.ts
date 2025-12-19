// src/lib/dispatch/yjs/YjsSocketAdapter.ts

import * as Y from "yjs";
import { Socket } from "socket.io-client";
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from "y-protocols/awareness";
import { initializeSocket } from "@/lib/socket";

type UpdatePayload =
  | number[]
  | Uint8Array
  | { documentId: string; update: number[] | Uint8Array };

export class YjsSocketAdapter {
  public doc: Y.Doc;
  public roomName: string;
  public user: any;
  public socket: Socket | undefined;
  public awareness: Awareness;

  private _synced = false;
  private _connected = false;
  private _joined = false;
  private _awarenessUpdateTimeout: NodeJS.Timeout | null = null;

  private _handleYjsUpdate = (payload: any) => {
    // delegate to the typed version
    this._onYjsUpdate(payload as UpdatePayload);
  };

  private _onYjsUpdate = (payload: UpdatePayload) => {
    const { documentId, updateArray } = this.normalizePayload(payload);

    // Ignore updates for other docs (critical when multiple docs open)
    if (documentId && documentId !== this.roomName) return;

    const fragmentBefore = this.doc.getXmlFragment("default").length;

    if (updateArray.length <= 2 && fragmentBefore > 0) {
      console.log("⚠️ [YjsAdapter] Ignoring tiny update (likely empty state) because we have content");
      return;
    }

    Y.applyUpdate(this.doc, updateArray, this);

    // Optional but recommended: first applied state implies "synced enough"
    // (especially if you rely on this for UI readiness)
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
    // If it doesn't, we fall back to trusting it's for this adapter.
    if (documentId && documentId !== this.roomName) return;

    this._synced = true;
    console.log("✅ [YjsAdapter] Sync confirmed by server:", this.roomName);
  };

  private _onConnect = () => {
    this._connected = true;
    this._synced = false;
    this._joined = false;
    console.log("✅ [YjsAdapter] Socket connected; will join:", this.roomName);
    this.scheduleJoinWithGrace();
  };

  private _onDisconnect = () => {
    console.log("❌ [YjsAdapter] Socket disconnected");
    this._connected = false;
    this._synced = false;
    this._joined = false;
  };

  constructor(doc: Y.Doc, roomName: string, options: { user: any }) {
    this.doc = doc;
    this.roomName = roomName;
    this.user = options.user;

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
    this.doc.on("update", (update: Uint8Array, origin: any) => {
      if (origin === this) return; // avoid loop

      if (!this.socket?.connected) {
        console.log("⏸️  [YjsAdapter] Update occurred before socket connected", {
          updateSize: update.length,
        });
        return;
      }

      this.socket.emit("yjs-update", {
        documentId: this.roomName,
        update: Array.from(update),
      });
    });

    // Awareness updates -> emit (throttled)
    this.awareness.on("update", ({ added, updated, removed }: any) => {
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
    this.socket.on("yjs-update", this._handleYjsUpdate as any);
    this.socket.on("yjs-awareness", this._onAwareness as any);
    this.socket.on("yjs-synced", this._onSynced as any);
    this.socket.on("connect", this._onConnect);
    this.socket.on("disconnect", this._onDisconnect);

    // If already connected when we attach, run connect handler manually
    if (this.socket.connected) {
      this._onConnect();
    }
  }

  private scheduleJoinWithGrace() {
    if (!this.socket?.connected) return;

    const fragmentLengthNow = this.doc.getXmlFragment("default").length;

    const doJoin = () => {
      console.log("🧩 [YjsAdapter] Join decision", {
        fragmentLength: this.doc.getXmlFragment("default").length,
        connected: this.socket?.connected,
        joined: this._joined,
      });
      this.ensureJoined();
    };

    if (fragmentLengthNow > 0) doJoin();
    else setTimeout(doJoin, 200);
  }

  private ensureJoined() {
    if (!this.socket?.connected) return;
    if (this._joined) return;
    this.socket.emit("yjs-init", this.roomName);
    this._joined = true;
    console.log("🧩 [YjsAdapter] yjs-init emitted:", this.roomName);
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

    if (this.socket) {
      // ✅ Detach only our listeners
      // this.socket.off("yjs-update", this._onYjsUpdate as any);
      this.socket.off("yjs-update", this._handleYjsUpdate as any);

      this.socket.off("yjs-awareness", this._onAwareness as any);
      this.socket.off("yjs-synced", this._onSynced as any);
      this.socket.off("connect", this._onConnect);
      this.socket.off("disconnect", this._onDisconnect);
    }

    this.awareness.destroy();

    this._synced = false;
    this._connected = false;
    this._joined = false;
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
}
