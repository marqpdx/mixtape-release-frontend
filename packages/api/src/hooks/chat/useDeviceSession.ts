// packages/api/src/hooks/chat/useDeviceSession.ts
//
// Manages the current device's identity with the Livewire backend.
// On first run: generates a UUID, persists it in localStorage, upserts with server.
// Subsequent runs: reads from localStorage and re-upserts (updates last_seen_at).

import { useEffect, useRef, useState } from "react";
import { registerDeviceSession } from "../../clients/chat/chatApi";

const LS_KEY = "livewire-device-id";

function getOrCreateLocalDeviceId(): string {
  let id = localStorage.getItem(LS_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(LS_KEY, id);
  }
  return id;
}

export function useDeviceSession(): { deviceId: string | null } {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const id = getOrCreateLocalDeviceId();
    const platform = "web";
    const deviceName = navigator.userAgent.slice(0, 200);

    registerDeviceSession(id, platform, deviceName)
      .then(() => setDeviceId(id))
      .catch(() => {
        // Still surface the id — registration failure is non-fatal
        setDeviceId(id);
      });
  }, []);

  return { deviceId };
}
