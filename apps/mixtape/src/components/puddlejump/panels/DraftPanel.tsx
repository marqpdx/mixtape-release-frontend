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
} from '@chakra-ui/react';
import { SparklesIcon, ClipboardDocumentIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useDraft } from '@mixtape/api/hooks/switchboard';
import type { DraftContentType, DraftTone, DraftLength } from '@mixtape/api/clients/switchboard/switchboardApi';

const CONTENT_TYPES: { value: DraftContentType; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'message', label: 'Message' },
  { value: 'summary', label: 'Summary' },
  { value: 'sop', label: 'SOP' },
  { value: 'document', label: 'Document' },
  { value: 'proposal', label: 'Proposal' },
];

const TONES: { value: DraftTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'direct', label: 'Direct' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
];

const LENGTHS: { value: DraftLength; label: string }[] = [
  { value: 'brief', label: 'Brief (~100–200 words)' },
  { value: 'standard', label: 'Standard (~300–500 words)' },
  { value: 'detailed', label: 'Detailed (~600+ words)' },
];

interface DraftPanelProps {
  surface?: 'console' | 'puddlejump';
}

export default function DraftPanel({ surface = 'puddlejump' }: DraftPanelProps) {
  const { submit, isSubmitting, isPolling, result, error, reset } = useDraft();

  const [contentType, setContentType] = useState<DraftContentType>('email');
  const [sourceText, setSourceText] = useState('');
  const [tone, setTone] = useState<DraftTone>('professional');
  const [targetLength, setTargetLength] = useState<DraftLength>('standard');
  const [copied, setCopied] = useState(false);

  const isWorking = isSubmitting || isPolling;
  const canSubmit = sourceText.trim().length > 0 && !isWorking;

  function handleSubmit() {
    if (!canSubmit) return;
    submit({
      content_type: contentType,
      source_text: sourceText.trim(),
      tone,
      target_length: targetLength,
      surface,
    });
  }

  function handleCopy() {
    if (!result?.draft_text) return;
    navigator.clipboard.writeText(result.draft_text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReset() {
    reset();
    setSourceText('');
    setCopied(false);
  }

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="lg" color="theme.text" mb={1}>
          Draft
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          Generate a draft from source context — runs locally via Inkwell
        </Text>
      </Box>

      {/* Form */}
      {!result && (
        <VStack gap={4} align="stretch">
          {/* Content type + tone + length */}
          <HStack gap={3} align="flex-start">
            <Box flex={1}>
              <Text fontSize="xs" color="theme.textSecondary" mb={1} fontWeight="medium">
                Type
              </Text>
              <NativeSelect.Root size="sm" disabled={isWorking}>
                <NativeSelect.Field
                  value={contentType}
                  onChange={(e) => setContentType(e.currentTarget.value as DraftContentType)}
                >
                  {CONTENT_TYPES.map((ct) => (
                    <option key={ct.value} value={ct.value}>
                      {ct.label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Box>
            <Box flex={1}>
              <Text fontSize="xs" color="theme.textSecondary" mb={1} fontWeight="medium">
                Tone
              </Text>
              <NativeSelect.Root size="sm" disabled={isWorking}>
                <NativeSelect.Field
                  value={tone}
                  onChange={(e) => setTone(e.currentTarget.value as DraftTone)}
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Box>
            <Box flex={1}>
              <Text fontSize="xs" color="theme.textSecondary" mb={1} fontWeight="medium">
                Length
              </Text>
              <NativeSelect.Root size="sm" disabled={isWorking}>
                <NativeSelect.Field
                  value={targetLength}
                  onChange={(e) => setTargetLength(e.currentTarget.value as DraftLength)}
                >
                  {LENGTHS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Box>
          </HStack>

          {/* Source text */}
          <Box>
            <Text fontSize="xs" color="theme.textSecondary" mb={1} fontWeight="medium">
              Source context
            </Text>
            <Textarea
              placeholder="Paste the context, notes, or background material to draft from..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              minH="120px"
              fontSize="sm"
              disabled={isWorking}
              resize="vertical"
            />
          </Box>

          {/* Submit */}
          <HStack justify="flex-end">
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
                  <SparklesIcon style={{ width: 16, height: 16 }} />
                )}
                <span>
                  {isSubmitting ? 'Queuing...' : isPolling ? 'Generating...' : 'Generate Draft'}
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
              Draft failed: {error instanceof Error ? error.message : 'Unknown error'}
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
                Draft
              </Text>
              <Badge colorPalette="green" variant="subtle">
                {result.content_type}
              </Badge>
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
              <Button size="xs" variant="ghost" colorPalette="gray" onClick={handleReset} title="Start over">
                <HStack gap={1}>
                  <ArrowPathIcon style={{ width: 14, height: 14 }} />
                  <span>New draft</span>
                </HStack>
              </Button>
            </HStack>
          </HStack>

          {result.draft_refused ? (
            <Box p={4} borderWidth="1px" borderColor="yellow.300" borderRadius="lg" bg="yellow.50">
              <Text color="yellow.700" fontSize="sm">
                The model declined to generate this draft. Try adjusting the source context or content type.
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
              borderLeftColor="blue.400"
            >
              <Text
                fontSize="sm"
                color="theme.text"
                whiteSpace="pre-wrap"
                fontFamily="inherit"
              >
                {result.draft_text}
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
            Enter source context above to generate a draft
          </Text>
          <Text color="theme.textSecondary" fontSize="xs" mt={1}>
            Runs locally via Inkwell · Cloud generation available in Phase 3
          </Text>
        </Box>
      )}
    </VStack>
  );
}
