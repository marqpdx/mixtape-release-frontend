// src/components/workbench/compose/GristInput.tsx
'use client';

import { useState } from 'react';
import { Box, Textarea, VStack, Button, HStack, Text, Badge } from '@chakra-ui/react';
import { parseGrist } from '@mixtape/api/clients/gristmill/gristmillApi';
import { useCreateMillDraft } from '@mixtape/api/hooks/workbench';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import { toaster } from '@mixtape/core/lib/toaster';
import type { GristBlock } from '@/components/gristmill/types';

interface GristInputProps {
  groupId: string;
  onDraftCreated?: (draftId: string) => void;
}

export function GristInput({ groupId, onDraftCreated }: GristInputProps) {
  const [grist, setGrist] = useState('/event Weekly Meditation\nstart: 2025-01-15 18:00\nlocation: Main Hall');
  const [ast, setAst] = useState<GristBlock | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const { mutate: createDraft, isPending } = useCreateMillDraft();

  const handleParse = async () => {
    try {
      setIsParsing(true);
      setParseError(null);
      const result = await parseGrist(grist);

      if (result.blocks && result.blocks[0]) {
        setAst(result.blocks[0]);

        if (result.blocks[0].errors && result.blocks[0].errors.length > 0) {
          toaster.create({
            title: 'Parse Warnings',
            description: `Parsed with ${result.blocks[0].errors.length} warning(s)`,
            type: 'warning',
            duration: 3000,
          });
        } else {
          toaster.create({
            title: 'Parsed Successfully',
            type: 'success',
            duration: 2000,
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse Grist';
      setParseError(message);
      toaster.create({
        title: 'Parse Error',
        description: message,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreateDraft = () => {
    if (!ast) return;

    createDraft(
      {
        sponsor_type: 'group',
        sponsor_id: groupId,
        content_profile: ast.type === 'event' ? 'event' : 'writing',
        title: ast.title || 'Untitled',
        summary: ast.fields?.summary || '',
        grist_body: grist,
        source_type: 'gristmill',
        source_id: `grist-${Date.now()}`,
        provenance_bundle: {
          parser_version: '2.0',
          parsed_at: new Date().toISOString(),
          original_grist: grist,
        },
      },
      {
        onSuccess: (draft) => {
          toaster.create({
            title: 'Draft Created',
            description: 'Opening in editor...',
            type: 'success',
            duration: 2000,
          });

          // Clear form
          setGrist('');
          setAst(null);

          // Notify parent to switch tabs and open editor
          if (onDraftCreated) {
            onDraftCreated(draft.id);
          }
        },
        onError: (error: Error) => {
          toaster.create({
            title: 'Failed to Create Draft',
            description: error.message,
            type: 'error',
            duration: 5000,
          });
        },
      }
    );
  };

  const hasErrors = ast?.errors && ast.errors.length > 0;
  const canCreateDraft = ast && (!hasErrors || ast.errors.every(e => e.type === 'warning'));

  return (
    <VStack align="stretch" gap={4}>
      {/* Info */}
      <Box>
        <Text fontSize="lg" fontWeight="semibold" mb={2}>
          Grist Markup Input
        </Text>
        <Text fontSize="sm" color="gray.600">
          Write Grist markup to quickly create structured content. Parse to validate, then create a draft for editing.
        </Text>
      </Box>

      {/* Grist Editor */}
      <Textarea
        value={grist}
        onChange={(e) => setGrist(e.target.value)}
        rows={14}
        fontFamily="monospace"
        fontSize="sm"
        placeholder="/event Your Event Title&#10;start: YYYY-MM-DD HH:MM&#10;location: Location Here&#10;&#10;Event description goes here..."
      />

      {/* Actions */}
      <HStack gap={2}>
        <Button onClick={handleParse} loading={isParsing} disabled={!grist.trim()}>
          Parse Grist
        </Button>
        {ast && (
          <Button
            onClick={handleCreateDraft}
            loading={isPending}
            colorScheme="blue"
            disabled={!canCreateDraft}
          >
            Create Draft & Edit →
          </Button>
        )}
      </HStack>

      {/* Parse Error */}
      {parseError && (
        <MixtapeAlert status="error" title="Parse Error" description={parseError} />
      )}

      {/* Preview */}
      {ast && (
        <Box border="1px" borderColor="gray.200" p={4} borderRadius="md" bg="gray.50">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="md" fontWeight="semibold">
              Preview
            </Text>
            <Badge colorScheme={hasErrors ? 'red' : 'green'}>
              {ast.type || 'unknown'}
            </Badge>
          </HStack>

          <VStack align="stretch" gap={2}>
            <Text fontSize="lg" fontWeight="bold">
              {ast.type === 'event' ? '📅' : '📝'} {ast.title || '(Untitled)'}
            </Text>

            {ast.fields?.start && (
              <Text fontSize="sm">
                🕐 <strong>Start:</strong> {ast.fields.start}
              </Text>
            )}

            {ast.fields?.location && (
              <Text fontSize="sm">
                📍 <strong>Location:</strong> {ast.fields.location}
              </Text>
            )}

            {ast.fields?.format && (
              <Text fontSize="sm">
                🎯 <strong>Format:</strong> {ast.fields.format}
              </Text>
            )}

            {ast.fields?.summary && (
              <Box mt={2}>
                <Text fontSize="sm" fontWeight="semibold">
                  Summary:
                </Text>
                <Text fontSize="sm" color="gray.700">
                  {ast.fields.summary}
                </Text>
              </Box>
            )}

            {/* Errors/Warnings */}
            {ast.errors && ast.errors.length > 0 && (
              <Box mt={3}>
                <MixtapeAlert
                  status={ast.errors.some(e => e.type === 'error') ? 'error' : 'warning'}
                  title={`${ast.errors.length} Issue(s)`}
                  description={ast.errors.map(err => `• ${err.message}`).join('\n')}
                />
              </Box>
            )}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
