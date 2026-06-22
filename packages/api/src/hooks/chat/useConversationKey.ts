// packages/api/src/hooks/chat/useConversationKey.ts
//
// Resolves the AES-GCM conversation key for a Private or Ephemeral conversation.
// Order: IndexedDB cache → fetch bundle from server → unwrap with device private key → cache.
// Returns null for Standard conversations (no E2E key needed).

import { useEffect, useRef, useState } from "react";
import { unwrapConversationKey } from "@mixtape/core/crypto/primitives";
import { getConversationKey, storeConversationKey } from "@mixtape/core/crypto/keyStore";
import { fetchMyConversationKey } from "../../clients/chat/chatApi";
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
): ConversationKeyState {
  const [state, setState] = useState<ConversationKeyState>({ status: "loading" });
  const loadedSlug = useRef<string | null>(null);

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
        const cached = await getConversationKey(slug);
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

        await storeConversationKey(slug, key, bundle.key_version);
        setState({ status: "ready", key, version: bundle.key_version });
      } catch (err) {
        setState({ status: "error", error: err instanceof Error ? err : new Error(String(err)) });
      }
    })();
  }, [slug, trustProfile, deviceId, deviceKeyState]);

  return state;
}
