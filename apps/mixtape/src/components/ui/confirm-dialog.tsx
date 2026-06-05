"use client";

import { Button, HStack, Text } from "@chakra-ui/react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogCloseTrigger,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  colorScheme?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  colorScheme = "red",
}: ConfirmDialogProps) {
  return (
    <DialogRoot
      open={open}
      onOpenChange={({ open: next }) => { if (!next) onClose(); }}
    >
      <DialogContent maxW="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogCloseTrigger onClick={onClose} />
        </DialogHeader>
        <DialogBody pb={6}>
          {message && (
            <Text color="theme.textSecondary" mb={5}>
              {message}
            </Text>
          )}
          <HStack justify="flex-end" gap={3}>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button
              colorPalette={colorScheme}
              size="sm"
              onClick={onConfirm}
              loading={isLoading}
            >
              {confirmLabel}
            </Button>
          </HStack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}
