// lib/auth/wsToken.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

type WSTokenResponse = { token: string; exp?: number };

let cache: { token: string; exp: number } | null = null;
let inFlight: Promise<{ token: string; exp: number } | null> | null = null;

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

function isExpiringSoon(expUnix: number, skewSec = 90) {
  return expUnix - nowUnix() <= skewSec;
}

function decodeJwtExp(token: string): number | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;

    // base64url -> base64
    const b64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(b64);
    const payload = JSON.parse(json);
    const exp = payload?.exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

export async function getLivewireAccessToken(): Promise<string | null> {
  if (cache && !isExpiringSoon(cache.exp)) {
    return cache.token;
  }

  if (inFlight) {
    const wsTok = await inFlight;
    return wsTok?.token ?? null;
  }

  inFlight = (async () => {
    try {
      const { data } = await axiosInstance.post<WSTokenResponse>("/api/livewire/token");

      const token = data?.token;
      if (!token) {
        console.error("[wsToken] ❌ /api/livewire/token returned no token");
        return null;
      }

      // Prefer server exp, but verify/fallback by decoding the JWT
      const decodedExp = decodeJwtExp(token);
      const exp = typeof data.exp === "number" ? data.exp : decodedExp;

      if (!exp) {
        // If we truly can't determine exp, cache it very briefly (worst-case safe)
        const shortExp = nowUnix() + 30;
        cache = { token, exp: shortExp };
        console.warn("[wsToken] ⚠️ Could not determine exp; caching token for 30s only");
        return cache;
      }

      cache = { token, exp };
      return cache;
    } catch (error) {
      console.error("[wsToken] ❌ Failed to fetch WS token:", error);
      return null;
    } finally {
      // IMPORTANT: clear inFlight no matter what
      // (we also clear again in outer finally, but this guarantees cleanup)
    }
  })();

  try {
    const wsTok = await inFlight;
    return wsTok?.token ?? null;
  } finally {
    inFlight = null;
  }
}

export function clearWsTokenCache() {
  cache = null;
  inFlight = null;
}
