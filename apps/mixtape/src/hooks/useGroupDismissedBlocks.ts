'use client';

import { useState, useEffect, useCallback } from 'react';
import { IconInfoCircle, IconSpeakerphone, IconFolder, IconUsers } from '@tabler/icons-react';
import type { FC } from 'react';

export type DismissableKey = 'welcome' | 'announcements' | 'pinned_resources' | 'member_highlights';

export interface DismissableBlockMeta {
  key: DismissableKey;
  label: string;
  icon: FC<{ size?: number }>;
}

export const DISMISSABLE_BLOCKS: readonly DismissableBlockMeta[] = [
  { key: 'welcome',           label: 'Welcome',       icon: IconInfoCircle   },
  { key: 'announcements',     label: 'Announcements', icon: IconSpeakerphone },
  { key: 'pinned_resources',  label: 'Core Resources',icon: IconFolder       },
  { key: 'member_highlights', label: 'Members',       icon: IconUsers        },
] as const;

const SYNC_EVENT = 'group-dismissed-blocks-changed';

export function useGroupDismissedBlocks(slug: string) {
  const dismissKey = `group:${slug}:dismissed-blocks`;
  const infoKey    = `group:${slug}:info-dismissed`;

  const readDismissed = useCallback((): DismissableKey[] => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(dismissKey) || '[]') as DismissableKey[]; }
    catch { return []; }
  }, [dismissKey]);

  const readInfo = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem(infoKey) === '1'; } catch { return false; }
  }, [infoKey]);

  const [dismissed, setDismissed] = useState<DismissableKey[]>(readDismissed);
  const [infoDismissed, setInfoDismissed] = useState(readInfo);

  useEffect(() => {
    const sync = () => { setDismissed(readDismissed()); setInfoDismissed(readInfo()); };
    window.addEventListener(SYNC_EVENT, sync);
    return () => window.removeEventListener(SYNC_EVENT, sync);
  }, [readDismissed, readInfo]);

  const broadcast = () => window.dispatchEvent(new Event(SYNC_EVENT));

  const dismissBlock = useCallback((key: DismissableKey) => {
    const current = readDismissed();
    if (current.includes(key)) return;
    const next = [...current, key];
    localStorage.setItem(dismissKey, JSON.stringify(next));
    setDismissed(next);
    broadcast();
  }, [dismissKey, readDismissed]);

  const restoreBlock = useCallback((key: DismissableKey) => {
    const next = readDismissed().filter(k => k !== key);
    localStorage.setItem(dismissKey, JSON.stringify(next));
    setDismissed(next);
    broadcast();
  }, [dismissKey, readDismissed]);

  const restoreAll = useCallback(() => {
    localStorage.removeItem(dismissKey);
    setDismissed([]);
    broadcast();
  }, [dismissKey]);

  const dismissInfo = useCallback(() => {
    localStorage.setItem(infoKey, '1');
    setInfoDismissed(true);
    broadcast();
  }, [infoKey]);

  const restoreInfo = useCallback(() => {
    localStorage.removeItem(infoKey);
    setInfoDismissed(false);
    broadcast();
  }, [infoKey]);

  const resetForNewMember = useCallback(() => {
    localStorage.removeItem(dismissKey);
    localStorage.removeItem(infoKey);
    setDismissed([]);
    setInfoDismissed(false);
    broadcast();
  }, [dismissKey, infoKey]);

  return {
    dismissed,
    infoDismissed,
    dismissBlock,
    restoreBlock,
    restoreAll,
    dismissInfo,
    restoreInfo,
    resetForNewMember,
  };
}
