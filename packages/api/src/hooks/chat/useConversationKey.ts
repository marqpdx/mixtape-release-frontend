// packages/api/src/hooks/chat/useConversationKey.ts
//
// Resolves the AES-GCM conversation key for a Private or Ephemeral conversation.
// Order: IndexedDB cache → fetch bundle from server → unwrap with device private key → cache.
// Returns "n/a" for Standard conversations (no E2E key needed).
//
// LW-C4: also exposes getKeyForVersion (to decrypt history from before a
// rotation) and rotate (to mint + distribute a fresh key now).

import { useCallback, useEffect, useRef, useState } from "react";
import { unwrapConversationKey } from "@mixtape/core/crypto/primitives";
import {
  getLatestCachedConversationKey,
  getConversationKeyVersion,
  storeConversationKeyVersion,
} from "@mixtape/core/crypto/keyStore";
import { fetchMyConversationKey } from "../../clients/chat/chatApi";
import { rotateConversationKey } from "../../lib/chat/keyRotation";
import type { DeviceKeyState } from "./useDeviceKey";

type TrustProfile = "standard" | "private" | "ephemeral";

export type ConversationKeyState =
  | { status: "loading" }
  | { status: "ready"; key: CryptoKey; version: number }
  | { status: "no-key" }   // Private/Ephemeral but no bundle distributed yet
  | { status: "n/a" }      // Standard conversation — E2E not applicable
  | { status: "error"; error: Error };

export function useConversationKey(
  slug: string,
  trustProfile: TrustProfile,
  deviceId: string | null,
  deviceKeyState: DeviceKeyState
) {
  const [state, setState] = useState<ConversationKeyState>({ status: "loading" });
  const loadedSlug = useRef<string | null>(null);
  const deviceKeyStateRef = useRef(deviceKeyState);
  deviceKeyStateRef.current = deviceKeyState;

  useEffect(() => {
    if (trustProfile === "standard") {
      setState({ status: "n/a" });
      return;
    }

    if (!deviceId || deviceKeyState.status !== "ready") return;
    if (loadedSlug.current === slug) return;

    loadedSlug.current = slug;
    const { privateKey } = deviceKeyState;

    (async () => {
      try {
        // Check IndexedDB cache first
        const cached = await getLatestCachedConversationKey(slug);
        if (cached) {
          setState({ status: "ready", key: cached.key, version: cached.version });
          return;
        }

        // Fetch bundle from server
        let bundle;
        try {
          bundle = await fetchMyConversationKey(slug, deviceId);
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 404) {
            setState({ status: "no-key" });
            return;
          }
          throw err;
        }

        // Unwrap conversation key using device private key + ephemeral public key from bundle
        const key = await unwrapConversationKey(
          privateKey,
          bundle.ephemeral_public_key,
          bundle.encrypted_key,
          bundle.nonce
        );

        await storeConversationKeyVersion(slug, key, bundle.key_version);
        setState({ status: "ready", key, version: bundle.key_version });
      } catch (err) {
        setState({ status: "error", error: err instanceof Error ? err : new Error(String(err)) });
      }
    })();
  }, [slug, trustProfile, deviceId, deviceKeyState]);

  // Resolves the key for a specific version, for decrypting messages sent
  // before the latest rotation. Checks the cache before hitting the server.
  const getKeyForVersion = useCallback(
    async (version: number): Promise<CryptoKey | null> => {
      const cached = await getConversationKeyVersion(slug, version);
      if (cached) return cached;

      if (!deviceId || deviceKeyStateRef.current.status !== "ready") return null;
      const { privateKey } = deviceKeyStateRef.current;

      try {
        const bundle = await fetchMyConversationKey(slug, deviceId, version);
        const key = await unwrapConversationKey(
          privateKey,
          bundle.ephemeral_public_key,
          bundle.encrypted_key,
          bundle.nonce
        );
        await storeConversationKeyVersion(slug, key, version);
        return key;
      } catch {
        return null; // no bundle for this version — device never had access to it
      }
    },
    [slug, deviceId]
  );

  // Mints a new conversation key, wraps + distributes it to every active
  // device with a registered public key, and adopts it as the live state.
  const rotate = useCallback(async (): Promise<void> => {
    const { key, version } = await rotateConversationKey(slug);
    setState({ status: "ready", key, version });
  }, [slug]);

  return { state, getKeyForVersion, rotate };
}
