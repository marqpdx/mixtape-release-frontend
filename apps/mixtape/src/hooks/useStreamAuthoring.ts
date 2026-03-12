// hooks/useStreamAuthoring.ts
//
// Orchestration hook for artifact stream authoring.
// Manages work session lifecycle, slash command handling,
// autosave to WritingSurfaceDocument, and checkpoint extraction.
//
// Returns a `streamMode` prop object ready for TipTapEditor,
// or null when not in stream mode.

import { useState, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import type { JSONContent } from "@tiptap/react";
import {
  useCreateWorkSession,
  useAddSessionItem,
  useSaveSurfaceDocument,
  useCheckpoint,
  useEndWorkSession,
} from "@mixtape/api/hooks/worksessions/useWorkSession";
import type { SegmentBoundaryAttrs } from "@/components/editor/extensions/SegmentBoundary";

// ── Types ──

interface AnchorArtifact {
  contentTypeModel: string; // e.g. "writingpiece"
  objectId: string;
}

interface CreatedArtifact {
  id: string;
  contentTypeModel: string;
}

interface UseStreamAuthoringOptions {
  anchor: AnchorArtifact;
  createArtifact: (
    type: string,
    title?: string
  ) => Promise<CreatedArtifact>;
  onMergeArtifact?: (
    sourceType: string,
    sourceId: string,
    targetType: string,
    targetId: string
  ) => Promise<void>;
  editorRef: React.RefObject<{ getJSON: () => JSONContent } | null>;
  checkpointInterval?: number; // Save N times between checkpoints
}

interface StreamModeProps {
  anchorArtifactType: string;
  anchorArtifactId: string;
  onNewArtifact: (type: string, title?: string) => Promise<void>;
  onRenew: () => void;
  onMerge: (attrs: SegmentBoundaryAttrs) => Promise<void>;
}

interface UseStreamAuthoringReturn {
  streamMode: StreamModeProps | null;
  isActive: boolean;
  sessionId: string | null;
  saveCount: number;
  activateStream: () => void;
  deactivateStream: () => Promise<void>;
  saveSurface: () => void;
}

// ── Hook ──

export function useStreamAuthoring({
  anchor,
  createArtifact,
  onMergeArtifact,
  editorRef,
  checkpointInterval = 5,
}: UseStreamAuthoringOptions): UseStreamAuthoringReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const saveCountRef = useRef(0);
  const [saveCount, setSaveCount] = useState(0);
  const clientSessionId = useRef(uuidv4());

  const createSession = useCreateWorkSession();
  const endSession = useEndWorkSession();

  // These hooks need a stable sessionId — they'll be called conditionally
  const addItem = useAddSessionItem(sessionId ?? "");
  const saveSurface = useSaveSurfaceDocument(sessionId ?? "");
  const checkpoint = useCheckpoint(sessionId ?? "");

  // Ensure session exists, creating lazily on first /new
  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId;

    const session = await createSession.mutateAsync({
      anchor_content_type_model: anchor.contentTypeModel,
      anchor_object_id: anchor.objectId,
    });

    setSessionId(session.id);
    setIsActive(true);
    return session.id;
  }, [sessionId, createSession, anchor]);

  // Save surface document
  const doSaveSurface = useCallback(
    (sid: string) => {
      const editor = editorRef.current;
      if (!editor || !sid) return;

      const bodyJson = editor.getJSON();
      saveSurface.mutate({
        body_json: bodyJson as Record<string, unknown>,
        client_session_id: clientSessionId.current,
      });

      saveCountRef.current += 1;
      setSaveCount(saveCountRef.current);

      // Periodic checkpoint
      if (saveCountRef.current % checkpointInterval === 0) {
        checkpoint.mutate();
      }
    },
    [editorRef, saveSurface, checkpoint, checkpointInterval]
  );

  // Handle /new command
  const handleNewArtifact = useCallback(
    async (type: string, title?: string) => {
      const sid = await ensureSession();

      // Create the artifact via the caller-provided function
      const artifact = await createArtifact(type, title);

      // Register as a session item
      await addItem.mutateAsync({
        content_type_model: artifact.contentTypeModel,
        object_id: artifact.id,
      });

      // Insert boundary node into editor
      const editor = editorRef.current;
      if (editor) {
        const segmentId = uuidv4();
        // The editor command is typed via the SegmentBoundary extension
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editor as any).commands?.insertSegmentBoundary?.({
          segmentId,
          artifactType: type,
          artifactId: artifact.id,
          isAnchorReturn: false,
          title: title ?? null,
        });
      }

      // Save surface after inserting boundary
      void doSaveSurface(sid);
    },
    [ensureSession, createArtifact, addItem, editorRef, doSaveSurface]
  );

  // Handle /renew command
  const handleRenew = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      const segmentId = uuidv4();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor as any).commands?.insertSegmentBoundary?.({
        segmentId,
        artifactType: anchor.contentTypeModel,
        artifactId: anchor.objectId,
        isAnchorReturn: true,
        title: null,
      });
    }

    if (sessionId) {
      void doSaveSurface(sessionId);
      void checkpoint.mutateAsync();
    }
  }, [editorRef, anchor, sessionId, checkpoint, doSaveSurface]);

  // Handle merge (boundary deletion confirmed)
  const handleMerge = useCallback(
    async (attrs: SegmentBoundaryAttrs) => {
      if (!sessionId) return;

      if (onMergeArtifact) {
        await onMergeArtifact(
          attrs.artifactType,
          attrs.artifactId,
          anchor.contentTypeModel,
          anchor.objectId
        );
      }

      void doSaveSurface(sessionId);
      void checkpoint.mutateAsync();
    },
    [sessionId, onMergeArtifact, anchor, checkpoint, doSaveSurface]
  );

  // Public save trigger (called by autosave)
  const triggerSaveSurface = useCallback(() => {
    if (sessionId) {
      doSaveSurface(sessionId);
    }
  }, [sessionId, doSaveSurface]);

  // Activate stream mode (if session doesn't exist yet, it'll be created lazily)
  const activateStream = useCallback(() => {
    setIsActive(true);
  }, []);

  // Deactivate: run final checkpoint, end session
  const deactivateStream = useCallback(async () => {
    if (sessionId) {
      // Final save + checkpoint
      doSaveSurface(sessionId);
      await checkpoint.mutateAsync();
      await endSession.mutateAsync(sessionId);
    }
    setIsActive(false);
    setSessionId(null);
    saveCountRef.current = 0;
    setSaveCount(0);
  }, [sessionId, doSaveSurface, checkpoint, endSession]);

  // Build the streamMode prop for TipTapEditor
  const streamMode = useMemo<StreamModeProps | null>(() => {
    if (!isActive) return null;

    return {
      anchorArtifactType: anchor.contentTypeModel,
      anchorArtifactId: anchor.objectId,
      onNewArtifact: handleNewArtifact,
      onRenew: handleRenew,
      onMerge: handleMerge,
    };
  }, [isActive, anchor, handleNewArtifact, handleRenew, handleMerge]);

  return {
    streamMode,
    isActive,
    sessionId,
    saveCount,
    activateStream,
    deactivateStream,
    saveSurface: triggerSaveSurface,
  };
}
