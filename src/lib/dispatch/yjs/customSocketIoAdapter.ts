// src/lib/dispatch/yjs/customSocketIoAdapter.ts

import { Doc } from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { encodeStateAsUpdate, applyUpdate } from 'yjs';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'lib0/observable';
import { getValidAccessToken } from "@providers/auth-provider/utils";

interface AdapterOptions {
  documentId: string;
  user: {
    name: string;
    color: string;
  };
}

export class CustomSocketIOAdapter extends Observable<string> {
  public socket!: Socket;
  public awareness!: Awareness;
  public doc: Doc;
  public options: AdapterOptions;
  private isInitialized = false;

  constructor(doc: Doc, options: AdapterOptions) {
    super();
    this.doc = doc;
    this.options = options;
  }

  async initialize() {
    console.log("🛠️ YJS: CustomSocketIOAdapter.initialize() called for document:", this.options.documentId);

    const { documentId, user } = this.options;
    const token = await getValidAccessToken();

    this.socket = io("http://localhost:5001", {
      transports: ["websocket"],
      path: "/socket.io",
      withCredentials: true,
      auth: {
        token,
      },
    });

    // Set up awareness first
    this.awareness = new Awareness(this.doc);
    this.awareness.setLocalStateField("user", user);

    // Socket event handlers
    this.socket.on("connect", () => {
      console.log("🔌 YJS: Socket connected for document:", documentId);

      // Join both rooms
      this.socket.emit("author:join", documentId);
      this.socket.emit("yjs-init", documentId);
    });

    this.socket.on("connect_error", (err) => {
      console.error("❌ YJS: Socket connection error:", err.message, err);
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("⚠️ YJS: Socket disconnected:", reason);
      this.isInitialized = false;
    });

    // Handle server confirming sync is ready
    this.socket.on("synced", () => {
      console.log("🔄 YJS: Server confirmed sync ready for document:", documentId);
      if (!this.isInitialized) {
        this.isInitialized = true;
        this.emit("synced", [true]);
      }
    });

    // YJS document sync handlers
    this.socket.on("yjs-update", (update: Uint8Array) => {
      console.log("📥 YJS: Received update from server:", update.length, "bytes");
      try {
        applyUpdate(this.doc, new Uint8Array(update));
        console.log("✅ YJS: Applied update to local document");
      } catch (error) {
        console.error("❌ YJS: Error applying update:", error);
      }
    });

    this.doc.on("update", (update: Uint8Array) => {
      if (this.socket.connected) {
        console.log("📤 YJS: Sending update to server:", update.length, "bytes");
        this.socket.emit("yjs-update", {
          documentId,
          update: Array.from(update), // Convert to array for JSON serialization
        });
      }
    });

    // Awareness handlers
    this.socket.on("yjs-awareness", (update: Uint8Array) => {
      console.log("👀 YJS: Received awareness update from server");
      try {
        applyAwarenessUpdate(this.awareness, new Uint8Array(update), this);
      } catch (error) {
        console.error("❌ YJS: Error applying awareness update:", error);
      }
    });

    this.awareness.on("update", ({
      added,
      updated,
      removed,
    }: {
      added: number[];
      updated: number[];
      removed: number[];
    }) => {
      if (this.socket.connected) {
        const changedClients = added.concat(updated, removed);
        const awarenessUpdate = encodeAwarenessUpdate(this.awareness, changedClients);

        console.log("📤 YJS: Sending awareness update to server");
        this.socket.emit("yjs-awareness", {
          documentId,
          update: Array.from(awarenessUpdate), // Convert to array for JSON serialization
        });
      }
    });

    // Connect the socket
    this.socket.connect();

    // Handle case where socket connects immediately
    if (this.socket.connected) {
      console.log("🔌 YJS: Socket was already connected (immediate)");
      this.socket.emit("author:join", documentId);
      this.socket.emit("yjs-init", documentId);
    }

    console.log("📡 YJS: Socket initialized, connected:", this.socket.connected);
  }

  disconnect() {
    console.log("🧹 YJS: Disconnecting adapter");
    this.isInitialized = false;
    this.socket?.disconnect();
    this.awareness?.destroy();
  }
}

