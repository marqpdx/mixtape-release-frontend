// packages/api/src/lib/socket.ts

import { getLivewireAccessToken } from "@mixtape/auth/wsToken";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
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

function teardownSocket() {
  if (!socket) return;
  try {
    socket.off();
    socket.disconnect();
  } catch {}
  socket = null;
  didAttachGlobalDebug = false;
}

async function getFreshWsToken(): Promise<string | null> {
  try {
    const token = await getLivewireAccessToken();
    return token || null;
  } catch (e) {
    console.error("[socket.ts] getLivewireAccessToken() failed:", e);
    return null;
  }
}

export const initializeSocket = async (): Promise<Socket | null> => {
  // Return existing connected socket
  if (socket?.connected) return socket;

  // Return existing connection attempt
  if (connectPromise) return connectPromise;

  // If socket exists but is disconnected, let it reconnect automatically
  // Don't tear it down unless it's permanently dead
  if (socket && !socket.connected) {
    console.log("[socket.ts] Socket exists but disconnected, attempting reconnect...");
    socket.connect();
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(socket?.connected ? socket : null);
      }, CONNECT_TIMEOUT_MS);

      socket!.once("connect", () => {
        clearTimeout(timeout);
        resolve(socket);
      });

      socket!.once("connect_error", () => {
        clearTimeout(timeout);
        // Only NOW tear down the dead socket
        console.log("[socket.ts] Reconnect failed, creating fresh socket");
        teardownSocket();
        // Retry with new socket
        resolve(initializeSocket());
      });
    });
  }

  connectPromise = new Promise<Socket | null>(async (resolve) => {
    const token = await getFreshWsToken();
    if (!token) {
      console.error("[socket.ts] No WS token available");
      connectPromise = null;
      resolve(null);
      return;
    }

    // Only tear down if creating a truly new socket
    if (socket) {
      console.log("[socket.ts] Cleaning up old socket before creating new one");
      teardownSocket();
    }

    console.log("[socket.ts] Creating socket.io connection to:", LIVEWIRE_URL);

    socket = io(LIVEWIRE_URL, {
      path: "/socket.io",
      auth: { token },

      // In prod, force websocket. In dev you can allow polling if you want,
      // but keeping it websocket-only reduces "works local / fails prod" class of issues.
      transports: isProd ? ["websocket"] : undefined,

      withCredentials: false,
      timeout: CONNECT_TIMEOUT_MS,

      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
    });

    // ---- Auth refresh strategy ----
    // Socket.IO handshake uses `socket.auth`. Update it before reconnect attempts.
    socket.io.on("reconnect_attempt", async () => {
      const fresh = await getFreshWsToken();
      if (fresh && socket) {
        socket.auth = { token: fresh };
      }
    });

    // Avoid reconnect storms: allow at most ONE manual auth retry per connect cycle.
    let didAuthRetry = false;

    socket.on("connect", () => {
      if (!socket) return;
      console.log("[socket.ts] ✅ connected:", socket.id);
      didAuthRetry = false;

      if (!didAttachGlobalDebug) {
        didAttachGlobalDebug = true;
        socket.onAny((eventName, ...args) => {
          console.log(`[socket] 📡 Event received: ${eventName}`, args);
        });
      }
    });

    socket.on("disconnect", (reason: DisconnectReason) => {
      console.warn("[socket.ts] ⚠️ disconnected. reason:", reason);
      // Let socket.io handle reconnection unless this was explicit.
      if (reason === "io client disconnect") return;
    });

    socket.on("connect_error", async (err: any) => {
      const msg = String(err?.message || err || "").toLowerCase();
      console.warn("[socket.ts] connect_error:", msg);

      const isAuthish =
        msg.includes("token_expired") ||
        msg.includes("token_invalid") ||
        msg.includes("missing_token") ||
        msg.includes("auth") ||
        msg.includes("jwt") ||
        msg.includes("token");

      // One-shot retry for auth failures
      if (!didAuthRetry && isAuthish) {
        didAuthRetry = true;
        const fresh = await getFreshWsToken();
        if (fresh && socket) {
          socket.auth = { token: fresh };
          socket.connect();
          return;
        }
      }
    });

    // Resolve when connected OR after timeout (so callers never hang)
    const timeout = setTimeout(() => {
      console.error("[socket.ts] ❌ connect timeout");
      connectPromise = null;
      resolve(socket?.connected ? socket : null);
    }, CONNECT_TIMEOUT_MS);

    socket.once("connect", () => {
      clearTimeout(timeout);
      const s = socket;
      connectPromise = null;
      resolve(s);
    });

    socket.once("connect_error", () => {
      clearTimeout(timeout);
      connectPromise = null;
      resolve(null);
    });
  });

  return connectPromise;
};

export const refreshSocketAuth = async (): Promise<void> => {
  // IMPORTANT: Use WS token (aud=livewire), not API access token.
  const token = await getFreshWsToken();
  if (!token) return;

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
  } else {
    await initializeSocket();
  }
};

export const closeSocket = () => {
  if (socket) {
    console.log("[socket.ts] 🔌 closing (logout)");
    socket.disconnect(); // user-initiated close
  }
  teardownSocket();
  connectPromise = null;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("[socket.ts] 🔌 disconnecting:", socket.id);
    socket.disconnect();
  }
  teardownSocket();
  connectPromise = null;
};

export const getSocket = (): Socket | null => {
  if (process.env.NODE_ENV === "development") {
    console.log("[socket.ts] getSocket() returning:", {
      hasSocket: !!socket,
      socketId: socket?.id,
      isConnected: socket?.connected,
    });
  }
  return socket;
};
