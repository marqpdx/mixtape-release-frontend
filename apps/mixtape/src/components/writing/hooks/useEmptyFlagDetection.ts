// src/components/write/hooks/useEmptyFlagDetection.ts

import { useCallback, useRef, useState } from 'react';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';

interface UseEmptyFlagDetectionProps {
  pieceId: string;
  initialPiece: any;
  setTitle: (title: string) => void;
  setDocJSON: (doc: any) => void;
  setExcerpt: (excerpt: string) => void;
  titleRef: React.RefObject<string>;
  docJSONRef: React.RefObject<any>;
  excerptRef: React.RefObject<string>;
  schedule: (data: any) => void;
  onEmptyFlagCleared?: () => void;
}

export function useEmptyFlagDetection({
  pieceId,
  initialPiece,
  setTitle,
  setDocJSON,
  setExcerpt,
  titleRef,
  docJSONRef,
  excerptRef,
  schedule,
  onEmptyFlagCleared
}: UseEmptyFlagDetectionProps) {

  // Track empty state
  const [wasEmpty, setWasEmpty] = useState(initialPiece?.is_empty || false);
  const [hasRealContent, setHasRealContent] = useState(!initialPiece?.is_empty);
  const emptyFlagCleared = useRef(false);

  // Helper to check if there is any meaningful content
  const checkHasContent = useCallback((title: string, doc: any, excerpt: string) => {
    const hasTitle = !!title && title.trim().length > 0;
    const hasExcerpt = !!excerpt && excerpt.trim().length > 0;

    let hasDocContent = false;
    if (doc && Array.isArray(doc.content) && doc.content.length > 0) {
      hasDocContent = doc.content.some((node: any) => {
        if (node.type === 'paragraph') {
          if (!node.content || !Array.isArray(node.content) || node.content.length === 0) {
            return false;
          }
          return node.content.some((textNode: any) =>
            textNode.type === 'text' &&
            textNode.text &&
            textNode.text.trim().length > 0
          );
        }
        return node.type !== 'paragraph';
      });
    }

    return hasTitle || hasExcerpt || hasDocContent;
  }, []);

  // Clear empty flag when real content is detected
  const clearEmptyFlag = useCallback(async () => {
    if (emptyFlagCleared.current || !wasEmpty) return;

    try {
      emptyFlagCleared.current = true;
      console.log('000 🎯 Clearing empty flag for piece:', pieceId);

      await axiosInstance.patch(`/api/writing/pieces/${pieceId}/clear-empty`, {
        is_empty: false
      });

      setWasEmpty(false);
      setHasRealContent(true);

      // Notify parent to refetch drafts list
      onEmptyFlagCleared?.();

      console.log('000 ✅ Empty flag cleared successfully');
    } catch (e: any) {
      console.error('000 ❌ Failed to clear empty flag:', e);
      emptyFlagCleared.current = false; // Reset on failure
    }
  }, [pieceId, wasEmpty, onEmptyFlagCleared]);

  // Enhanced change handlers that detect real content
  const onTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);

    const data = {
      title: newTitle,
      body_json: docJSONRef.current,
      excerpt: excerptRef.current
    };

    // Check if this change introduces real content
    if (wasEmpty && !hasRealContent && checkHasContent(data.title, data.body_json, data.excerpt)) {
      clearEmptyFlag();
    }

    schedule(data);
  }, [setTitle, schedule, wasEmpty, hasRealContent, checkHasContent, clearEmptyFlag, docJSONRef, excerptRef]);

  const onDocChange = useCallback((newDoc: any) => {
    setDocJSON(newDoc);

    const data = {
      title: titleRef.current,
      body_json: newDoc,
      excerpt: excerptRef.current
    };

    // Check if this change introduces real content
    if (wasEmpty && !hasRealContent && checkHasContent(data.title, data.body_json, data.excerpt)) {
      clearEmptyFlag();
    }

    schedule(data);
  }, [setDocJSON, schedule, wasEmpty, hasRealContent, checkHasContent, clearEmptyFlag, titleRef, excerptRef]);

  const onExcerptChange = useCallback((newExcerpt: string) => {
    setExcerpt(newExcerpt);

    const data = {
      title: titleRef.current,
      body_json: docJSONRef.current,
      excerpt: newExcerpt
    };

    // Check if this change introduces real content
    if (wasEmpty && !hasRealContent && checkHasContent(data.title, data.body_json, data.excerpt)) {
      clearEmptyFlag();
    }

    schedule(data);
  }, [setExcerpt, schedule, wasEmpty, hasRealContent, checkHasContent, clearEmptyFlag, titleRef, docJSONRef]);

  return {
    onTitleChange,
    onDocChange,
    onExcerptChange,
    wasEmpty,
    hasRealContent
  };
}