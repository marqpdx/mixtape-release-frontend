// src/components/groups/writing/GroupWriteWrapper.tsx
/**
 * DEPRECATED: Use WritingEditorWrapper instead
 * This is a thin wrapper for backward compatibility
 */

'use client';

import { WritingKind, WritingPiece } from '@/types/writingTypes';
import WritingEditorWrapper from '@components/writing/WritingEditorWrapper';
// import type { WritingPiece, WritingKind } from '@content/writingTypes';

interface GroupWriteWrapperProps {
  groupSlug: string;
  groupId: string;
  groupName?: string;
  writingKind?: WritingKind;
  pieceSlug?: string;
  pieceId?: string;
  onPublished?: (piece: WritingPiece) => void;
  onSaved?: (piece: WritingPiece) => void;
}

/**
 * Backward-compatible wrapper for group writing
 * @deprecated Use WritingEditorWrapper directly with sponsor config
 */
export default function GroupWriteWrapper({
  groupSlug,
  groupId,
  groupName,
  writingKind = 'post',
  pieceId,
  onPublished,
  onSaved,
}: GroupWriteWrapperProps) {
  return (
    <WritingEditorWrapper
      sponsor={{
        type: 'group',
        id: groupId,
        slug: groupSlug,
        displayName: groupName || groupSlug,
      }}
      writingKind={writingKind}
      pieceId={pieceId}
      onPublished={onPublished}
      onSaved={onSaved}
    />
  );
}