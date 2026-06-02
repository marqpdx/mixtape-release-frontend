// components/crossroads/ComposerContext.tsx

'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export interface ComposerDraft {
  text: string;
  imageUrl: string | null;
  kind: 'text' | 'image';
}

interface ComposerContextValue {
  draft: ComposerDraft;
  setDraft: (draft: ComposerDraft) => void;
}

const ComposerContext = createContext<ComposerContextValue | null>(null);

export function ComposerProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<ComposerDraft>({
    text: '',
    imageUrl: null,
    kind: 'text',
  });

  return (
    <ComposerContext.Provider value={{ draft, setDraft }}>
      {children}
    </ComposerContext.Provider>
  );
}

/**
 * Returns the draft context if inside a ComposerProvider, or null otherwise.
 * This lets Composer work both with and without the provider.
 */
export function useComposerDraft(): ComposerContextValue | null {
  return useContext(ComposerContext);
}
