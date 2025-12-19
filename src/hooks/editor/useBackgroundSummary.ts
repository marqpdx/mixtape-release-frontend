// src/hooks/editor/useBackgroundSummary.ts - NUCLEAR REWRITE with Singleton Protection

import { useCallback, useEffect, useRef, useState } from "react";
// import type { Editor } from "@tiptap/react";
// import { normalizeTipTapToPlaintext, fetchSummary } from "lib/inkwell/inkwellApi";
import { Editor } from "@tiptap/react";
import { fetchSummary, normalizeTipTapToPlaintext } from "@/lib/inkwell/inkwellApi";

interface BackgroundSummaryOptions {
  enabled?: boolean;
  debounceMs?: number;
  minWordsToSummarize?: number;
  summaryWords?: number;
}

// SINGLETON: Global state to prevent multiple concurrent requests
class SummaryManager {
  private static instance: SummaryManager;
  private currentRequest: AbortController | null = null;
  private isGenerating = false;
  private lastHash = '';
  private currentSummary = '';
  private wordCount = 0;
  private pendingTimeout: NodeJS.Timeout | null = null;

  static getInstance(): SummaryManager {
    if (!SummaryManager.instance) {
      SummaryManager.instance = new SummaryManager();
    }
    return SummaryManager.instance;
  }

  async generateSummary(
    editor: Editor,
    options: { minWords: number; summaryWords: number }
  ): Promise<{ summary: string; wordCount: number }> {
    // HARD STOP: Only one request at a time
    if (this.isGenerating) {
      console.log('🛑 Summary already generating, skipping...');
      return { summary: this.currentSummary, wordCount: this.wordCount };
    }

    // Cancel any existing request
    if (this.currentRequest) {
      this.currentRequest.abort();
    }

    try {
      this.isGenerating = true;
      this.currentRequest = new AbortController();

      // Get text using simple getText() first for word count
      const simpleText = editor.getText() || '';
      const simpleWordCount = simpleText.trim() ? simpleText.trim().split(/\s+/).length : 0;

      // Update word count immediately
      this.wordCount = simpleWordCount;

      // Early exit if not enough words
      if (simpleWordCount < options.minWords) {
        this.currentSummary = '';
        return { summary: '', wordCount: simpleWordCount };
      }

      // Create content hash from simple text
      const contentHash = this.createHash(simpleText);

      // If content hasn't changed, return cached summary
      if (contentHash === this.lastHash && this.currentSummary) {
        return { summary: this.currentSummary, wordCount: simpleWordCount };
      }

      console.log('🔄 Generating new summary...');

      // Only call normalize API if we really need a new summary
      const json = editor.getJSON();
      const { plaintext } = await normalizeTipTapToPlaintext(json, {
        signal: this.currentRequest.signal
      });

      if (!plaintext?.trim()) {
        this.currentSummary = '';
        this.lastHash = '';
        return { summary: '', wordCount: 0 };
      }

      // Final word count from normalized text
      const finalWordCount = plaintext.trim().split(/\s+/).length;
      this.wordCount = finalWordCount;

      if (finalWordCount < options.minWords) {
        this.currentSummary = '';
        return { summary: '', wordCount: finalWordCount };
      }

      // Generate summary
      const summary = await fetchSummary(plaintext, options.summaryWords, "neutral", {
        signal: this.currentRequest.signal
      });

      if (summary?.trim()) {
        this.currentSummary = summary.trim();
        this.lastHash = contentHash;
        console.log('✅ Summary generated successfully');
      }

      return { summary: this.currentSummary, wordCount: finalWordCount };

    } catch (error: any) {
      // Handle both AbortError (fetch API) and CanceledError (axios)
      if (error.name === 'AbortError' || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('🛑 Summary request cancelled');
      } else {
        console.error('❌ Summary generation failed:', error);
      }
      return { summary: this.currentSummary, wordCount: this.wordCount };
    } finally {
      this.isGenerating = false;
      this.currentRequest = null;
    }
  }

  scheduleGeneration(
    editor: Editor,
    options: { minWords: number; summaryWords: number },
    debounceMs: number,
    callback: (result: { summary: string; wordCount: number }) => void,
    onScheduled?: () => void,
    onStarting?: () => void
  ) {
    // Clear any pending generation
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
    }

    // Notify that we've scheduled (but not started) generation
    if (onScheduled) onScheduled();

