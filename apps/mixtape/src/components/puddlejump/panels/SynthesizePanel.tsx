'use client';

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useSynthesize, useSynthesizeNarrative } from '@mixtape/api/hooks/switchboard';

interface SynthesizePanelProps {
  surface?: 'console' | 'puddlejump';
}

export default function SynthesizePanel({ surface = 'puddlejump' }: SynthesizePanelProps) {
  const synthesize = useSynthesize();
  const narrative = useSynthesizeNarrative();

  const [query, setQuery] = useState('');
  const [showApproval, setShowApproval] = useState(false);
  const [pendingQuery, setPendingQuery] = useState('');

  const isWorking = synthesize.isSubmitting || synthesize.isPolling;
  const canSubmit = query.trim().length > 0 && !isWorking && !synthesize.result;

  function handleAnalyzeClick() {
    if (!canSubmit) return;
    setPendingQuery(query.trim());
    setShowApproval(true);
  }

  function handleApprove() {
    setShowApproval(false);
    synthesize.submit({
      query: pendingQuery,
      max_sources: 15,
      surface: 'desktop',
    });
  }

  function handleCancel() {
    setShowApproval(false);
    setPendingQuery('');
  }

  function handleGenerateNarrative() {
    if (!synthesize.actionRunId) return;
    narrative.submit({ action_run_id: synthesize.actionRunId });
  }

  function handleReset() {
    synthesize.reset();
    narrative.reset();
    setQuery('');
    setPendingQuery('');
    setShowApproval(false);
  }

  const isNarrativeWorking = narrative.isSubmitting || narrative.isPolling;

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="lg" color="theme.text" mb={1}>
          Synthesize
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          Construct a structured brief from your library — key points, tensions, and a synthesis statement
        </Text>
      </Box>

      {/* Query field */}
      <HStack gap={2}>
        <Input
          placeholder="What would you like to synthesize? (e.g. my thinking on organizational change)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyzeClick(); }}
          fontSize="sm"
          disabled={isWorking || !!synthesize.result}
          flex={1}
        />
        <Button
          size="sm"
          colorPalette="indigo"
          onClick={handleAnalyzeClick}
          disabled={!canSubmit}
          loading={isWorking}
        >
          <HStack gap={1}>
            <SparklesIcon style={{ width: 16, height: 16 }} />
            <span>Synthesize</span>
          </HStack>
        </Button>
      </HStack>

      {/* Pre-dispatch approval gate */}
      {showApproval && (
        <Box
          p={4}
          borderWidth="1px"
          borderColor="indigo.300"
          borderRadius="lg"
          bg="indigo.50"
          _dark={{ bg: "indigo.950", borderColor: "indigo.700" }}
        >
          <Text fontSize="sm" fontWeight="semibold" color="indigo.800" _dark={{ color: "indigo.200" }} mb={2}>
            Cloud AI dispatch
          </Text>
          <Text fontSize="sm" color="indigo.700" _dark={{ color: "indigo.300" }} mb={4}>
            This will send up to 15 items from your library to a cloud AI service for synthesis.
            This requires explicit approval and is recorded.
          </Text>
          <HStack gap={2} justify="flex-end">
            <Button size="sm" variant="ghost" colorPalette="gray" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" colorPalette="indigo" onClick={handleApprove}>
              Approve and synthesize
            </Button>
          </HStack>
        </Box>
      )}

      {/* Polling indicator */}
      {isWorking && (
        <HStack gap={2} py={2}>
          <Spinner size="sm" color="indigo.400" />
          <Text fontSize="sm" color="theme.textSecondary">
            Synthesizing your library…
          </Text>
        </HStack>
      )}

      {/* Submission error */}
      {synthesize.error && (
        <Box p={4} borderWidth="1px" borderColor="red.300" borderRadius="lg" bg="red.50">
          <HStack justify="space-between">
            <Text color="red.600" fontSize="sm">
              {(synthesize.error as Error)?.message?.includes('403')
                ? "You don't have permission to approve cloud AI dispatch."
                : synthesize.error instanceof Error
                  ? synthesize.error.message
                  : 'Synthesis failed'}
            </Text>
            <Button size="xs" variant="ghost" colorPalette="red" onClick={handleReset}>
              Try again
            </Button>
          </HStack>
        </Box>
      )}

      {/* Result */}
      {synthesize.result && (
        <VStack align="stretch" gap={5}>
          <HStack justify="space-between">
            <Badge colorPalette="indigo" variant="subtle" fontSize="xs">
              {synthesize.result.sources_analyzed} item{synthesize.result.sources_analyzed === 1 ? '' : 's'} analyzed
            </Badge>
            <Button size="xs" variant="ghost" colorPalette="gray" onClick={handleReset}>
              <HStack gap={1}>
                <ArrowPathIcon style={{ width: 14, height: 14 }} />
                <span>New synthesis</span>
              </HStack>
            </Button>
          </HStack>

          {/* Synthesis statement */}
          <Box
            p={4}
            bg="theme.surface"
            borderWidth="1px"
            borderColor="theme.border"
            borderRadius="lg"
            borderLeftWidth="3px"
            borderLeftColor="indigo.400"
          >
            <Text fontSize="xs" fontWeight="medium" color="theme.textSecondary" mb={1}>
              Synthesis
            </Text>
            <Text fontSize="sm" color="theme.text" whiteSpace="pre-wrap">
              {synthesize.result.synthesis_statement}
            </Text>
          </Box>

          {/* Key points */}
          {synthesize.result.key_points.length > 0 && (
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="theme.textSecondary" mb={2}>
                Key points
              </Text>
              <VStack align="stretch" gap={1}>
                {synthesize.result.key_points.map((pt, i) => (
                  <HStack key={i} gap={2} align="start">
                    <Text fontSize="xs" color="indigo.400" flexShrink={0} mt={0.5}>•</Text>
                    <Text fontSize="sm" color="theme.text">{pt}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {/* Tensions */}
          {synthesize.result.tensions.length > 0 && (
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="theme.textSecondary" mb={2}>
                Tensions
              </Text>
              <VStack align="stretch" gap={2}>
                {synthesize.result.tensions.map((tension, i) => (
                  <Box
                    key={i}
                    p={3}
                    bg="theme.surface"
                    borderWidth="1px"
                    borderColor="theme.border"
                    borderRadius="md"
                    borderLeftWidth="2px"
                    borderLeftColor="orange.300"
                  >
                    <Text fontSize="sm" color="theme.text">{tension}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {/* Open questions */}
          {synthesize.result.open_questions.length > 0 && (
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="theme.textSecondary" mb={2}>
                Open questions
              </Text>
              <VStack align="stretch" gap={1}>
                {synthesize.result.open_questions.map((q, i) => (
                  <HStack key={i} gap={2} align="start">
                    <Text fontSize="xs" color="gray.400" flexShrink={0} mt={0.5}>?</Text>
                    <Text fontSize="sm" color="theme.text">{q}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {/* Narrative section */}
          <Box
            p={4}
            bg="theme.surface"
            borderWidth="1px"
            borderColor="theme.border"
            borderRadius="lg"
          >
            {!narrative.result && !isNarrativeWorking && (
              <>
                <Text fontSize="xs" fontWeight="medium" color="theme.textSecondary" mb={2}>
                  Generate narrative
                </Text>
                <Text fontSize="xs" color="theme.textSecondary" mb={3}>
                  Weave the brief into a cohesive 300–500 word essay
                </Text>
                {narrative.error && (
                  <Text fontSize="xs" color="red.500" mb={2}>
                    {(narrative.error as Error)?.message?.includes('403')
                      ? "Permission denied."
                      : 'Narrative generation failed. Try again.'}
                  </Text>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="indigo"
                  onClick={handleGenerateNarrative}
                  disabled={isNarrativeWorking}
                >
                  Generate narrative
                </Button>
              </>
            )}

            {isNarrativeWorking && (
              <HStack gap={2}>
                <Spinner size="sm" color="indigo.400" />
                <Text fontSize="sm" color="theme.textSecondary">
                  Writing narrative…
                </Text>
              </HStack>
            )}

            {narrative.result && (
              <VStack align="stretch" gap={2}>
                <HStack justify="space-between">
                  <Text fontSize="xs" fontWeight="medium" color="theme.textSecondary">
                    Narrative
                  </Text>
                  <Text fontSize="xs" color="theme.textSecondary">
                    {narrative.result.word_count} words
                  </Text>
                </HStack>
                <Text fontSize="sm" color="theme.text" whiteSpace="pre-wrap" lineHeight="1.7">
                  {narrative.result.narrative}
                </Text>
              </VStack>
            )}
          </Box>
        </VStack>
      )}

      {/* Empty state */}
      {!synthesize.result && !isWorking && !synthesize.error && !showApproval && (
        <Box
          p={8}
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="theme.border"
          borderRadius="lg"
          textAlign="center"
        >
          <Text color="theme.textSecondary" fontSize="sm">
            Enter a focus query to synthesize your library into a structured brief
          </Text>
          <Text color="theme.textSecondary" fontSize="xs" mt={1}>
            Retrieves the most relevant items via IR, then constructs key points, tensions, and a synthesis statement
          </Text>
        </Box>
      )}
    </VStack>
  );
}
