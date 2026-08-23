"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Input,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger } from "@components/ui/dialog";
import { Field } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useDistillAtriumSession } from "@mixtape/api/hooks/atrium";
import { DISTILLATE_DOCUMENT_TYPES } from "@mixtape/core/types/atriumTypes";
import type { Distillate, DistillateDocumentType } from "@mixtape/core/types/atriumTypes";

interface AtriumDistillModalProps {
  sessionId: string;
  open: boolean;
  onClose: () => void;
  onDistilled?: (distillate: Distillate) => void;
}

export function AtriumDistillModal({ sessionId, open, onClose, onDistilled }: AtriumDistillModalProps) {
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState<DistillateDocumentType>("summary");
  const [result, setResult] = useState<Distillate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: distill, isPending } = useDistillAtriumSession();

  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const resultBg = useColorModeValue("gray.50", "gray.700");
  const resultBorder = useColorModeValue("gray.200", "gray.600");

  function handleClose() {
    setTitle("");
    setDocumentType("summary");
    setResult(null);
    setError(null);
    onClose();
  }

  async function handleGenerate() {
    if (!title.trim()) return;
    setError(null);
    try {
      const distillate = await distill({ sessionId, title: title.trim(), document_type: documentType });
      setResult(distillate);
      onDistilled?.(distillate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Distillate generation failed.");
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={(e) => { if (!e.open) handleClose(); }} size="lg">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Distill →</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {!result ? (
            <Stack gap={4}>
              <Text fontSize="sm" color={subtitleColor}>
                Extract a named artifact from this session. Claude will generate the body from your conversation history.
              </Text>
              <Field.Root>
                <Field.Label>Title</Field.Label>
                <Input
                  placeholder="e.g. Decision: cache invalidation approach"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) void handleGenerate(); }}
                  disabled={isPending}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Document type</Field.Label>
                <Flex gap={2} flexWrap="wrap">
                  {DISTILLATE_DOCUMENT_TYPES.map((dt) => (
                    <Button
                      key={dt.value}
                      size="xs"
                      variant={documentType === dt.value ? "solid" : "outline"}
                      colorPalette="blue"
                      onClick={() => setDocumentType(dt.value)}
                      disabled={isPending}
                    >
                      {dt.label}
                    </Button>
                  ))}
                </Flex>
              </Field.Root>
              {error && (
                <Text fontSize="sm" color="red.500">{error}</Text>
              )}
            </Stack>
          ) : (
            <Stack gap={3}>
              <Text fontSize="sm" fontWeight="medium">{result.title}</Text>
              <Text fontSize="xs" color={subtitleColor}>
                {DISTILLATE_DOCUMENT_TYPES.find((d) => d.value === result.document_type)?.label ?? result.document_type}
                {" — saved"}
              </Text>
              <Box
                bg={resultBg}
                borderWidth="1px"
                borderColor={resultBorder}
                borderRadius="md"
                p={3}
                maxH="320px"
                overflowY="auto"
              >
                <Textarea
                  value={result.body}
                  readOnly
                  variant="subtle"
                  fontSize="sm"
                  rows={12}
                  resize="none"
                />
              </Box>
            </Stack>
          )}
        </DialogBody>
        <DialogFooter>
          {!result ? (
            <>
              <Button variant="ghost" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                colorPalette="blue"
                onClick={handleGenerate}
                loading={isPending}
                disabled={!title.trim()}
              >
                Generate
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}
