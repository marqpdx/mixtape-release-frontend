// CompositionBarPanel.tsx
//
// Right-edge colored bands showing artifact segments in a composed
// writing session. Each band is proportional to the segment's content
// length. Click scrolls the editor to that segment.

import { Box } from '@chakra-ui/react';
import { Tooltip } from '@components/ui/tooltip';
import type { CompositionSegment } from './extensions/CompositionBar';
import type { Editor } from '@tiptap/core';

const TYPE_COLORS: Record<string, string> = {
  writingpiece: '#22c55e',
  event: '#a855f7',
  course: '#3b82f6',
  seed: '#f59e0b',
};

const TYPE_LABELS: Record<string, string> = {
  writingpiece: 'Writing',
  event: 'Event',
  course: 'Course',
  seed: 'Seed',
};

interface CompositionBarPanelProps {
  segments: CompositionSegment[];
  editor: Editor | null;
}

export function CompositionBarPanel({
  segments,
  editor,
}: CompositionBarPanelProps) {
  if (segments.length === 0) return null;

  const totalLines = segments.reduce((sum, s) => sum + s.lineCount, 0);
  const MIN_PERCENT = 10;
  const available = 100 - segments.length * MIN_PERCENT;

  const percentages = segments.map((s) => {
    const raw = (s.lineCount / totalLines) * available + MIN_PERCENT;
    return Math.max(MIN_PERCENT, raw);
  });

  // Normalize to 100%
  const sum = percentages.reduce((a, b) => a + b, 0);
  const normalized = percentages.map((p) => (p / sum) * 100);

  const handleClick = (segment: CompositionSegment) => {
    if (!editor) return;
    const midPos = Math.floor((segment.startPos + segment.endPos) / 2);
    editor.commands.focus();
    editor.commands.setTextSelection(midPos);

    // Scroll the selection into view
    const view = editor.view;
    const coords = view.coordsAtPos(midPos);
    const editorEl = view.dom.closest('.editor-content-prose');
    if (editorEl) {
      const rect = editorEl.getBoundingClientRect();
      const scrollTop = coords.top - rect.top - rect.height / 2;
      editorEl.scrollBy({ top: scrollTop, behavior: 'smooth' });
    }
  };

  return (
    <Box
      position="absolute"
      right="-20px"
      top="0"
      bottom="0"
      width="12px"
      display="flex"
      flexDirection="column"
      gap="2px"
      borderRadius="6px"
      overflow="hidden"
    >
      {segments.map((segment, i) => {
        const color = TYPE_COLORS[segment.artifactType] || TYPE_COLORS.writingpiece;
        const label = segment.isAnchorReturn
          ? 'Anchor (continued)'
          : `${TYPE_LABELS[segment.artifactType] || segment.artifactType}${segment.title ? ` - ${segment.title}` : ''}`;

        return (
          <Tooltip key={segment.segmentId} content={label} positioning={{ placement: 'left' }}>
            <Box
              flex={`${normalized[i]} 0 0`}
              bg={color}
              opacity={0.7}
              borderRadius="3px"
              cursor="pointer"
              transition="opacity 0.15s"
              _hover={{ opacity: 1 }}
              onClick={() => handleClick(segment)}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}
