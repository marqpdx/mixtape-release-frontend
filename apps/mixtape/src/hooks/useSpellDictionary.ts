// src/hooks/useSpellDictionary.ts
/**
 * useSpellDictionary Hook
 *
 * Manages a shared spell correction dictionary backed by the Spellbook API.
 * Falls back to localStorage seeds when the API is unavailable.
 *
 * Part of PocketTools - Spelling Helpers
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useSpellCorrections,
  useRecordCorrectionUsage,
} from '@mixtape/api';

const STORAGE_KEY = 'mixtape-spell-dictionary';

export interface SpellCorrection {
  wrong: string;
  correct: string;
  addedAt: string;
  usageCount: number;
}

export interface SpellDictionary {
  version: number;
  corrections: SpellCorrection[];
}

const DEFAULT_DICTIONARY: SpellDictionary = {
  version: 1,
  corrections: [],
};

// Common typos to seed the dictionary (used as fallback when API unavailable)
const SEED_CORRECTIONS: Omit<SpellCorrection, 'addedAt' | 'usageCount'>[] = [
  { wrong: 'teh', correct: 'the' },
  { wrong: 'adn', correct: 'and' },
  { wrong: 'taht', correct: 'that' },
  { wrong: 'waht', correct: 'what' },
  { wrong: 'wiht', correct: 'with' },
  { wrong: 'hte', correct: 'the' },
  { wrong: 'dont', correct: "don't" },
  { wrong: 'wont', correct: "won't" },
  { wrong: 'cant', correct: "can't" },
  { wrong: 'didnt', correct: "didn't" },
  { wrong: 'doesnt', correct: "doesn't" },
  { wrong: 'isnt', correct: "isn't" },
  { wrong: 'wasnt', correct: "wasn't" },
  { wrong: 'werent', correct: "weren't" },
  { wrong: 'havent', correct: "haven't" },
  { wrong: 'hasnt', correct: "hasn't" },
  { wrong: 'hadnt', correct: "hadn't" },
  { wrong: 'wouldnt', correct: "wouldn't" },
  { wrong: 'couldnt', correct: "couldn't" },
  { wrong: 'shouldnt', correct: "shouldn't" },
  { wrong: 'recieve', correct: 'receive' },
  { wrong: 'occured', correct: 'occurred' },
  { wrong: 'seperate', correct: 'separate' },
  { wrong: 'definately', correct: 'definitely' },
  { wrong: 'occassion', correct: 'occasion' },
  { wrong: 'untill', correct: 'until' },
  { wrong: 'accross', correct: 'across' },
  { wrong: 'beleive', correct: 'believe' },
  { wrong: 'begining', correct: 'beginning' },
  { wrong: 'arguement', correct: 'argument' },
];

export function useSpellDictionary() {
  // ── API data ──────────────────────────────────────────────────────────
  const { data: apiCorrections, isError: apiFailed } = useSpellCorrections();
  const recordUsageMutation = useRecordCorrectionUsage();

  // ── Local dictionary (personal corrections + seeds as fallback) ──────
  const [localDictionary, setLocalDictionary] = useState<SpellDictionary>(DEFAULT_DICTIONARY);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SpellDictionary;
        setLocalDictionary(parsed);
      } else {
        // Seed with common corrections
        const seeded: SpellDictionary = {
          version: 1,
          corrections: SEED_CORRECTIONS.map(c => ({
            ...c,
            addedAt: new Date().toISOString(),
            usageCount: 0,
          })),
        };
        setLocalDictionary(seeded);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      }
    } catch (e) {
      console.error('Failed to load spell dictionary:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when local dictionary changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localDictionary));
      } catch (e) {
        console.error('Failed to save spell dictionary:', e);
      }
    }
  }, [localDictionary, isLoaded]);

  // ── API correction ID lookup (wrong_word → id) for recordUsage ──────
  const apiIdMap = useMemo(() => {
    const map = new Map<string, string>();
    if (apiCorrections) {
      for (const c of apiCorrections) {
        map.set(c.wrong_word.toLowerCase(), c.id);
      }
    }
    return map;
  }, [apiCorrections]);

  // ── Merged lookup map: API corrections override local/seeds ──────────
  const correctionMap = useMemo(() => {
    const map = new Map<string, string>();
    // Local/seed corrections first
    for (const c of localDictionary.corrections) {
      map.set(c.wrong.toLowerCase(), c.correct);
    }
    // API corrections take precedence
    if (apiCorrections) {
      for (const c of apiCorrections) {
        map.set(c.wrong_word.toLowerCase(), c.correct_word);
      }
    }
    return map;
  }, [localDictionary.corrections, apiCorrections]);

  // ── Merged corrections list (for UI display) ──────────────────────────
  const corrections = useMemo((): SpellCorrection[] => {
    // Start with local corrections keyed by wrong word
    const byWord = new Map<string, SpellCorrection>();
    for (const c of localDictionary.corrections) {
      byWord.set(c.wrong.toLowerCase(), c);
    }
    // API corrections override
    if (apiCorrections) {
      for (const c of apiCorrections) {
        byWord.set(c.wrong_word.toLowerCase(), {
          wrong: c.wrong_word,
          correct: c.correct_word,
          addedAt: c.created_at,
          usageCount: c.usage_count,
        });
      }
    }
    return Array.from(byWord.values());
  }, [localDictionary.corrections, apiCorrections]);

  // ── Add a correction (local state + API recordUsage if exists) ────────
  const addCorrection = useCallback((wrong: string, correct: string) => {
    const wrongLower = wrong.toLowerCase().trim();
    const correctTrimmed = correct.trim();

    if (!wrongLower || !correctTrimmed) return;
    if (wrongLower === correctTrimmed.toLowerCase()) return;

    // Update local state
    setLocalDictionary(prev => {
      const existingIndex = prev.corrections.findIndex(
        c => c.wrong.toLowerCase() === wrongLower
      );

      if (existingIndex >= 0) {
        const updated = [...prev.corrections];
        updated[existingIndex] = {
          ...updated[existingIndex],
          correct: correctTrimmed,
          usageCount: updated[existingIndex].usageCount + 1,
        };
        return { ...prev, corrections: updated };
      }

      return {
        ...prev,
        corrections: [
          ...prev.corrections,
          {
            wrong: wrongLower,
            correct: correctTrimmed,
            addedAt: new Date().toISOString(),
            usageCount: 0,
          },
        ],
      };
    });

    // Fire API recordUsage if this correction exists in the shared dictionary
    const apiId = apiIdMap.get(wrongLower);
    if (apiId) {
      recordUsageMutation.mutate(apiId);
    }
  }, [apiIdMap, recordUsageMutation]);

  // Remove a correction (local only)
  const removeCorrection = useCallback((wrong: string) => {
    const wrongLower = wrong.toLowerCase().trim();
    setLocalDictionary(prev => ({
      ...prev,
      corrections: prev.corrections.filter(
        c => c.wrong.toLowerCase() !== wrongLower
      ),
    }));
  }, []);

  // Get correction for a word (case-insensitive lookup, preserves case)
  const getCorrection = useCallback((word: string): string | null => {
    const correction = correctionMap.get(word.toLowerCase());
    if (!correction) return null;

    // Preserve original casing pattern
    if (word === word.toUpperCase()) {
      return correction.toUpperCase();
    }
    if (word[0] === word[0].toUpperCase()) {
      return correction.charAt(0).toUpperCase() + correction.slice(1);
    }
    return correction;
  }, [correctionMap]);

  // Increment usage count when a correction is applied
  const recordUsage = useCallback((wrong: string) => {
    const wrongLower = wrong.toLowerCase().trim();

    // Update local count
    setLocalDictionary(prev => {
      const updated = prev.corrections.map(c =>
        c.wrong.toLowerCase() === wrongLower
          ? { ...c, usageCount: c.usageCount + 1 }
          : c
      );
      return { ...prev, corrections: updated };
    });

    // Fire API recordUsage
    const apiId = apiIdMap.get(wrongLower);
    if (apiId) {
      recordUsageMutation.mutate(apiId);
    }
  }, [apiIdMap, recordUsageMutation]);

  // Export dictionary (for backup/sync)
  const exportDictionary = useCallback(() => {
    return JSON.stringify({ ...localDictionary, corrections }, null, 2);
  }, [localDictionary, corrections]);

  // Import dictionary
  const importDictionary = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as SpellDictionary;
      if (parsed.corrections && Array.isArray(parsed.corrections)) {
        setLocalDictionary(parsed);
        return true;
      }
    } catch (e) {
      console.error('Failed to import dictionary:', e);
    }
    return false;
  }, []);

  return {
    dictionary: { ...localDictionary, corrections },
    isLoaded: isLoaded && !apiFailed,
    corrections,
    addCorrection,
    removeCorrection,
    getCorrection,
    recordUsage,
    exportDictionary,
    importDictionary,
  };
}

export default useSpellDictionary;
