'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Text,
  Button,
  HStack,
  VStack,
  Badge,
  Spinner,
  Textarea,
} from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
} from '@components/ui/dialog';
import { useCanonDiff, useApproveCanon } from '@mixtape/api/hooks/puddlejump/usePuddlejump';
import { diffLines } from 'diff';

interface CanonApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  sourceFileId: string;
  versionId: string;
  filename: string;
  onApproved?: () => void;
}

export default function CanonApprovalDialog({
  open,
  onClose,
  sourceFileId,
  versionId,
  filename,
  onApproved,
}: CanonApprovalDialogProps) {
  const [notes, setNotes] = useState('');
  const { diff, isLoading: diffLoading } = useCanonDiff(open ? sourceFileId : null);

  const approveMutation = useApproveCanon({
    onSuccess: () => {
      onClose();
      onApproved?.();
    },
  });

  const handleApprove = () => {
    approveMutation.mutate({
      sourceFileId,
      version_id: versionId,
      notes,
    });
  };

  // Compute line-level diff
  const diffResult = useMemo(() => {
    if (!diff) return [];
    const prev = diff.previous_content ?? '';
    const proposed = diff.proposed_content ?? '';
    return diffLines(prev, proposed);
  }, [diff]);

  const addedBg = useColorModeValue('green.50', 'rgba(34,197,94,0.1)');
  const removedBg = useColorModeValue('red.50', 'rgba(239,68,68,0.1)');
  const addedColor = useColorModeValue('green.700', 'green.300');
  const removedColor = useColorModeValue('red.700', 'red.300');
  const codeBg = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <DialogRoot open={open} onOpenChange={(d) => { if (!d.open) onClose(); }} size="xl">
      <DialogContent maxW="900px" maxH="80vh">
        <DialogHeader>
          <DialogTitle>
            <HStack gap={2}>
              <Text>Canon Approval</Text>
              <Badge size="sm" colorPalette="blue">{filename}</Badge>
            </HStack>
          </DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody overflowY="auto">
          {diffLoading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="md" />
              <Text fontSize="sm" mt={2}>Loading diff...</Text>
            </Box>
          ) : (
            <VStack gap={4} align="stretch">
              <HStack gap={2} fontSize="sm">
                {diff?.previous_version_number != null ? (
                  <Text>
                    Comparing v{diff.previous_version_number} (current Canon) with v{diff.proposed_version_number} (proposed)
                  </Text>
                ) : (
                  <Text>First canonization — full document shown as addition</Text>
                )}
              </HStack>

              <Box
                bg={codeBg}
                borderWidth={1}
                borderColor={borderColor}
                borderRadius="md"
                overflow="auto"
                maxH="400px"
                fontFamily="mono"
                fontSize="xs"
                p={3}
              >
                {diffResult.map((part, i) => (
                  <Box
                    key={i}
                    bg={part.added ? addedBg : part.removed ? removedBg : undefined}
                    color={part.added ? addedColor : part.removed ? removedColor : undefined}
                    whiteSpace="pre-wrap"
                    px={2}
                    py={0.5}
                  >
                    {part.value}
                  </Box>
                ))}
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Approval Notes (optional)
                </Text>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this approval..."
                  size="sm"
                  rows={2}
                />
              </Box>
            </VStack>
          )}
        </DialogBody>

        <DialogFooter>
          <HStack gap={2}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorPalette="green"
              onClick={handleApprove}
              loading={approveMutation.isPending}
              disabled={diffLoading}
            >
              Approve as Canon
            </Button>
          </HStack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
