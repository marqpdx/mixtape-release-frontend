// packages/api/src/hooks/chat/useDeviceKey.ts
//
// Manages the ECDH key pair for the current device. On first call, generates a
// key pair, persists it in IndexedDB, and registers the public key with the server.
// Subsequent calls load the existing pair from IndexedDB.
//
// The device ID must be provided by the caller (from the device session context).

import { useEffect, useRef, useState } from "react";
import { generateDeviceKeyPair, exportPublicKey } from "@mixtape/core/crypto/primitives";
import { getDeviceKeyPair, storeDeviceKeyPair } from "@mixtape/core/crypto/keyStore";
import { registerDeviceKey } from "../../clients/chat/chatApi";

export type DeviceKeyState =
  | { status: "loading" }
  | { status: "ready"; privateKey: CryptoKey; publicKey: CryptoKey }
  | { status: "error"; error: Error };

export function useDeviceKey(deviceId: string | null): DeviceKeyState {
  const [state, setState] = useState<DeviceKeyState>({ status: "loading" });
  const initialized = useRef(false);

  useEffect(() => {
    if (!deviceId || initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        let pair = await getDeviceKeyPair();

        if (!pair) {
          pair = await generateDeviceKeyPair();
          await storeDeviceKeyPair(pair);
          const publicKeyJwk = await exportPublicKey(pair.publicKey);
          await registerDeviceKey(deviceId, publicKeyJwk);
        }

        setState({ status: "ready", privateKey: pair.privateKey, publicKey: pair.publicKey });
      } catch (err) {
        setState({ status: "error", error: err instanceof Error ? err : new Error(String(err)) });
      }
    })();
  }, [deviceId]);

  return state;
}
