'use client';

import { useState, useEffect } from 'react';

const VM_KEY = 'collections:view-mode';

export type ViewMode = 'list' | 'grid';

export function useViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>('list');

  useEffect(() => {
    const saved = localStorage.getItem(VM_KEY);
    if (saved === 'list' || saved === 'grid') setMode(saved);
  }, []);

  const update = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem(VM_KEY, m);
  };

  return [mode, update];
}
