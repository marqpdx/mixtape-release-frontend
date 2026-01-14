// src/components/gristmill/Mill.tsx
'use client';

import { useState } from 'react';
import { Box, Textarea, VStack, Button, Text, HStack } from '@chakra-ui/react';
import { parseGrist, saveDraft, promoteDraft } from '@mixtape/api/clients/gristmill/gristmillApi';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import type { GristBlock, SponsorContext } from './types';
import { useQueryClient } from '@tanstack/react-query';

interface MillProps {
  sponsor: SponsorContext;
}

export function Mill({ sponsor }: MillProps) {
  const [grist, setGrist] = useState('/event Weekly Meditation\nstart: 2025-01-15 18:00\nlocation: Main Hall');
  const [ast, setAst] = useState<GristBlock | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleParse = async () => {
    try {
      setIsLoading(true);
      const result = await parseGrist(grist);
      if (result.blocks[0]) {
        setAst(result.blocks[0]);
      }
    } catch (error) {
      setMessage(`Parse error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const draft = await saveDraft(grist);
      setDraftId(draft.id);
      setAst(draft.ast);
      setMessage(`Draft saved: ${draft.id}`);
    } catch (error) {
      setMessage(`Save error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!draftId) return;

    try {
      setIsLoading(true);
      // Pass sponsor context to promotion
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await promoteDraft(
        draftId,
        sponsor.type === 'group' ? sponsor.slug : undefined,
        timezone
      );
      setMessage(`Event created: ${result.event_slug}`);
      if (sponsor.type === 'group') {
        queryClient.invalidateQueries({ queryKey: ['almanac', 'events', 'drafts', sponsor.slug] });
        queryClient.invalidateQueries({ queryKey: ['almanac', 'events', 'published', sponsor.slug] });
        queryClient.invalidateQueries({ queryKey: ['almanac', 'calendar', sponsor.slug] });
      }
    } catch (error) {
      setMessage(`Promote error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <VStack gap={4} align="stretch">
        {/* Header with sponsor context */}
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">Grist Mill</Text>
          <Text fontSize="sm" color="gray.600">
            Creating for: {sponsor.type === 'group' ? 'Group' : 'Member'} "{sponsor.slug}"
          </Text>
        </HStack>

        {/* Grist Editor */}
        <Textarea
          value={grist}
          onChange={(e) => setGrist(e.target.value)}
          rows={12}
          fontFamily="monospace"
          fontSize="sm"
          placeholder="/event Your Event Title&#10;start: YYYY-MM-DD HH:MM&#10;location: Location Here"
        />

        <Button onClick={handleParse} disabled={isLoading}>
          Parse
        </Button>

        {/* Card Preview */}
        {ast && (
          <Box border="1px" borderColor="gray.200" p={4} borderRadius="md" bg="gray.50">
            <Text fontSize="lg" fontWeight="bold">
              {ast.type === 'event' ? '📅' : '📝'} {ast.title}
            </Text>

            {ast.fields.start && <Text>🕐 {ast.fields.start}</Text>}
            {ast.fields.location && <Text>📍 {ast.fields.location}</Text>}
            {ast.fields.format && <Text>🎯 {ast.fields.format}</Text>}

            {ast.errors && ast.errors.length > 0 && (
              <Box mt={2}>
                <MixtapeAlert
                  status="error"
                  description={ast.errors.map((err) => err.message).join('\n')}
                />
              </Box>
            )}

            {ast.errors && ast.errors.length === 0 && (
              <VStack mt={4} gap={2}>
                <Button
                  onClick={handleSave}
                  colorScheme="blue"
                  w="full"
                  disabled={isLoading}
                >
                  Save Draft
                </Button>
                {draftId && (
                  <Button
                    onClick={handlePromote}
                    colorScheme="green"
                    w="full"
                    disabled={isLoading}
                  >
                    Promote to {ast.type === 'event' ? 'Event' : 'Content'}
                  </Button>
                )}
              </VStack>
            )}
          </Box>
        )}

        {message && (
          <MixtapeAlert description={message} status={message.includes('error') ? 'error' : 'success'} />
        )}
      </VStack>
    </Box>
  );
}
