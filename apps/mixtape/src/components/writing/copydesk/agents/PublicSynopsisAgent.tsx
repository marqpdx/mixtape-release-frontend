// src/components/writing/copydesk/agents/PublicSynopsisAgent.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Textarea,
} from '@chakra-ui/react';
import { IconWorld, IconCheck } from '@tabler/icons-react';
import { AgentContainer, AgentState } from '../shared/AgentContainer';
import { useSynopsisPublic } from '@mixtape/api/hooks/switchboard';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import { toaster } from '@mixtape/core/lib/toaster';

export interface PublicSynopsisAgentProps {
  pieceId: string | undefined;
  pieceSlug: string | undefined;
  /** Current Summary (excerpt) text -- offered as a one-click starting point,
   * since the backend already falls back to it when Public synopsis is
   * blank/unconfirmed (crawlers/search/link-preview read whichever is set). */
  excerpt: string;
  documentWordCount: number;
}

const MIN_WORDS = 30;

export function PublicSynopsisAgent({ pieceId, pieceSlug, excerpt, documentWordCount }: PublicSynopsisAgentProps) {
  const [text, setText] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const appliedActionRunId = useRef<string | null>(null);
  const synopsisAction = useSynopsisPublic();

  const hasContent = !!text;
  const isGenerating = synopsisAction.isSubmitting || synopsisAction.isPolling;

  useEffect(() => {
    if (!pieceSlug) {
      setLoaded(true);
      return;
    }
    let active = true;
    axiosInstance.get(`/api/atelier/${pieceSlug}/summaries/`).then((res) => {
      if (!active) return;
      setText(res.data?.public_synopsis?.text || '');
      setConfirmed(!!res.data?.public_synopsis?.confirmed);
      setLoaded(true);
    }).catch(() => setLoaded(true));
    return () => { active = false; };
  }, [pieceSlug]);

  const persist = async (value: string) => {
    if (!pieceSlug) return;
    setSaving(true);
    try {
      await axiosInstance.patch(`/api/atelier/${pieceSlug}/summaries/`, { public_synopsis: value });
      setConfirmed(false);
    } catch {
      toaster.create({ title: 'Could not save public synopsis', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (
      !synopsisAction.result ||
      !synopsisAction.actionRunId ||
      appliedActionRunId.current === synopsisAction.actionRunId
    ) return;
    appliedActionRunId.current = synopsisAction.actionRunId;
    const generated = synopsisAction.result.summary;
    if (generated?.trim()) {
      setText(generated);
      void persist(generated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synopsisAction.actionRunId, synopsisAction.result]);

  useEffect(() => {
    if (!synopsisAction.error) return;
    toaster.create({ title: 'Public synopsis generation failed', type: 'error' });
  }, [synopsisAction.error]);

  const handleGenerate = () => {
    if (!pieceId) return;
    synopsisAction.reset();
    synopsisAction.submit({ piece_id: pieceId, surface: 'writing' });
  };

  const handleUseSummary = () => {
    setText(excerpt);
    void persist(excerpt);
  };

  const handleEdit = (value: string) => {
    setText(value);
    setConfirmed(false);
  };

  const handleBlurSave = () => {
    void persist(text);
  };

  const handleConfirm = async () => {
    if (!pieceSlug) return;
    setConfirming(true);
    try {
      await persist(text);
      await axiosInstance.post(`/api/atelier/${pieceSlug}/summaries/confirm/`, { types: ['public_synopsis'] });
      setConfirmed(true);
      toaster.create({ title: 'Public synopsis confirmed', type: 'success' });
    } catch {
      toaster.create({ title: 'Could not confirm public synopsis', type: 'error' });
    } finally {
      setConfirming(false);
    }
  };

  const getAgentState = (): AgentState => {
    if (isGenerating) return 'loading';
    if (confirmed) return 'ready';
    if (hasContent) return 'idle';
    return 'idle';
  };

  const getStateMessage = (): string => {
    if (isGenerating) return 'Generating...';
    if (confirmed) return 'Confirmed';
    if (hasContent) return 'Draft';
    return 'On demand';
  };

  if (!loaded) return null;

  return (
    <AgentContainer
      id="public-synopsis"
      title="Public synopsis"
      state={getAgentState()}
      stateMessage={getStateMessage()}
      icon={<IconWorld size={16} />}
      iconColor="#0EA5E9"
    >
      <VStack gap={3} align="stretch">
        <Text fontSize="xs" color="gray.500">
          What search engines, LinkedIn, and other link previews show when this article is shared.
          AI-first -- review before confirming.
        </Text>

        {!hasContent && !isGenerating && (
          <VStack gap={2} align="center" py={2}>
            {documentWordCount < MIN_WORDS ? (
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Write {MIN_WORDS - documentWordCount} more words to generate a public synopsis.
              </Text>
            ) : (
              <HStack gap={2}>
                <Button size="xs" variant="outline" colorPalette="blue" onClick={handleGenerate}>
                  Generate
                </Button>
                {excerpt && (
                  <Button size="xs" variant="ghost" onClick={handleUseSummary}>
                    Use my Summary
                  </Button>
                )}
              </HStack>
            )}
          </VStack>
        )}

        {isGenerating && (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
            Generating public synopsis...
          </Text>
        )}

        {hasContent && !isGenerating && (
          <VStack gap={2} align="stretch">
            <HStack justify="space-between">
              <Badge colorScheme={confirmed ? 'green' : 'gray'} size="sm">
                {confirmed ? 'Confirmed' : 'Draft'}
              </Badge>
              <Button size="xs" variant="ghost" onClick={handleGenerate} disabled={isGenerating}>
                Regenerate
              </Button>
            </HStack>
            <Textarea
              size="sm"
              value={text}
              onChange={(e) => handleEdit(e.target.value)}
              onBlur={handleBlurSave}
              rows={4}
            />
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
          </VStack>
        )}
      </VStack>
    </AgentContainer>
  );
}
