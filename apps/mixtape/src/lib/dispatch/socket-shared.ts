// lib/socket-shared.ts

import { getAccessToken } from "@mixtape/auth/tokenStorage";
import { refreshAccessToken } from "@mixtape/api/clients/auth/api";
import { io, Socket } from "socket.io-client";

let sharedSocket: Socket | null = null;
let connecting: boolean = false;

export const initializeSharedSocket = async (): Promise<Socket | null> => {
  console.log("SharedSocket: ⚙️ initializeSharedSocket called");
  console.log("SharedSocket: 🔍 Current socket state:", {
    socketExists: !!sharedSocket,
    connected: sharedSocket?.connected,
    connecting,
  });

  if (connecting) {
    console.log("SharedSocket: 🟡 Socket connection already in progress...");
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (sharedSocket?.connected) {
          clearInterval(interval);
          resolve(sharedSocket);
        }
      }, 100);
    });
  }

  if (sharedSocket && sharedSocket.connected) {
    console.log("SharedSocket: 🔄 Socket already connected:", sharedSocket.id);
    return sharedSocket;
  }

  connecting = true;
  console.log("SharedSocket: 🚀 Starting new socket connection...");

  let token = getAccessToken();
  if (!token) {
    token = await refreshAccessToken();
  }
  if (!token) {
    console.warn("SharedSocket: 🛑 No valid access token available for socket.");
    connecting = false;
    return null;
  }

  const SOCKET_URL =
    process.env.NEXT_PUBLIC_LIVEWIRE_URL;

  sharedSocket = io(SOCKET_URL, {
    withCredentials: true,
    auth: { token },
    transports: ["websocket"],
  });

  sharedSocket.onAny((event, ...args) => {
    console.log("SharedSocket: 📡 Client emitted:", event, args);
  });

  // Better disconnect handling - let Socket.IO handle automatic reconnections
  sharedSocket.on("disconnect", (reason) => {
    console.warn(`SharedSocket: ⚠️ Socket disconnected: ${reason}`);
    connecting = false;

    // Only manually reconnect for server-initiated disconnects
    if (reason === "io server disconnect") {
      console.log("SharedSocket: 🔄 Server disconnected, will reconnect...");
      setTimeout(() => resetSharedSocket(), 2000);
    } else {
      console.log("SharedSocket: 🔄 Automatic reconnection will be handled by Socket.IO");
    }
  });

  // Handle successful reconnections
  sharedSocket.on("connect", () => {
    console.log("SharedSocket: 🔄 Socket reconnected:", sharedSocket?.id);
  });

  return new Promise((resolve, reject) => {
    sharedSocket?.once("connect", () => {
      console.log("SharedSocket: 🧠 WebSocket connected:", sharedSocket?.id);
      connecting = false;
      resolve(sharedSocket);
    });

    sharedSocket?.once("connect_error", (err) => {
      console.error("SharedSocket: ❌ WebSocket connection failed:", err.message);
      connecting = false;
      reject(err);
    });
  });
};

// Safe reconnect wrapper
export const resetSharedSocket = async (): Promise<Socket | null> => {
  console.log("SharedSocket: ♻️ Resetting socket...");
  if (sharedSocket) {
    console.log("SharedSocket: 🔌 Disconnecting socket:", sharedSocket.id);
    sharedSocket.disconnect();
    sharedSocket = null;
  }
  connecting = false;
  return initializeSharedSocket();
};

export const disconnectSharedSocket = () => {
  if (sharedSocket) {
    console.log("SharedSocket: 🔌 Disconnecting socket:", sharedSocket.id);
    sharedSocket.disconnect();
    sharedSocket = null;
  }
};

export const getSharedSocket = (): Socket | null => sharedSocket;