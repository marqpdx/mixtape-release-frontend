// lib/chat/socket.ts

import { getValidAccessToken } from "@providers/auth-provider/utils";
import { getLivewireAccessToken } from "@/lib/auth/wsToken";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let connecting: boolean = false;

type DisconnectReason =
  | "io client disconnect"
  | "io server disconnect"
  | "ping timeout"
  | "transport close"
  | "transport error"
  | "parse error";

const isProd = process.env.DJANGO_ENV === "prod";

export const initializeSocket = async (): Promise<Socket | null> => {
  console.log('[socket.ts] initializeSocket called, current state:', {
    hasSocket: !!socket,
    isConnected: socket?.connected,
    isConnecting: connecting
  });

  if (socket?.connected) {
    console.log('[socket.ts] Socket already connected, returning existing socket:', socket.id);
    return socket;
  }

  if (connecting) {
    console.log('[socket.ts] Already connecting, waiting...');
    return new Promise((resolve) => {
      const iv = setInterval(() => {
        if (socket?.connected) {
          console.log('[socket.ts] Connection completed during wait');
          clearInterval(iv);
          resolve(socket);
        }
      }, 100);
    });
  }

  connecting = true;
  console.log('[socket.ts] Starting new socket connection...');

  const token = await getLivewireAccessToken();

  if (!token) {
    console.error('[socket.ts] No WS token available');
    connecting = false;
    return null;
  }

  // const LIVEWIRE_URL = process.env.NEXT_PUBLIC_LIVEWIRE_URL ?? "ws://127.0.0.1:5001";

  // Use https:// for the prod URL so clients negotiate wss:// automatically.
  // Avoid ws:// under an HTTPS site—browsers will block it as mixed content.
  // In prod, skip the polling phase entirely by choosing 'transports'.
  const LIVEWIRE_URL =
    process.env.NEXT_PUBLIC_LIVEWIRE_URL ??
    (isProd ? "https://chat.crossroads.place" : "http://127.0.0.1:5001");

  console.log('[socket.ts] Creating socket.io connection to:', LIVEWIRE_URL);

  socket = io(LIVEWIRE_URL, {
    auth: { token },
    path: "/socket.io",
    ...(isProd ? { transports: ["websocket"] } : {}),
    withCredentials: false,
    // Optional: tune reconnect behavior if helpful
    reconnectionAttempts: 10,
    reconnectionDelay: 500,

    // don't force transports in prod unless necessary
  });

  console.log('[socket.ts] Socket instance created, waiting for connection...');

  // Refresh WS token before reconnect attempts
  socket.io.on("reconnect_attempt", async () => {
    const fresh = await getLivewireAccessToken();
    if (fresh) {
      // socket.io client stores opts here:
      (socket!.io as any).opts.auth = { token: fresh };
    }
  });

  // If server rejects due to expired/invalid token, grab a fresh one and retry
  socket.on("connect_error", async (err: any) => {
    if (String(err?.message || err).toLowerCase().includes("auth")) {
      const fresh = await getLivewireAccessToken();
      if (fresh) {
        (socket!.io as any).opts.auth = { token: fresh };
        socket!.connect();
      }
    }
  });

  socket.on("connect", () => {
    if (!socket) return;
    console.log("Socket: 🧠 connected:", socket.id);
    console.log('[socket.ts] Socket module variable after connect:', {
      hasSocket: !!socket,
      socketId: socket.id,
      isConnected: socket.connected
    });
    connecting = false;

    // Debug: Log ALL socket events
    socket.onAny((eventName, ...args) => {
      console.log(`[socket] 📡 Event received: ${eventName}`, args);
    });
  });

  socket.on("disconnect", (reason: DisconnectReason) => {
    console.warn("Socket: ⚠️ disconnected. reason:", reason);
    connecting = false;
    if (reason === "io client disconnect" || reason === "io server disconnect") return;
    if (reason === "ping timeout" || reason === "transport close" || reason === "transport error") {
      setTimeout(() => initializeSocket(), 1500);
    }
  });

  return new Promise((resolve, reject) => {
    socket!.once("connect", () => resolve(socket));
    socket!.once("connect_error", (err) => { connecting = false; reject(err); });
  });
};

// export const getSocket = () => socket;

export const refreshSocketAuth = async (): Promise<void> => {
  const token = await getValidAccessToken();
  if (!token) return;

  if (socket) {
    // update auth payload for next connection attempt
    (socket as any).auth = { token };
    if (!socket.connected) socket.connect();
  } else {
    await initializeSocket(); // will pick up the new token
  }
};

export const closeSocket = () => {
  if (socket) {
    console.log("Socket: 🔌 closing (logout)");
    socket.disconnect();     // user-initiated close
    socket = null;
    connecting = false;
  }
};

/** @deprecated Prefer refreshSocketAuth(); do not force-disconnect */
export const resetSocket = async (): Promise<Socket | null> => {
  console.log("Socket: ♻️ reset requested → refreshing auth only");
  await refreshSocketAuth();
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("Socket: 🔌 Disconnecting socket:", socket.id);
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[socket.ts] getSocket() called, returning:', {
      hasSocket: !!socket,
      socketId: socket?.id,
      isConnected: socket?.connected
    });
  }
  return socket;
};
