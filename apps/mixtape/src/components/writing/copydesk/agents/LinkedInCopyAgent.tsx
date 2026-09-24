// src/components/write/copydesk/agents/LinkedInCopyAgent.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import {
  IconBrandLinkedin,
  IconCopy,
  IconRefresh,
  IconCheck,
} from '@tabler/icons-react';
import { AgentContainer, AgentState } from '../shared/AgentContainer';
import { LinkedInCopyExtended } from '@mixtape/api/clients/writing/writingApi';
import { useSynopsisLinkedIn } from '@mixtape/api/hooks/switchboard';
import { toaster } from '@mixtape/core/lib/toaster';

export interface LinkedInCopyAgentProps {
  pieceId: string | undefined;
  linkedinCopy: string;
  linkedinCopyExtended: LinkedInCopyExtended | null;
  onGenerated: (copy: string, extended: LinkedInCopyExtended) => void;
  documentWordCount: number;
}

const MIN_WORDS = 75;

function CopyRow({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box>
      <HStack justify="space-between" mb={1}>
        <Text fontSize="xs" color="gray.500" fontWeight="medium">{label}</Text>
        <IconButton
          size="xs"
          variant="ghost"
          onClick={handleCopy}
          title={`Copy ${label}`}
        >
          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
        </IconButton>
      </HStack>
      <Box
        p={2}
        bg="blue.50"
        borderRadius="md"
        borderLeft="3px solid"
        borderLeftColor="blue.300"
        fontSize="sm"
        lineHeight="1.5"
        color="gray.700"
      >
        {text}
      </Box>
    </Box>
  );
}

export function LinkedInCopyAgent({
  pieceId,
  linkedinCopy,
  linkedinCopyExtended,
  onGenerated,
  documentWordCount,
}: LinkedInCopyAgentProps) {
  const [showExtended, setShowExtended] = useState(false);
  const appliedActionRunId = useRef<string | null>(null);
  const linkedinAction = useSynopsisLinkedIn();

  const hasContent = !!linkedinCopy;
  const isGenerating = linkedinAction.isSubmitting || linkedinAction.isPolling;

  useEffect(() => {
    if (
      !linkedinAction.result ||
      !linkedinAction.actionRunId ||
      appliedActionRunId.current === linkedinAction.actionRunId
    ) return;
    appliedActionRunId.current = linkedinAction.actionRunId;
    const result = linkedinAction.result;
    const copy = result.short_synopsis || result.hook;
    onGenerated(copy, {
      hook: result.hook,
      short_synopsis: result.short_synopsis,
      one_line_takeaway: result.one_line_takeaway,
      alt_hook: result.alt_hook,
      source_claim: result.source_claim,
      human_stake: result.human_stake,
    });
  }, [linkedinAction.actionRunId, linkedinAction.result, onGenerated]);

  useEffect(() => {
    if (!linkedinAction.error) return;
    toaster.create({ title: 'LinkedIn introduction generation failed', type: 'error' });
  }, [linkedinAction.error]);

  const getAgentState = (): AgentState => {
    if (isGenerating) return 'loading';
    if (hasContent) return 'ready';
    return 'idle';
  };

  const getStateMessage = (): string => {
    if (isGenerating) return 'Generating...';
    if (hasContent) return 'Ready';
    return 'On demand';
  };

  const handleGenerate = async () => {
    if (!pieceId) return;
    linkedinAction.reset();
    linkedinAction.submit({ piece_id: pieceId, surface: 'writing' });
  };

  return (
    <AgentContainer
      id="linkedin-copy"
      title="LinkedIn post introduction"
      state={getAgentState()}
      stateMessage={getStateMessage()}
      icon={<IconBrandLinkedin size={16} />}
      iconColor="#0077B5"
    >
      <VStack gap={3} align="stretch">

        {/* Ready state */}
        {hasContent && !isGenerating && (
          <VStack gap={3} align="stretch">
            <HStack justify="space-between">
              <Badge colorScheme="blue" size="sm">Ready</Badge>
              <IconButton
                size="xs"
                variant="ghost"
                onClick={handleGenerate}
                title="Regenerate"
                disabled={isGenerating}
              >
                <IconRefresh size={14} />
              </IconButton>
            </HStack>

            <CopyRow label="Post introduction" text={linkedinCopy} />

            {linkedinCopyExtended && (
              <>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setShowExtended((v) => !v)}
                >
                  {showExtended ? 'Hide variants' : 'Show variants →'}
                </Button>

                {showExtended && (
                  <VStack gap={3} align="stretch">
                    {linkedinCopyExtended.short_synopsis && (
                      <CopyRow label="Short synopsis" text={linkedinCopyExtended.short_synopsis} />
                    )}
                    {linkedinCopyExtended.one_line_takeaway && (
                      <CopyRow label="One-line takeaway" text={linkedinCopyExtended.one_line_takeaway} />
                    )}
                    {linkedinCopyExtended.alt_hook && (
                      <CopyRow label="Alt hook" text={linkedinCopyExtended.alt_hook} />
                    )}
                  </VStack>
                )}
              </>
            )}
          </VStack>
        )}

        {/* Generating state */}
        {isGenerating && (
          <VStack gap={2} align="center" py={4}>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Generating and reviewing the LinkedIn introduction...
            </Text>
          </VStack>
        )}

        {/* Idle state */}
        {!hasContent && !isGenerating && (
          <VStack gap={2} align="center" py={4}>
            {documentWordCount < MIN_WORDS ? (
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Write {MIN_WORDS - documentWordCount} more words to generate a LinkedIn introduction.
              </Text>
            ) : (
              <>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Generate a grounded introduction for sharing this article on LinkedIn.
                </Text>
                <Button
                  size="xs"
                  variant="outline"
                  colorPalette="blue"
                  onClick={handleGenerate}
                >
                  Generate introduction
                </Button>
              </>
            )}
          </VStack>
        )}

      </VStack>
    </AgentContainer>
  );
}
