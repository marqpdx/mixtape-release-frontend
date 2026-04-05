"use client";

import { useEffect } from "react";
import { useHelpContext } from "./HelpProvider";

export function useHelpRegistration(key: string | null | undefined) {
  const { registerWorkArea, unregisterWorkArea } = useHelpContext();

  useEffect(() => {
    if (!key) return;
    registerWorkArea(key);
    return () => unregisterWorkArea(key);
  }, [key, registerWorkArea, unregisterWorkArea]);
}
