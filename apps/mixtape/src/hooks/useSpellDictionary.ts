// src/hooks/useSpellDictionary.ts
/**
 * useSpellDictionary Hook
 *
 * Manages spell helpers with three merged sources:
 * - Local cache (instant)
 * - Shared superadmin spellbook corrections (read-only)
 * - User dictionary entries (ignore/replace)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useSpellCorrections,
  useRecordCorrectionUsage,
  useUserDictionary,
  useUpsertUserDictionaryEntry,
} from '@mixtape/api';

const STORAGE_KEY = 'mixtape-spell-dictionary';

function normalizeToken(token: string): string {
  return token
    .toLowerCase()
    .replace(/^[^\w']+|[^\w']+$/g, '')
    .trim();
}

export interface SpellCorrection {
  wrong: string;
  correct: string;
  addedAt: string;
  usageCount: number;
}

export interface SpellDictionary {
  version: number;
  corrections: SpellCorrection[];
  ignores: string[];
}

const DEFAULT_DICTIONARY: SpellDictionary = {
  version: 2,
  corrections: [],
  ignores: [],
};

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
  const { data: apiCorrections, isError: apiFailed } = useSpellCorrections();
  const { data: userDictionary } = useUserDictionary();
  const recordUsageMutation = useRecordCorrectionUsage();
  const upsertUserEntry = useUpsertUserDictionaryEntry();

  const [localDictionary, setLocalDictionary] = useState<SpellDictionary>(DEFAULT_DICTIONARY);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SpellDictionary>;
        setLocalDictionary({
          version: 2,
          corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
          ignores: Array.isArray(parsed.ignores) ? parsed.ignores : [],
        });
      } else {
        const seeded: SpellDictionary = {
          version: 2,
          corrections: SEED_CORRECTIONS.map(c => ({
            ...c,
            addedAt: new Date().toISOString(),
            usageCount: 0,
          })),
          ignores: [],
        };
        setLocalDictionary(seeded);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      }
    } catch (e) {
      console.error('Failed to load spell dictionary:', e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localDictionary));
    } catch (e) {
      console.error('Failed to save spell dictionary:', e);
    }
  }, [localDictionary, isLoaded]);

  const apiIdMap = useMemo(() => {
    const map = new Map<string, string>();
    if (apiCorrections) {
      for (const c of apiCorrections) {
        map.set(normalizeToken(c.wrong_word), c.id);
      }
    }
    return map;
  }, [apiCorrections]);

  const ignoreSet = useMemo(() => {
    const set = new Set<string>();
    for (const word of localDictionary.ignores) {
      const token = normalizeToken(word);
      if (token) set.add(token);
    }
    for (const word of userDictionary?.ignores ?? []) {
      const token = normalizeToken(word);
      if (token) set.add(token);
    }
    return set;
  }, [localDictionary.ignores, userDictionary?.ignores]);

  const correctionMap = useMemo(() => {
    const map = new Map<string, string>();

    for (const c of localDictionary.corrections) {
      const key = normalizeToken(c.wrong);
      if (key) map.set(key, c.correct);
    }

    if (apiCorrections) {
      for (const c of apiCorrections) {
        const key = normalizeToken(c.wrong_word);
        if (key) map.set(key, c.correct_word);
      }
    }

    const userReplacements = userDictionary?.replacements ?? {};
    for (const [wrong, correct] of Object.entries(userReplacements)) {
      const key = normalizeToken(wrong);
      if (key) map.set(key, correct);
    }

    return map;
  }, [localDictionary.corrections, apiCorrections, userDictionary?.replacements]);

  const corrections = useMemo((): SpellCorrection[] => {
    const byWord = new Map<string, SpellCorrection>();

    for (const c of localDictionary.corrections) {
      byWord.set(normalizeToken(c.wrong), c);
    }

    if (apiCorrections) {
      for (const c of apiCorrections) {
        const key = normalizeToken(c.wrong_word);
        byWord.set(key, {
          wrong: c.wrong_word,
          correct: c.correct_word,
          addedAt: c.created_at,
          usageCount: c.usage_count,
        });
      }
    }

    const userReplacements = userDictionary?.replacements ?? {};
    for (const [wrong, correct] of Object.entries(userReplacements)) {
      const key = normalizeToken(wrong);
      byWord.set(key, {
        wrong,
        correct,
        addedAt: new Date().toISOString(),
        usageCount: 0,
      });
    }

    return Array.from(byWord.values());
  }, [localDictionary.corrections, apiCorrections, userDictionary?.replacements]);

  const addReplacement = useCallback((wrong: string, correct: string) => {
    const wrongToken = normalizeToken(wrong);
    const correctTrimmed = correct.trim();

    if (!wrongToken || !correctTrimmed) return;
    if (wrongToken === normalizeToken(correctTrimmed)) return;

    setLocalDictionary(prev => {
      const existingIndex = prev.corrections.findIndex(
        c => normalizeToken(c.wrong) === wrongToken
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
            wrong: wrongToken,
            correct: correctTrimmed,
            addedAt: new Date().toISOString(),
            usageCount: 0,
          },
        ],
      };
    });

    upsertUserEntry.mutate({
      kind: 'replace',
      token: wrongToken,
      replacement: correctTrimmed,
      display: wrong,
    });

    const apiId = apiIdMap.get(wrongToken);
    if (apiId) {
      recordUsageMutation.mutate(apiId);
    }
  }, [apiIdMap, recordUsageMutation, upsertUserEntry]);

  const addIgnore = useCallback((word: string) => {
    const token = normalizeToken(word);
    if (!token) return;

    setLocalDictionary(prev => ({
      ...prev,
      ignores: prev.ignores.includes(token) ? prev.ignores : [...prev.ignores, token],
    }));

    upsertUserEntry.mutate({
      kind: 'ignore',
      token,
      display: word,
    });
  }, [upsertUserEntry]);

  const removeCorrection = useCallback((wrong: string) => {
    const wrongToken = normalizeToken(wrong);
    setLocalDictionary(prev => ({
      ...prev,
      corrections: prev.corrections.filter(c => normalizeToken(c.wrong) !== wrongToken),
    }));
  }, []);

  const isIgnored = useCallback((word: string): boolean => {
    const token = normalizeToken(word);
    if (!token) return false;
    return ignoreSet.has(token);
  }, [ignoreSet]);

  const getCorrection = useCallback((word: string): string | null => {
    const token = normalizeToken(word);
    if (!token) return null;
    if (ignoreSet.has(token)) return null;

    const correction = correctionMap.get(token);
    if (!correction) return null;

    if (word === word.toUpperCase()) {
      return correction.toUpperCase();
    }
    if (word[0] && word[0] === word[0].toUpperCase()) {
      return correction.charAt(0).toUpperCase() + correction.slice(1);
    }
    return correction;
  }, [correctionMap, ignoreSet]);

  const recordUsage = useCallback((wrong: string) => {
    const wrongToken = normalizeToken(wrong);

    setLocalDictionary(prev => {
      const updated = prev.corrections.map(c =>
        normalizeToken(c.wrong) === wrongToken
          ? { ...c, usageCount: c.usageCount + 1 }
          : c
      );
      return { ...prev, corrections: updated };
    });

    const apiId = apiIdMap.get(wrongToken);
    if (apiId) {
      recordUsageMutation.mutate(apiId);
    }
  }, [apiIdMap, recordUsageMutation]);

  const exportDictionary = useCallback(() => {
    return JSON.stringify({
      ...localDictionary,
      corrections,
      ignores: Array.from(ignoreSet),
    }, null, 2);
  }, [localDictionary, corrections, ignoreSet]);

  const importDictionary = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as Partial<SpellDictionary>;
      if (parsed.corrections && Array.isArray(parsed.corrections)) {
        setLocalDictionary({
          version: 2,
          corrections: parsed.corrections,
          ignores: Array.isArray(parsed.ignores) ? parsed.ignores.map(normalizeToken).filter(Boolean) : [],
        });
        return true;
      }
    } catch (e) {
      console.error('Failed to import dictionary:', e);
    }
    return false;
  }, []);

  return {
    dictionary: {
      ...localDictionary,
      corrections,
      ignores: Array.from(ignoreSet),
    },
    isLoaded: isLoaded && !apiFailed,
    corrections,
    addCorrection: addReplacement,
    addReplacement,
    addIgnore,
    isIgnored,
    removeCorrection,
    getCorrection,
    recordUsage,
    exportDictionary,
    importDictionary,
  };
}

export default useSpellDictionary;
