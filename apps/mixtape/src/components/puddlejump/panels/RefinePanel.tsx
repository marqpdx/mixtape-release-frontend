'use client';

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Spinner,
  Badge,
  Textarea,
  NativeSelect,
  Input,
} from '@chakra-ui/react';
import { ScissorsIcon, ClipboardDocumentIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useRefine, type ApprovalMode } from '@mixtape/api/hooks/switchboard';
import type { RefineLength, RefineAsyncRequest } from '@mixtape/api/clients/switchboard/switchboardApi';

const LENGTHS: { value: RefineLength; label: string }[] = [
  { value: 'preserve', label: 'Preserve length' },
  { value: 'shorten', label: 'Shorten' },
  { value: 'expand', label: 'Expand' },
];

const APPROVAL_MODES: { value: ApprovalMode; label: string }[] = [
  { value: 'standard', label: 'Standard (review each)' },
  { value: 'reviewed_default', label: 'Reviewed (one-tap)' },
  { value: 'trusted_default', label: 'Trusted (auto-approve)' },
];

function loadApprovalMode(): ApprovalMode {
  if (typeof window === 'undefined') return 'standard';
  return (localStorage.getItem('refine_approval_mode') as ApprovalMode) ?? 'standard';
}

interface RefinePanelProps {
  surface?: 'console' | 'puddlejump';
}

