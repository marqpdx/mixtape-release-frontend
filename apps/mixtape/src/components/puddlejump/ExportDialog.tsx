'use client';

import { useState } from 'react';
import {
  Box,
  Text,
  Button,
  HStack,
  VStack,
  Checkbox,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
} from '@components/ui/dialog';
import { usePuddlejumpExport } from '@mixtape/api/hooks/puddlejump/usePuddlejump';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  libraryId: string;
  libraryTitle: string;
}

export default function ExportDialog({
  open,
  onClose,
  libraryId,
  libraryTitle,
}: ExportDialogProps) {
  const [includeNonCanonical, setIncludeNonCanonical] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const exportMutation = usePuddlejumpExport();

  const handleExport = async () => {
    try {
      const blob = await exportMutation.mutateAsync({
        libraryId,
        includeNonCanonical,
      });

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${libraryTitle.toLowerCase().replace(/\s+/g, '-')}-export.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloaded(true);
    } catch {
      // Error handled by mutation state
    }
  };

  const handleClose = () => {
    setDownloaded(false);
    setIncludeNonCanonical(false);
    onClose();
  };

  return (
    <DialogRoot open={open} onOpenChange={(d) => { if (!d.open) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Puddlejump Bundle</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          <VStack gap={4} align="stretch">
            <Text fontSize="sm">
              Export <strong>{libraryTitle}</strong> as a portable Puddlejump bundle (.zip).
            </Text>

            <Box>
              <Checkbox.Root
                checked={includeNonCanonical}
                onCheckedChange={(d) => setIncludeNonCanonical(!!d.checked)}
              >
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Label>
                  <Text fontSize="sm">Include non-canonical files</Text>
                </Checkbox.Label>
              </Checkbox.Root>
              <Text fontSize="xs" color="gray.500" ml={6}>
                By default, only Canon-approved files are exported.
              </Text>
            </Box>

            {downloaded && (
              <Box bg="green.50" borderRadius="md" p={3}>
                <Text fontSize="sm" color="green.700">
                  Bundle downloaded successfully.
                </Text>
              </Box>
            )}

            {exportMutation.isError && (
              <Box bg="red.50" borderRadius="md" p={3}>
                <Text fontSize="sm" color="red.700">
                  Export failed. Please try again.
                </Text>
              </Box>
            )}
          </VStack>
        </DialogBody>

        <DialogFooter>
          <HStack gap={2}>
            <Button variant="ghost" onClick={handleClose}>
              {downloaded ? 'Done' : 'Cancel'}
            </Button>
            {!downloaded && (
              <Button
                colorPalette="blue"
                onClick={handleExport}
                loading={exportMutation.isPending}
              >
                Export Bundle
              </Button>
            )}
          </HStack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
