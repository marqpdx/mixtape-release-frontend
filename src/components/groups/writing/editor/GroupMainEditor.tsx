// src/components/groups/writing/editor/GroupMainEditor.tsx
'use client';

import TipTapEditor from '@components/editor/TipTapEditor';
import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

type Props = {
  initialDoc: any;
  onChange: (doc: any) => void;
  placeholder?: string;
  onSelectionChange?: (sel: any) => void;
  collab?: any;
  autoFocus?: boolean;
  onBackgroundSummaryChange?: (info: {
    summary: string; isGenerating: boolean; isPending: boolean; error: any;
    wordCount: number; forceUpdate: () => void;
  }) => void;
};

export type GroupMainEditorHandle = {
  getSelection: () => { text: string; from: number; to: number };
  getDoc: () => any;
  setDoc: (doc: any) => void;
};

const GroupMainEditor = forwardRef<GroupMainEditorHandle, Props>(({
  initialDoc,
  onChange,
  placeholder = 'Start writing…',
  onSelectionChange,
  collab,
  autoFocus,
  onBackgroundSummaryChange,
}, ref) => {
  const innerRef = useRef<any>(null);
  const lastDocRef = useRef<any>(initialDoc);

  useEffect(() => { lastDocRef.current = initialDoc; }, [initialDoc]);

  useImperativeHandle(ref, () => ({
    getSelection: () => {
      const ed: any = innerRef.current;
      const from = ed?.editor?.state?.selection?.from ?? 0;
      const to   = ed?.editor?.state?.selection?.to   ?? 0;
      return { text: '', from, to };
    },
    getDoc: () => innerRef.current?.editor?.getJSON?.() ?? lastDocRef.current,
    setDoc: (doc: any) => innerRef.current?.editor?.commands?.setContent?.(doc),
  }), []);

  useEffect(() => {
    if (!autoFocus) return;
    innerRef.current?.editor?.commands?.focus?.('end');
  }, [autoFocus]);

  return (
    <TipTapEditor
      ref={innerRef}
      initialContent={initialDoc}
      onContentChange={(doc: any) => {
        lastDocRef.current = doc;
        onChange(doc);
      }}
      placeholder={placeholder}
      collab={collab}
    />
  );
});

export default GroupMainEditor;