export default function RefinePanel({ surface = 'puddlejump' }: RefinePanelProps) {
  const { submit, submitCloud, isSubmitting, isPolling, result, error, reset } = useRefine();

  const [sourceText, setSourceText] = useState('');
  const [instruction, setInstruction] = useState('');
  const [targetLength, setTargetLength] = useState<RefineLength>('preserve');
  const [copied, setCopied] = useState(false);

  const [approvalMode, setApprovalMode] = useState<ApprovalMode>(loadApprovalMode);
  const [isApprovingCloud, setIsApprovingCloud] = useState(false);

  const isWorking = isSubmitting || isPolling;
  const canSubmit = sourceText.trim().length > 0 && instruction.trim().length > 0 && !isWorking;

  function buildRequest(): RefineAsyncRequest {
    return {
      source_text: sourceText.trim(),
      refinement_instruction: instruction.trim(),
      target_length: targetLength,
      surface,
    };
  }

  function handleSubmit() {
    if (!canSubmit) return;
    if (approvalMode === 'trusted_default') {
      submitCloud({ ...buildRequest(), approval_mode: 'trusted_default' });
    } else {
      submit(buildRequest());
    }
  }

  function handleSubmitCloud() {
    if (!canSubmit) return;
    setIsApprovingCloud(true);
    submitCloud(
      { ...buildRequest(), approval_mode: approvalMode },
      { onSettled: () => setIsApprovingCloud(false) }
    );
  }

  function handleCopy() {
    if (!result?.refined_text) return;
    navigator.clipboard.writeText(result.refined_text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReset() {
    reset();
    setSourceText('');
    setInstruction('');
    setCopied(false);
    setIsApprovingCloud(false);
  }

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="lg" color="theme.text" mb={1}>
          Refine
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          Improve existing text with a targeted instruction — local or cloud
        </Text>
      </Box>

      {/* Form */}
      {!result && (
        <VStack gap={4} align="stretch">
          {/* Controls row */}
          <HStack gap={3} align="flex-start">
            <Box flex={1}>
              <Text fontSize="xs" color="theme.textSecondary" mb={1} fontWeight="medium">
                Length
              </Text>
              <NativeSelect.Root size="sm" disabled={isWorking}>
                <NativeSelect.Field
                  value={targetLength}
                  onChange={(e) => setTargetLength(e.currentTarget.value as RefineLength)}
                >
                  {LENGTHS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Box>
            <Box flex={1}>
              <Text fontSize="xs" color="theme.textSecondary" mb={1} fontWeight="medium">
                Approval
              </Text>
              <NativeSelect.Root size="sm" disabled={isWorking}>
                <NativeSelect.Field
                  value={approvalMode}
                  onChange={(e) => {
                    const mode = e.currentTarget.value as ApprovalMode;
                    setApprovalMode(mode);
                    localStorage.setItem('refine_approval_mode', mode);
                  }}
                >
                  {APPROVAL_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Box>
          </HStack>

          {/* Instruction */}
          <Box>
            <Text fontSize="xs" color="theme.textSecondary" mb={1} fontWeight="medium">
              Refinement instruction
            </Text>
            <Input
              placeholder="e.g. Make the opening more direct, fix grammar, shorten the second paragraph..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              fontSize="sm"
              disabled={isWorking}
            />
          </Box>

          {/* Source text */}
          <Box>
            <Text fontSize="xs" color="theme.textSecondary" mb={1} fontWeight="medium">
              Text to refine
            </Text>
            <Textarea
              placeholder="Paste the text you want to improve..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              minH="140px"
              fontSize="sm"
              disabled={isWorking}
              resize="vertical"
            />
          </Box>

          {/* Submit */}
          <HStack justify="flex-end" gap={2}>
            <Button
              size="sm"
              colorPalette="purple"
              variant="outline"
              onClick={handleSubmitCloud}
              disabled={!canSubmit}
              loading={isApprovingCloud}
            >
              Cloud
            </Button>
            <Button
              size="sm"
              colorPalette="blue"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              <HStack gap={2}>
                {isWorking ? (
                  <Spinner size="xs" />
                ) : (
                  <ScissorsIcon style={{ width: 16, height: 16 }} />
                )}
                <span>
                  {isSubmitting ? 'Queuing...' : isPolling ? 'Refining...' : 'Refine'}
                </span>
              </HStack>
            </Button>
          </HStack>
        </VStack>
      )}

      {/* Error */}
      {error && (
        <Box p={4} borderWidth="1px" borderColor="red.300" borderRadius="lg" bg="red.50">
          <HStack justify="space-between">
            <Text color="red.600" fontSize="sm">
              Refine failed: {error instanceof Error ? error.message : 'Unknown error'}
            </Text>
            <Button size="xs" variant="ghost" colorPalette="red" onClick={handleReset}>
              Try again
            </Button>
          </HStack>
        </Box>
      )}

      {/* Result */}
      {result && (
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <HStack gap={2}>
              <Text fontWeight="semibold" color="theme.text">
                Refined
              </Text>
              {result.quality_signal != null && (
                <Badge
                  colorPalette={result.quality_signal >= 0.7 ? 'blue' : 'yellow'}
                  variant="subtle"
                  fontSize="xs"
                >
                  {Math.round(result.quality_signal * 100)}% quality
                </Badge>
              )}
              {result.model_used && (
                <Badge colorPalette="gray" variant="subtle" fontSize="xs">
                  {result.model_used}
                </Badge>
              )}
            </HStack>
            <HStack gap={2}>
              <Button size="xs" variant="ghost" onClick={handleCopy} title="Copy to clipboard">
                <HStack gap={1}>
                  <ClipboardDocumentIcon style={{ width: 14, height: 14 }} />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </HStack>
              </Button>
              <Button size="xs" variant="ghost" colorPalette="gray" onClick={handleReset} title="Refine again">
                <HStack gap={1}>
                  <ArrowPathIcon style={{ width: 14, height: 14 }} />
                  <span>New refine</span>
                </HStack>
              </Button>
            </HStack>
          </HStack>

          {result.refine_refused ? (
            <Box p={4} borderWidth="1px" borderColor="yellow.300" borderRadius="lg" bg="yellow.50">
              <Text color="yellow.700" fontSize="sm">
                The model declined to refine this text. Try adjusting the instruction or source.
              </Text>
            </Box>
          ) : (
            <Box
              p={4}
              bg="theme.surface"
              borderWidth="1px"
              borderColor="theme.border"
              borderRadius="lg"
              borderLeftWidth="3px"
              borderLeftColor="purple.400"
            >
              <Text
                fontSize="sm"
                color="theme.text"
                whiteSpace="pre-wrap"
                fontFamily="inherit"
              >
                {result.refined_text}
              </Text>
            </Box>
          )}
        </VStack>
      )}

      {/* Empty state */}
      {!result && !isWorking && !error && sourceText.length === 0 && (
        <Box
          p={8}
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="theme.border"
          borderRadius="lg"
          textAlign="center"
        >
          <Text color="theme.textSecondary" fontSize="sm">
            Enter an instruction and the text to refine above
          </Text>
          <Text color="theme.textSecondary" fontSize="xs" mt={1}>
            Local via Inkwell · Cloud generation available
          </Text>
        </Box>
      )}
    </VStack>
  );
}
