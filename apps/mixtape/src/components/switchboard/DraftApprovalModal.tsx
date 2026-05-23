'use client';

import {
  Box,
  Button,
  Dialog,
  HStack,
  Text,
  VStack,
  Badge,
} from '@chakra-ui/react';
import type { DraftAsyncRequest } from '@mixtape/api/clients/switchboard/switchboardApi';

interface DraftApprovalModalProps {
  open: boolean;
  request: DraftAsyncRequest | null;
  onApproveLocal: () => void;
  onCancel: () => void;
}

export function DraftApprovalModal({
  open,
  request,
  onApproveLocal,
  onCancel,
}: DraftApprovalModalProps) {
  if (!request) return null;

  const preview = request.source_text.length > 280
    ? `${request.source_text.slice(0, 280)}…`
    : request.source_text;

  return (
    <Dialog.Root open={open} onOpenChange={(d) => { if (!d.open) onCancel(); }}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="480px">
          <Dialog.Header>
            <Dialog.Title>Review draft request</Dialog.Title>
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={4} align="stretch">
              <HStack gap={2} wrap="wrap">
                <Badge colorPalette="blue">{request.content_type}</Badge>
                <Badge colorPalette="gray">{request.tone ?? 'professional'}</Badge>
                <Badge colorPalette="gray">{request.target_length ?? 'standard'}</Badge>
              </HStack>

              <Box>
                <Text fontSize="xs" color="gray.500" mb={1} fontWeight="medium">
                  Source context
                </Text>
                <Box
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="gray.200"
                >
                  <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                    {preview}
                  </Text>
                </Box>
              </Box>

              <Box
                p={3}
                bg="blue.50"
                borderRadius="md"
                borderWidth="1px"
                borderColor="blue.200"
              >
                <Text fontSize="xs" color="blue.700">
                  This draft will be generated locally via Inkwell. No data leaves your server.
                </Text>
              </Box>

              <Box
                p={3}
                bg="gray.50"
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.200"
                opacity={0.6}
              >
                <HStack justify="space-between">
                  <Text fontSize="xs" color="gray.500">
                    Cloud generation — escalate to a cloud model for higher quality
                  </Text>
                  <Badge colorPalette="gray" variant="outline" fontSize="xs">
                    Phase 3
                  </Badge>
                </HStack>
              </Box>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <HStack gap={3}>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
              <Button colorPalette="blue" size="sm" onClick={onApproveLocal}>
                Generate (Local)
              </Button>
              <Button size="sm" disabled title="Cloud generation available in Phase 3">
                Generate (Cloud)
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
