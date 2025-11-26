// lib/auth/wsToken.ts

import { axiosInstance } from "@providers/auth-provider/axiosInstance";

type WSToken = { token: string; exp: number };

let cache: WSToken | null = null;
let inFlight: Promise<WSToken> | null = null;

function isExpiringSoon(expUnix: number, skewSec = 60) {
  const now = Math.floor(Date.now() / 1000);
  return expUnix - now <= skewSec;
}

export async function getLivewireAccessToken(): Promise<string | null> {
  if (cache && !isExpiringSoon(cache.exp)) {
    console.log('[wsToken] Returning cached WS token');
    return cache.token;
  }

  if (inFlight) {
    console.log('[wsToken] WS token fetch already in flight, waiting...');
    const wsTok = await inFlight;
    return wsTok.token;
  }

  console.log('[wsToken] Fetching new WS token from Django...');

  inFlight = (async () => {
    try {
      const { data } = await axiosInstance.post<WSToken>("/api/livewire/token");
      console.log('[wsToken] ✅ WS token received, expires:', new Date(data.exp * 1000).toISOString());
      cache = data; // { token, exp }
      return data;
    } catch (error) {
      console.error('[wsToken] ❌ Failed to fetch WS token:', error);
      throw error;
    }
  })();

  try {
    const wsTok = await inFlight;
    return wsTok.token;
  } catch (error) {
    console.error('[wsToken] Error in getLivewireAccessToken:', error);
    return null;
  } finally {
    inFlight = null;
  }
}

export function clearWsTokenCache() {
  cache = null;
  inFlight = null;
}
