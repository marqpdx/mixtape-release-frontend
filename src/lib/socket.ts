// lib/socket.ts

import { getValidAccessToken } from "@providers/auth-provider/utils";
import { getLivewireAccessToken } from "@/lib/auth/wsToken";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let connecting = false;
let connectPromise: Promise<Socket | null> | null = null;

// Avoid re-registering verbose loggers over and over
let didAttachGlobalDebug = false;

type DisconnectReason =
  | "io client disconnect"
  | "io server disconnect"
  | "ping timeout"
  | "transport close"
  | "transport error"
  | "parse error";

const isProd =
  process.env.NEXT_PUBLIC_APP_ENV === "prod" ||
  process.env.DJANGO_ENV === "prod" ||
  process.env.NODE_ENV === "production";

const LIVEWIRE_URL =
  process.env.NEXT_PUBLIC_LIVEWIRE_URL ??
  (isProd ? "https://chat.crossroads.place" : "http://127.0.0.1:5001");

const CONNECT_TIMEOUT_MS = 12000;

export const initializeSocket = async (): Promise<Socket | null> => {
  // Fast path: already connected
  if (socket?.connected) return socket;

  // If a connection attempt is already in-flight, reuse it (and don’t hang forever)
  if (connectPromise) return connectPromise;

  connecting = true;

  connectPromise = new Promise<Socket | null>(async (resolve) => {
    try {
      const token = await getLivewireAccessToken();
      if (!token) {
        console.error("[socket.ts] No WS token available");
        connecting = false;
        connectPromise = null;
        resolve(null);
        return;
      }

      // If we had an old socket instance, clean it up before creating a new one
      // (Important when previous attempt got stuck / errored)
      if (socket) {
        try {
          socket.off();
          socket.disconnect();
        } catch {}
        socket = null;
      }

      console.log("[socket.ts] Creating socket.io connection to:", LIVEWIRE_URL);

      socket = io(LIVEWIRE_URL, {
        auth: { token },
        path: "/socket.io",
        ...(isProd ? { transports: ["websocket"] } : {}),
        withCredentials: false,
        reconnectionAttempts: 10,
        reconnectionDelay: 500,
      });

      // Refresh WS token before reconnect attempts
      socket.io.on("reconnect_attempt", async () => {
        const fresh = await getLivewireAccessToken();
        if (fresh && socket) {
          (socket.io as any).opts.auth = { token: fresh };
        }
      });

      // If server rejects due to expired/invalid token, grab a fresh one and retry
      socket.on("connect_error", async (err: any) => {
        const msg = String(err?.message || err || "").toLowerCase();
        console.warn("[socket.ts] connect_error:", err);

        // If auth-ish, try one refresh + reconnect
        if (msg.includes("auth") || msg.includes("jwt") || msg.includes("token")) {
          const fresh = await getLivewireAccessToken();
          if (fresh && socket) {
            (socket.io as any).opts.auth = { token: fresh };
            // socket.connect() is safe; socket.io will retry
            socket.connect();
          }
        }
      });

      socket.on("connect", () => {
        if (!socket) return;
        console.log("[socket.ts] ✅ connected:", socket.id);
        connecting = false;

        // Attach debug once per lifetime
        if (!didAttachGlobalDebug) {
          didAttachGlobalDebug = true;
          socket.onAny((eventName, ...args) => {
            console.log(`[socket] 📡 Event received: ${eventName}`, args);
          });
        }
      });

      socket.on("disconnect", (reason: DisconnectReason) => {
        console.warn("[socket.ts] ⚠️ disconnected. reason:", reason);
        connecting = false;

        // Don’t auto-reconnect if user explicitly disconnected
        if (reason === "io client disconnect") return;

        // Socket.IO has its own reconnection logic; don’t recursively call initializeSocket()
        // If you *want* to force a fresh instance on certain errors, do it carefully:
        // - but only if there isn't already a connectPromise in flight.
      });

      // Resolve when connected OR after a timeout (so callers never hang)
      const timeout = setTimeout(() => {
        console.error("[socket.ts] ❌ connect timeout");
        connecting = false;
        // do not kill socket here; let socket.io keep retrying if it wants
        connectPromise = null;
        resolve(socket?.connected ? socket : null);
      }, CONNECT_TIMEOUT_MS);

      socket.once("connect", () => {
        clearTimeout(timeout);
        connecting = false;
        const s = socket;
        connectPromise = null;
        resolve(s);
      });

      socket.once("connect_error", () => {
        clearTimeout(timeout);
        connecting = false;
        // Let future calls try again
        connectPromise = null;
        resolve(null);
      });
    } catch (e) {
      console.error("[socket.ts] initializeSocket failed:", e);
      connecting = false;
      connectPromise = null;
      resolve(null);
    }
  });

  return connectPromise;
};

export const refreshSocketAuth = async (): Promise<void> => {
  // NOTE: if your WS token is NOT the same as access token,
  // you probably want getLivewireAccessToken() here too.
  const token = await getValidAccessToken();
  if (!token) return;

  if (socket) {
    // update auth payload for next connection attempt
    (socket as any).auth = { token };
    if (!socket.connected) socket.connect();
  } else {
    await initializeSocket();
  }
};

export const closeSocket = () => {
  if (socket) {
    console.log("[socket.ts] 🔌 closing (logout)");
    socket.disconnect(); // user-initiated close
    socket = null;
  }
  connecting = false;
  connectPromise = null;
  didAttachGlobalDebug = false;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("[socket.ts] 🔌 disconnecting:", socket.id);
    socket.disconnect();
    socket = null;
  }
  connecting = false;
  connectPromise = null;
  didAttachGlobalDebug = false;
};

export const getSocket = (): Socket | null => {
  if (process.env.NODE_ENV === "development") {
    console.log("[socket.ts] getSocket() returning:", {
      hasSocket: !!socket,
      socketId: socket?.id,
      isConnected: socket?.connected,
      connecting,
    });
  }
  return socket;
};
