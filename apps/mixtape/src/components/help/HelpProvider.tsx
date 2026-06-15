"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { HelpEntry, HelpManifest, ResolvedHelp } from "@/types/help";
import { inferSubsystemFromPathname, matchRoute } from "./matchRoute";

interface HelpContextValue {
  manifest: HelpManifest | null;
  resolveHelp: (explicitKey?: string) => ResolvedHelp | null;
  openDrawer: (helpKey?: string) => void;
  closeDrawer: () => void;
  isDrawerOpen: boolean;
  activeHelpKey: string | null;
  activeEntries: HelpEntry[];
  setActiveHelpKey: (key: string) => void;
  registerWorkArea: (key: string) => void;
  unregisterWorkArea: (key: string) => void;
}

const HelpContext = createContext<HelpContextValue | null>(null);

function dedupeKeys(keys: string[]): string[] {
  return Array.from(new Set(keys));
}

function sameStringArray(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [manifest, setManifest] = useState<HelpManifest | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeHelpKey, setActiveHelpKey] = useState<string | null>(null);
  const [activeHelpKeys, setActiveHelpKeys] = useState<string[]>([]);
  const [workAreaVersion, setWorkAreaVersion] = useState(0);
  const registeredWorkAreas = useRef<Set<string>>(new Set());
  const lastRequestedHelpKey = useRef<string | undefined>(undefined);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const loadManifest = async () => {
      const urls = [
        "/app/help-manifest.json",
        "/app/api/help/manifest",
        "/help-manifest.json",
        "/api/help/manifest",
      ];

      for (const url of urls) {
        try {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) continue;
          const data = (await response.json()) as HelpManifest;
          if (!cancelled) {
            setManifest(data);
          }
          return;
        } catch {
          // Try the next location.
        }
      }

      if (!cancelled) {
        console.warn("[HelpSys] Could not load help manifest");
      }
    };

    loadManifest();

    return () => {
      cancelled = true;
    };
  }, []);

  const registerWorkArea = useCallback((key: string) => {
    if (registeredWorkAreas.current.has(key)) return;
    registeredWorkAreas.current.add(key);
    setWorkAreaVersion((version) => version + 1);
  }, []);

  const unregisterWorkArea = useCallback((key: string) => {
    if (!registeredWorkAreas.current.delete(key)) return;
    setWorkAreaVersion((version) => version + 1);
  }, []);

  const resolveHelp = useCallback(
    (explicitKey?: string): ResolvedHelp | null => {
      if (!manifest) return null;

      if (explicitKey && manifest.entries[explicitKey]) {
        return { entries: [manifest.entries[explicitKey]], source: "workArea" };
      }

      const workAreaKeys = Array.from(registeredWorkAreas.current).flatMap(
        (workArea) =>
          manifest.entries[workArea]
            ? [workArea]
            : manifest.workAreaIndex[workArea] ?? [],
      );
      const uniqueWorkAreaKeys = dedupeKeys(workAreaKeys);
      if (uniqueWorkAreaKeys.length > 0) {
        return {
          entries: uniqueWorkAreaKeys
            .map((key) => manifest.entries[key])
            .filter((entry): entry is HelpEntry => Boolean(entry)),
          source: "workArea",
        };
      }

      const routeEntries = Object.values(manifest.entries).filter((entry) =>
        matchRoute(pathname, entry.routes),
      );
      if (routeEntries.length > 0) {
        return { entries: routeEntries, source: "route" };
      }

      const subsystem = inferSubsystemFromPathname(pathname);
      if (subsystem) {
        const subsystemKeys = manifest.subsystemIndex[subsystem] ?? [];
        const overviewEntry =
          manifest.entries[`${subsystem}-overview`] ??
          subsystemKeys
            .map((key) => manifest.entries[key])
            .find((entry): entry is HelpEntry => Boolean(entry));
        if (overviewEntry) {
          return { entries: [overviewEntry], source: "subsystem" };
        }
      }

      return { entries: [], source: "fallback" };
    },
    [manifest, pathname],
  );

  const setResolvedHelp = useCallback(
    (resolved: ResolvedHelp | null, requestedHelpKey?: string) => {
      const nextEntries = resolved?.entries ?? [];
      const nextKeys = nextEntries.map((entry) => entry.key);
      const nextActiveHelpKey =
        requestedHelpKey && nextKeys.includes(requestedHelpKey)
          ? requestedHelpKey
          : nextKeys[0] ?? null;

      setActiveHelpKeys(nextKeys);
      setActiveHelpKey(nextActiveHelpKey);
    },
    [],
  );

  const openDrawer = useCallback(
    (helpKey?: string) => {
      lastRequestedHelpKey.current = helpKey;
      const resolved = resolveHelp(helpKey);
      setResolvedHelp(resolved, helpKey);
      setIsDrawerOpen(true);
    },
    [resolveHelp, setResolvedHelp],
  );

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const activeEntries = useMemo(() => {
    if (!manifest) return [];
    return activeHelpKeys
      .map((key) => manifest.entries[key])
      .filter((entry): entry is HelpEntry => Boolean(entry));
  }, [activeHelpKeys, manifest]);

  useEffect(() => {
    if (!isDrawerOpen || !manifest) return;

    const resolved = resolveHelp(lastRequestedHelpKey.current);
    const nextEntries = resolved?.entries ?? [];
    const nextKeys = nextEntries.map((entry) => entry.key);
    const nextActiveHelpKey =
      lastRequestedHelpKey.current && nextKeys.includes(lastRequestedHelpKey.current)
        ? lastRequestedHelpKey.current
        : nextKeys[0] ?? null;

    if (sameStringArray(activeHelpKeys, nextKeys) && activeHelpKey === nextActiveHelpKey) {
      return;
    }

    setResolvedHelp(resolved, lastRequestedHelpKey.current);
  }, [
    activeHelpKey,
    activeHelpKeys,
    isDrawerOpen,
    manifest,
    pathname,
    resolveHelp,
    setResolvedHelp,
    workAreaVersion,
  ]);

  const value = useMemo<HelpContextValue>(
    () => ({
      manifest,
      resolveHelp,
      openDrawer,
      closeDrawer,
      isDrawerOpen,
      activeHelpKey,
      activeEntries,
      setActiveHelpKey,
      registerWorkArea,
      unregisterWorkArea,
    }),
    [
      manifest,
      resolveHelp,
      openDrawer,
      closeDrawer,
      isDrawerOpen,
      activeHelpKey,
      activeEntries,
      registerWorkArea,
      unregisterWorkArea,
    ],
  );

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

export function useHelpContext() {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error("useHelpContext must be used within a HelpProvider");
  }
  return context;
}
