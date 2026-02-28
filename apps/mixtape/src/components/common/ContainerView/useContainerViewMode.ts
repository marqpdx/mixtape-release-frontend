// useContainerViewMode.ts

import { useState, useEffect, useCallback } from "react"
import type { ViewMode } from "./ContainerView.types"

export function useContainerViewMode(
  storageKey?: string,
  defaultMode: ViewMode = "grid"
) {
  const [mode, setMode] = useState<ViewMode>(defaultMode)

  useEffect(() => {
    if (!storageKey) return
    const saved = localStorage.getItem(storageKey)
    if (saved === "grid" || saved === "list") setMode(saved)
  }, [storageKey])

  const setAndPersist = useCallback(
    (next: ViewMode) => {
      setMode(next)
      if (storageKey) localStorage.setItem(storageKey, next)
    },
    [storageKey]
  )

  return [mode, setAndPersist] as const
}