    // Schedule new generation
    this.pendingTimeout = setTimeout(async () => {
      // NOW we're actually starting generation
      if (onStarting) onStarting();
      const result = await this.generateSummary(editor, options);
      callback(result);
      this.pendingTimeout = null;
    }, debounceMs);
  }

  forceGenerate(
    editor: Editor,
    options: { minWords: number; summaryWords: number },
    callback: (result: { summary: string; wordCount: number }) => void
  ) {
    // Clear any pending generation
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    // Force immediate generation
    this.generateSummary(editor, options).then(callback);
  }

  clearSummary() {
    if (this.currentRequest) {
      this.currentRequest.abort();
    }
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
    this.currentSummary = '';
    this.lastHash = '';
    this.wordCount = 0;
    this.isGenerating = false;
  }

  getStatus() {
    return {
      isGenerating: this.isGenerating,
      isPending: this.pendingTimeout !== null,
      summary: this.currentSummary,
      wordCount: this.wordCount
    };
  }

  private createHash(text: string): string {
    const trimmed = text.trim();
    if (trimmed.length < 10) return '';
    const wordCount = trimmed.split(/\s+/).length;
    return `${trimmed.length}-${wordCount}-${trimmed.substring(0, 50)}`;
  }
}

export function useBackgroundSummary(
  editor: Editor | null,
  options: BackgroundSummaryOptions = {}
) {
  const {
    enabled = true,
    debounceMs = 11000,
    minWordsToSummarize = 50,
    summaryWords = 40,
  } = options;

  const [summary, setSummary] = useState<string>('');
  const [wordCount, setWordCount] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summaryManager = useRef(SummaryManager.getInstance());
  const lastEditorRef = useRef<Editor | null>(null);

  // Update local state from manager
  const updateFromManager = useCallback(() => {
    const status = summaryManager.current.getStatus();
    setSummary(status.summary);
    setWordCount(status.wordCount);
    setIsGenerating(status.isGenerating);
    setIsPending(status.isPending);
  }, []);

  // Handle summary result
  const handleSummaryResult = useCallback((result: { summary: string; wordCount: number }) => {
    setSummary(result.summary);
    setWordCount(result.wordCount);
    setIsGenerating(false);
    setIsPending(false);
    setError(null);
  }, []);

  // Force update function
  const forceUpdate = useCallback(() => {
    if (!editor || !enabled) return;

    console.log('🚀 Force updating summary...');
    setIsGenerating(true);
    setIsPending(false);
    setError(null);

    summaryManager.current.forceGenerate(
      editor,
      { minWords: minWordsToSummarize, summaryWords },
      handleSummaryResult
    );
  }, [editor, enabled, minWordsToSummarize, summaryWords, handleSummaryResult]);

  // Clear summary function
  const clearSummary = useCallback(() => {
    summaryManager.current.clearSummary();
    setSummary('');
    setWordCount(0);
    setIsGenerating(false);
    setIsPending(false);
    setError(null);
  }, []);

  // Set up editor listener - SIMPLIFIED
  useEffect(() => {
    if (!editor || !enabled) {
      return;
    }

    // Clean up previous editor if different
    if (lastEditorRef.current && lastEditorRef.current !== editor) {
      console.log('🔄 Editor changed, clearing summary state');
      summaryManager.current.clearSummary();
    }
    lastEditorRef.current = editor;

    let updateCounter = 0;
    const handler = () => {
      updateCounter++;
      console.log(`📝 Editor update #${updateCounter} - scheduling generation`);

      // DON'T set isGenerating here - that happens when generation actually starts
      setIsPending(true);
      setError(null);

      summaryManager.current.scheduleGeneration(
        editor,
        { minWords: minWordsToSummarize, summaryWords },
        debounceMs,
        handleSummaryResult,
        () => {
          // onScheduled - just scheduled, not started yet
          console.log('⏰ Summary generation scheduled');
        },
        () => {
          // onStarting - now actually starting generation
          console.log('🚀 Summary generation starting...');
          setIsGenerating(true);
          setIsPending(false);
        }
      );
    };

    // Initial word count calculation
    const initialText = editor.getText() || '';
    const initialWordCount = initialText.trim() ? initialText.trim().split(/\s+/).length : 0;
    setWordCount(initialWordCount);

    // Listen for updates
    editor.on("update", handler);

    return () => {
      console.log('🧹 Cleaning up editor listener');
      editor.off("update", handler);
    };
  }, [editor, enabled, debounceMs, minWordsToSummarize, summaryWords, handleSummaryResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, clearing summary');
      summaryManager.current.clearSummary();
    };
  }, []);

  return {
    summary,
    isGenerating,
    isPending,
    error,
    forceUpdate,
    clearSummary,
    wordCount,
  };
}
