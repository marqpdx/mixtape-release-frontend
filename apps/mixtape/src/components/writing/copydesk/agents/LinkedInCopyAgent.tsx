// src/components/write/copydesk/agents/LinkedInCopyAgent.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Badge,
  IconButton,
  Textarea,
} from '@chakra-ui/react';
import {
  IconBrandLinkedin,
  IconCopy,
  IconRefresh,
  IconCheck,
} from '@tabler/icons-react';
import { AgentContainer, AgentState } from '../shared/AgentContainer';
import type { LinkedInCopyExtended } from '@mixtape/api/clients/writing/writingApi';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import { useSynopsisLinkedIn } from '@mixtape/api/hooks/switchboard';
import { toaster } from '@mixtape/core/lib/toaster';

export interface LinkedInCopyAgentProps {
  pieceId: string | undefined;
  documentWordCount: number;
}

/** The linkedin_introduction slice of GET/PATCH /api/atelier/<piece>/summaries/ — shared with Draft Room. */
interface LinkedInIntroduction {
  text: string;
  confirmed: boolean;
  extended: LinkedInCopyExtended | null;
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
  documentWordCount,
}: LinkedInCopyAgentProps) {
  const [text, setText] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [extended, setExtended] = useState<LinkedInCopyExtended | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showExtended, setShowExtended] = useState(false);
  const savedText = useRef('');
  const appliedActionRunId = useRef<string | null>(null);
  const linkedinAction = useSynopsisLinkedIn();

  const hasContent = !!text;
  const isGenerating = linkedinAction.isSubmitting || linkedinAction.isPolling;

  const apply = (intro: LinkedInIntroduction | undefined) => {
    savedText.current = intro?.text || '';
    setText(intro?.text || '');
    setConfirmed(!!intro?.confirmed);
    setExtended(intro?.extended ?? null);
  };

  // Same endpoint as Draft Room, so edits made there show up here (and vice versa).
  // Reload when the window regains focus, unless there's an unsaved edit in progress.
  const load = useCallback(async () => {
    if (!pieceId) return;
    try {
      const res = await axiosInstance.get(`/api/atelier/${pieceId}/summaries/`);
      apply(res.data?.linkedin_introduction);
    } catch {
      // A piece without summaries leaves the agent in its empty state.
    }
  }, [pieceId]);

  useEffect(() => {
    apply(undefined);
    void load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => {
      if (text === savedText.current) void load();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load, text]);

  const persist = async (value: string): Promise<boolean> => {
    if (!pieceId) return false;
    if (value === savedText.current) return true;
    setSaving(true);
    try {
      const res = await axiosInstance.patch(`/api/atelier/${pieceId}/summaries/`, { linkedin_introduction: value });
      savedText.current = value;
      setConfirmed(!!res.data?.linkedin_introduction?.confirmed);
      return true;
    } catch {
      toaster.create({ title: 'Could not save LinkedIn introduction', type: 'error' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // The backend stores the generated copy when the run succeeds; reload to pick it up.
  useEffect(() => {
    if (
      !linkedinAction.result ||
      !linkedinAction.actionRunId ||
      appliedActionRunId.current === linkedinAction.actionRunId
    ) return;
    appliedActionRunId.current = linkedinAction.actionRunId;
    void load();
  }, [linkedinAction.actionRunId, linkedinAction.result, load]);

  useEffect(() => {
    if (!linkedinAction.error) return;
    toaster.create({ title: 'LinkedIn introduction generation failed', type: 'error' });
  }, [linkedinAction.error]);

  const handleGenerate = () => {
    if (!pieceId) return;
    linkedinAction.reset();
    linkedinAction.submit({ piece_id: pieceId, surface: 'writing' });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleConfirm = async () => {
    if (!pieceId) return;
    setConfirming(true);
    try {
      if (!(await persist(text))) return;
      await axiosInstance.post(`/api/atelier/${pieceId}/summaries/confirm/`, { types: ['linkedin_introduction'] });
      setConfirmed(true);
      toaster.create({ title: 'LinkedIn introduction confirmed', type: 'success' });
    } catch {
      toaster.create({ title: 'Could not confirm LinkedIn introduction', type: 'error' });
    } finally {
      setConfirming(false);
    }
  };

  const getAgentState = (): AgentState => {
    if (isGenerating) return 'loading';
    if (confirmed) return 'ready';
    return 'idle';
  };

  const getStateMessage = (): string => {
    if (isGenerating) return 'Generating...';
    if (confirmed) return 'Confirmed';
    if (hasContent) return 'Draft';
    return 'On demand';
  };

  return (
    <AgentContainer
      id="linkedin-copy"
      title="LinkedIn introduction"
      state={getAgentState()}
      stateMessage={getStateMessage()}
      icon={<IconBrandLinkedin size={16} />}
      iconColor="#0077B5"
    >
      <VStack gap={3} align="stretch">

        {/* Draft / confirmed state */}
        {hasContent && !isGenerating && (
          <VStack gap={3} align="stretch">
            <HStack justify="space-between">
              <Badge colorScheme={confirmed ? 'green' : 'gray'} size="sm">
                {confirmed ? 'Confirmed' : 'Draft'}
              </Badge>
              <HStack gap={0}>
                <IconButton
                  size="xs"
                  variant="ghost"
                  onClick={handleCopy}
                  title="Copy post introduction"
                >
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                </IconButton>
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
            </HStack>

            <Textarea
              className="lica-introduction"
              size="sm"
              autoresize
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setConfirmed(false);
              }}
              onBlur={() => void persist(text)}
            />
            <HStack justify="space-between">
              <Text fontSize="xs" color="gray.500">{text.trim().length} characters</Text>
              <Button
                size="xs"
                colorPalette={confirmed ? 'green' : 'blue'}
                variant={confirmed ? 'outline' : 'solid'}
                onClick={handleConfirm}
                loading={confirming || saving}
              >
                <IconCheck size={12} />
                {confirmed ? 'Confirmed' : 'Confirm'}
              </Button>
            </HStack>

            {extended && (
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
                    {(extended.source_claim || extended.human_stake) && (
                      <Box
                        p={2}
                        bg="gray.50"
                        borderRadius="md"
                        borderLeft="3px solid"
                        borderLeftColor="gray.300"
                      >
                        <Text fontSize="xs" color="gray.500" fontWeight="medium" mb={1}>
                          Why this angle
                        </Text>
                        {extended.source_claim && (
                          <Text fontSize="xs" color="gray.600" mb={1}>
                            <Text as="span" fontWeight="medium">Core claim:</Text> {extended.source_claim}
                          </Text>
                        )}
                        {extended.human_stake && (
                          <Text fontSize="xs" color="gray.600">
                            <Text as="span" fontWeight="medium">What&apos;s at stake for the reader:</Text> {extended.human_stake}
                          </Text>
                        )}
                      </Box>
                    )}
                    {extended.short_synopsis && (
                      <CopyRow label="Short synopsis" text={extended.short_synopsis} />
                    )}
                    {extended.one_line_takeaway && (
                      <CopyRow label="One-line takeaway" text={extended.one_line_takeaway} />
                    )}
                    {extended.alt_hook && (
                      <CopyRow label="Alt hook" text={extended.alt_hook} />
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
