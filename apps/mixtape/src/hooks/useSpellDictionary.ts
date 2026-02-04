// src/hooks/useSpellDictionary.ts
/**
 * useSpellDictionary Hook
 *
 * Manages a personal spell correction dictionary.
 * Currently uses localStorage, with future backend sync support.
 *
 * Part of PocketTools - Spelling Helpers
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

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

// Common typos to seed the dictionary
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
  const [dictionary, setDictionary] = useState<SpellDictionary>(DEFAULT_DICTIONARY);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SpellDictionary;
        setDictionary(parsed);
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
        setDictionary(seeded);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      }
    } catch (e) {
      console.error('Failed to load spell dictionary:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when dictionary changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dictionary));
      } catch (e) {
        console.error('Failed to save spell dictionary:', e);
      }
    }
  }, [dictionary, isLoaded]);

  // Build a lookup map for fast correction lookups (case-insensitive)
  const correctionMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of dictionary.corrections) {
      map.set(c.wrong.toLowerCase(), c.correct);
    }
    return map;
  }, [dictionary.corrections]);

  // Add a new correction
  const addCorrection = useCallback((wrong: string, correct: string) => {
    const wrongLower = wrong.toLowerCase().trim();
    const correctTrimmed = correct.trim();

    if (!wrongLower || !correctTrimmed) return;
    if (wrongLower === correctTrimmed.toLowerCase()) return; // No self-corrections

    setDictionary(prev => {
      // Check if correction already exists
      const existingIndex = prev.corrections.findIndex(
        c => c.wrong.toLowerCase() === wrongLower
      );

      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev.corrections];
        updated[existingIndex] = {
          ...updated[existingIndex],
          correct: correctTrimmed,
          usageCount: updated[existingIndex].usageCount + 1,
        };
        return { ...prev, corrections: updated };
      }

      // Add new
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
  }, []);

  // Remove a correction
  const removeCorrection = useCallback((wrong: string) => {
    const wrongLower = wrong.toLowerCase().trim();
    setDictionary(prev => ({
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
    setDictionary(prev => {
      const updated = prev.corrections.map(c =>
        c.wrong.toLowerCase() === wrongLower
          ? { ...c, usageCount: c.usageCount + 1 }
          : c
      );
      return { ...prev, corrections: updated };
    });
  }, []);

  // Export dictionary (for backup/sync)
  const exportDictionary = useCallback(() => {
    return JSON.stringify(dictionary, null, 2);
  }, [dictionary]);

  // Import dictionary
  const importDictionary = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as SpellDictionary;
      if (parsed.corrections && Array.isArray(parsed.corrections)) {
        setDictionary(parsed);
        return true;
      }
    } catch (e) {
      console.error('Failed to import dictionary:', e);
    }
    return false;
  }, []);

  return {
    dictionary,
    isLoaded,
    corrections: dictionary.corrections,
    addCorrection,
    removeCorrection,
    getCorrection,
    recordUsage,
    exportDictionary,
    importDictionary,
  };
}

export default useSpellDictionary;
