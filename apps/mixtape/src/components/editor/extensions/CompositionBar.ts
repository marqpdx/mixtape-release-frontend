// extensions/CompositionBar.ts
//
// TipTap extension that derives segment data from segmentBoundary nodes
// in the document. Emits segment info via a callback for the
// CompositionBarPanel to render as colored bands on the right edge.

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Node as PmNode } from '@tiptap/pm/model';

export interface CompositionSegment {
  segmentId: string;
  artifactType: string;
  artifactId: string;
  title: string | null;
  isAnchorReturn: boolean;
  /** Approximate line count for proportional height */
  lineCount: number;
  /** Position in the document (for scroll-to) */
  startPos: number;
  endPos: number;
}

export interface CompositionBarOptions {
  anchorArtifactType?: string;
  anchorArtifactId?: string;
  onSegmentsChange?: (segments: CompositionSegment[]) => void;
}

export const compositionBarPluginKey = new PluginKey('compositionBar');

function deriveSegments(
  doc: PmNode,
  anchorType?: string,
  anchorId?: string
): CompositionSegment[] {
  const segments: CompositionSegment[] = [];
  const boundaries: Array<{
    pos: number;
    attrs: {
      segmentId: string;
      artifactType: string;
      artifactId: string;
      isAnchorReturn: boolean;
      title: string | null;
    };
  }> = [];

  // Walk the doc to find boundary positions
  let pos = 0;
  doc.forEach((node: { type: { name: string }; attrs: Record<string, unknown>; nodeSize: number }) => {
    if (node.type.name === 'segmentBoundary') {
      boundaries.push({
        pos,
        attrs: node.attrs as typeof boundaries[0]['attrs'],
      });
    }
    pos += node.nodeSize;
  });

  if (boundaries.length === 0) return [];

  // First segment: doc start to first boundary = anchor
  const anchorSegmentId = 'anchor-segment';
  segments.push({
    segmentId: anchorSegmentId,
    artifactType: anchorType || 'writingpiece',
    artifactId: anchorId || '',
    title: null,
    isAnchorReturn: false,
    lineCount: Math.max(1, boundaries[0].pos),
    startPos: 0,
    endPos: boundaries[0].pos,
  });

  // Segments between boundaries
  for (let i = 0; i < boundaries.length; i++) {
    const boundary = boundaries[i];
    const nextBoundary = boundaries[i + 1];
    const endPos = nextBoundary ? nextBoundary.pos : pos;

    segments.push({
      segmentId: boundary.attrs.segmentId,
      artifactType: boundary.attrs.isAnchorReturn
        ? (anchorType || 'writingpiece')
        : boundary.attrs.artifactType,
      artifactId: boundary.attrs.isAnchorReturn
        ? (anchorId || '')
        : boundary.attrs.artifactId,
      title: boundary.attrs.title,
      isAnchorReturn: boundary.attrs.isAnchorReturn,
      lineCount: Math.max(1, endPos - boundary.pos),
      startPos: boundary.pos,
      endPos,
    });
  }

  return segments;
}

export const CompositionBar = Extension.create<CompositionBarOptions>({
  name: 'compositionBar',

  addOptions() {
    return {
      anchorArtifactType: undefined,
      anchorArtifactId: undefined,
      onSegmentsChange: undefined,
    };
  },

  addProseMirrorPlugins() {
    const opts = this.options;

    return [
      new Plugin({
        key: compositionBarPluginKey,
        view: () => ({
          update: (view) => {
            if (!opts.onSegmentsChange) return;
            const segments = deriveSegments(
              view.state.doc,
              opts.anchorArtifactType,
              opts.anchorArtifactId
            );
            opts.onSegmentsChange(segments);
          },
        }),
      }),
    ];
  },
});
