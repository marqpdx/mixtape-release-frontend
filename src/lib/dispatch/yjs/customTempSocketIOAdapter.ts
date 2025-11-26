// src/lib/dispatch/yjs/customTempSocketIOAdapter.ts

import * as Y from "yjs";
import { Socket } from "socket.io-client";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness";
import { initializeSocket } from "@/lib/socket";

export class customTempSocketIOAdapter {
  public doc: Y.Doc;
  public roomName: string;
  public user: any;
  public socket: Socket | undefined;
  public awareness: Awareness;
  private _synced = false;
  private _connected = false;

  constructor(doc: Y.Doc, roomName: string, options: { user: any }) {
    this.doc = doc;
    this.roomName = roomName;
    this.user = options.user;
    this.awareness = new Awareness(this.doc);
    this.awareness.setLocalStateField("user", options.user);

    // Ensure the document is ready for TipTap
    this.initializeDocument();

    // Set up Y.js document listeners
    this.setupYjsListeners();

    this.setupSocket().catch((err) => {
      console.error("❌ Failed to setup socket connection in adapter:", err);
    });
  }

  private initializeDocument() {
    // Ensure the document has the fragment that TipTap expects
    // TipTap uses getXmlFragment('default') for ProseMirror integration
    const fragment = this.doc.getXmlFragment('default');
    console.log("📄 [Adapter] Initialized document fragment:", fragment);
  }

  private setupYjsListeners() {
    // Listen for local document updates and broadcast them
    this.doc.on('update', (update: Uint8Array, origin: any) => {
      // Don't broadcast updates that came from the socket (to avoid loops)
      if (origin !== this && this.socket?.connected) {
        console.log("📤 Broadcasting Y.js update to document:", this.roomName);
        this.socket.emit("yjs-update", {
          documentId: this.roomName,
          update: Array.from(update) // Convert Uint8Array to regular array for JSON transport
        });
      }
    });

    // Listen for awareness updates
    this.awareness.on('update', ({ added, updated, removed }: any) => {
      if (this.socket?.connected) {
        console.log("📤 Broadcasting awareness update");
        const update = encodeAwarenessUpdate(this.awareness, [...added, ...updated, ...removed]);
        this.socket.emit("yjs-awareness", {
          documentId: this.roomName,
          update: Array.from(update) // Convert Uint8Array to regular array for JSON transport
        });
      }
    });
  }

  async setupSocket() {
    const socket = await initializeSocket();
    if (!socket) throw new Error("Unable to initialize shared socket");

    this.socket = socket;

    // Set up event listeners
    this.setupSocketListeners();

    // Join the document room
    this.joinDocumentRoom();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // Debug logging for all socket events
    this.socket.onAny((eventName, ...args) => {
      console.log(`🎧  Client received socket event: ${eventName}`, args);
    });

    // Also log what we're sending
    const originalEmit = this.socket.emit.bind(this.socket);
    this.socket.emit = function(eventName, ...args) {
      console.log(`📤 Client  sending socket event: ${eventName}`, args);
      return originalEmit(eventName, ...args);
    };

    // Listen for Y.js updates from other clients
    this.socket.on("yjs-update", (update: number[]) => {
      console.log("📥 Received Y.js update from server");
      const updateArray = new Uint8Array(update);
      // Apply update with 'this' as origin to prevent broadcast loop
      Y.applyUpdate(this.doc, updateArray, this);
    });

    // Listen for awareness updates from other clients
    this.socket.on("yjs-awareness", (update: number[]) => {
      console.log("📥 Received awareness update from server");
      // Apply awareness changes
      const awarenessUpdate = new Uint8Array(update);
      applyAwarenessUpdate(this.awareness, awarenessUpdate, this);
    });

    // Handle reconnections gracefully
    this.socket.on('connect', () => {
      console.log("✅ Y.js adapter: Socket reconnected, rejoining document:", this.roomName);
      this._connected = true;
      this.joinDocumentRoom();
    });

    this.socket.on('disconnect', () => {
      console.log("❌ Y.js adapter: Socket disconnected");
      this._connected = false;
      this._synced = false;
    });
  }

  private joinDocumentRoom() {
    if (!this.socket?.connected) return;

    // Join the document room using server's expected event
    this.socket.emit("yjs-init", this.roomName);
    console.log("🧩 Initialized YJS for document:", this.roomName);
    this._connected = true;
  }

  // Getter for sync status (TipTap might check this)
  get synced(): boolean {
    return this._synced && this.socket?.connected === true;
  }

  // Method to check if provider is connected
  get connected(): boolean {
    return this._connected && this.socket?.connected === true;
  }

  disconnect() {
    if (this.socket) {
      // Clean disconnect - no SOCKET_EVENTS needed
      this.socket.off(); // Remove all listeners
      this.socket = undefined;
    }

    // Clean up Y.js resources
    this.awareness.destroy();
    this.doc?.destroy();
    this._synced = false;
    this._connected = false;
  }

  // Additional methods that TipTap collaboration might expect
  destroy() {
    this.disconnect();
  }
}