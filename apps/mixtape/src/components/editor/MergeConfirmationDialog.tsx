// MergeConfirmationDialog.tsx
//
// Confirmation dialog shown when a writer deletes a segment boundary node.
// Confirms merge of the emitted artifact's content into the surrounding artifact.

'use client';

import { Box, Text, Button, HStack } from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
} from '@components/ui/dialog';
import type { SegmentBoundaryAttrs } from './extensions/SegmentBoundary';

const TYPE_LABELS: Record<string, string> = {
  writingpiece: 'Writing Piece',
  event: 'Event',
  course: 'Course',
  seed: 'Seed',
};

interface MergeConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  boundaryAttrs: SegmentBoundaryAttrs | null;
}

export function MergeConfirmationDialog({
  open,
  onClose,
  onConfirm,
  boundaryAttrs,
}: MergeConfirmationDialogProps) {
  if (!boundaryAttrs) return null;

  const typeLabel = TYPE_LABELS[boundaryAttrs.artifactType] || boundaryAttrs.artifactType;
  const title = boundaryAttrs.title;

  return (
    <DialogRoot open={open} onOpenChange={(e) => !e.open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove segment boundary?</DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger />

        <DialogBody>
          <Box>
            <Text mb={3}>
              This will remove the <strong>{typeLabel}</strong>
              {title ? ` "${title}"` : ''} boundary and merge its content into
              the surrounding artifact.
            </Text>
            <Text fontSize="sm" color="fg.muted">
              The {typeLabel.toLowerCase()} will be soft-deleted and its content
              absorbed into the adjacent segment. This action can be undone with
              Ctrl+Z before saving.
            </Text>
          </Box>
        </DialogBody>

        <DialogFooter>
          <HStack gap={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorPalette="red"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Remove & Merge
            </Button>
          </HStack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
