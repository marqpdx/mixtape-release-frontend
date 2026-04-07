// src/components/write/copydesk/agents/LinkedInCopyAgent.tsx

import React, { useState } from 'react';
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
import { generateLinkedInCopy, LinkedInCopyExtended } from '@mixtape/api/clients/writing/writingApi';
import { toaster } from '@mixtape/core/lib/toaster';

export interface LinkedInCopyAgentProps {
  pieceId: string | undefined;
  linkedinCopy: string;
  linkedinCopyExtended: LinkedInCopyExtended | null;
  onGenerated: (copy: string, extended: LinkedInCopyExtended) => void;
  documentWordCount: number;
}

const MIN_WORDS = 50;

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExtended, setShowExtended] = useState(false);

  const hasContent = !!linkedinCopy;

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
    setIsGenerating(true);
    try {
      const result = await generateLinkedInCopy(pieceId);
      const extended: LinkedInCopyExtended = result.linkedin_copy_extended ?? {
        hook: result.linkedin_copy,
        short_synopsis: '',
        one_line_takeaway: '',
        alt_hook: '',
      };
      onGenerated(result.linkedin_copy, extended);
    } catch {
      toaster.create({ title: 'LinkedIn copy generation failed', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AgentContainer
      id="linkedin-copy"
      title="LinkedIn Copy"
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

            <CopyRow label="Hook" text={linkedinCopy} />

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
              Generating LinkedIn copy...
            </Text>
          </VStack>
        )}

        {/* Idle state */}
        {!hasContent && !isGenerating && (
          <VStack gap={2} align="center" py={4}>
            {documentWordCount < MIN_WORDS ? (
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Write {MIN_WORDS - documentWordCount} more words to generate LinkedIn copy.
              </Text>
            ) : (
              <>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Generate a hook and post copy optimised for LinkedIn.
                </Text>
                <Button
                  size="xs"
                  variant="outline"
                  colorPalette="blue"
                  onClick={handleGenerate}
                >
                  Generate LinkedIn copy
                </Button>
              </>
            )}
          </VStack>
        )}

      </VStack>
    </AgentContainer>
  );
}
