// apps/mixtape/src/components/member/settings/WritingSettings.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Input,
  Button,
  Table,
  Badge,
} from '@chakra-ui/react';
import { Switch } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { useAuth } from '@/lib/auth/AuthContext';
import { PREF_AUTO_LOAD_MIC, getBooleanPreference, setBooleanPreference } from '@/lib/memberSettings';
import {
  useSpellCorrections,
  useAddSpellCorrection,
  useDeleteSpellCorrection,
  useSpellSuggestions,
  useSubmitSpellSuggestion,
  useApproveSpellSuggestion,
  useRejectSpellSuggestion,
} from '@mixtape/api/hooks/spellbook';
import { toaster } from '@mixtape/core/lib/toaster';

// localStorage keys for writing preferences
const PREF_AUTO_CAPITALIZE = 'mixtape-pref-auto-capitalize';
const PREF_SPELL_CORRECTION = 'mixtape-pref-spell-correction';

export function WritingSettings() {
  const { user } = useAuth();
  const isSuperuser = user?.is_superuser ?? false;

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  // Writing preferences (localStorage for now)
  const [autoLoadMic, setAutoLoadMic] = useState(false);
  const [autoCapitalize, setAutoCapitalize] = useState(true);
  const [spellCorrection, setSpellCorrection] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    setAutoLoadMic(getBooleanPreference(PREF_AUTO_LOAD_MIC, false));
    const savedAutoCap = localStorage.getItem(PREF_AUTO_CAPITALIZE);
    const savedSpell = localStorage.getItem(PREF_SPELL_CORRECTION);
    if (savedAutoCap !== null) setAutoCapitalize(savedAutoCap === 'true');
    if (savedSpell !== null) setSpellCorrection(savedSpell === 'true');
  }, []);

  // Save preferences to localStorage
  const handleAutoCapitalizeChange = useCallback((checked: boolean) => {
    setAutoCapitalize(checked);
    localStorage.setItem(PREF_AUTO_CAPITALIZE, String(checked));
  }, []);

  const handleSpellCorrectionChange = useCallback((checked: boolean) => {
    setSpellCorrection(checked);
    localStorage.setItem(PREF_SPELL_CORRECTION, String(checked));
  }, []);

  const handleAutoLoadMicChange = useCallback((checked: boolean) => {
    setAutoLoadMic(checked);
    setBooleanPreference(PREF_AUTO_LOAD_MIC, checked);
  }, []);

  // Spell dictionary data
  const { data: corrections = [], isLoading: isLoadingCorrections } = useSpellCorrections();
  const { data: suggestions = [] } = useSpellSuggestions('pending');
  const addCorrection = useAddSpellCorrection();
  const deleteCorrection = useDeleteSpellCorrection();
  const submitSuggestion = useSubmitSpellSuggestion();
  const approveSuggestion = useApproveSpellSuggestion();
  const rejectSuggestion = useRejectSpellSuggestion();

  // Form state for adding corrections/suggestions
  const [wrongWord, setWrongWord] = useState('');
  const [correctWord, setCorrectWord] = useState('');

  const handleAddOrSuggest = useCallback(async () => {
    if (!wrongWord.trim() || !correctWord.trim()) {
      toaster.create({ title: 'Both fields required', type: 'warning', duration: 2000 });
      return;
    }

    try {
      if (isSuperuser) {
        await addCorrection.mutateAsync({ wrong_word: wrongWord.trim(), correct_word: correctWord.trim() });
        toaster.create({ title: 'Correction added', type: 'success', duration: 2000 });
      } else {
        await submitSuggestion.mutateAsync({ wrong_word: wrongWord.trim(), correct_word: correctWord.trim() });
        toaster.create({ title: 'Suggestion submitted', type: 'success', duration: 2000 });
      }
      setWrongWord('');
      setCorrectWord('');
    } catch (err) {
      toaster.create({ title: 'Failed', description: (err as Error).message, type: 'error', duration: 3000 });
    }
  }, [wrongWord, correctWord, isSuperuser, addCorrection, submitSuggestion]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteCorrection.mutateAsync(id);
      toaster.create({ title: 'Deleted', type: 'info', duration: 1500 });
    } catch (err) {
      toaster.create({ title: 'Delete failed', description: (err as Error).message, type: 'error', duration: 3000 });
    }
  }, [deleteCorrection]);

  const handleApprove = useCallback(async (id: string) => {
    try {
      await approveSuggestion.mutateAsync(id);
      toaster.create({ title: 'Approved', type: 'success', duration: 1500 });
    } catch (err) {
      toaster.create({ title: 'Approve failed', description: (err as Error).message, type: 'error', duration: 3000 });
    }
  }, [approveSuggestion]);

  const handleReject = useCallback(async (id: string) => {
    try {
      await rejectSuggestion.mutateAsync({ suggestionId: id });
      toaster.create({ title: 'Rejected', type: 'info', duration: 1500 });
    } catch (err) {
      toaster.create({ title: 'Reject failed', description: (err as Error).message, type: 'error', duration: 3000 });
    }
  }, [rejectSuggestion]);

  return (
    <VStack align="stretch" gap={6}>
      {/* Writing Preferences */}
      <Box p={4} bg={cardBg} border="1px" borderColor={borderColor} borderRadius="md">
        <Heading size="sm" mb={4}>Writing Preferences</Heading>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Box>
              <Text fontWeight="medium">Auto Load Mic</Text>
              <Text fontSize="xs" color={mutedColor}>
                Preload microphone on Seed Capture page for faster voice notes.
              </Text>
            </Box>
            <Switch.Root
              checked={autoLoadMic}
              onCheckedChange={(e) => handleAutoLoadMicChange(e.checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>

          <HStack justify="space-between">
            <Box>
              <Text fontWeight="medium">Auto-capitalize sentences</Text>
              <Text fontSize="xs" color={mutedColor}>
                Capitalize first letter after . ! ?
              </Text>
            </Box>
            <Switch.Root
              checked={autoCapitalize}
              onCheckedChange={(e) => handleAutoCapitalizeChange(e.checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>

          <HStack justify="space-between">
            <Box>
              <Text fontWeight="medium">Spell correction popup</Text>
              <Text fontSize="xs" color={mutedColor}>
                Cmd+double-click to correct words
              </Text>
            </Box>
            <Switch.Root
              checked={spellCorrection}
              onCheckedChange={(e) => handleSpellCorrectionChange(e.checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>
        </VStack>
      </Box>

      {/* Spell Dictionary */}
      <Box p={4} bg={cardBg} border="1px" borderColor={borderColor} borderRadius="md">
        <HStack justify="space-between" mb={4}>
          <Box>
            <Heading size="sm">Spell Dictionary</Heading>
            <Text fontSize="xs" color={mutedColor}>
              {corrections.length} corrections
            </Text>
          </Box>
        </HStack>

        {/* Add/Suggest Form */}
        <HStack gap={2} mb={4}>
          <Input
            value={wrongWord}
            onChange={(e) => setWrongWord(e.target.value)}
            placeholder="Wrong word"
            size="sm"
            flex="1"
          />
          <Text color={mutedColor}>→</Text>
          <Input
            value={correctWord}
            onChange={(e) => setCorrectWord(e.target.value)}
            placeholder="Correct word"
            size="sm"
            flex="1"
          />
          <Button
            size="sm"
            colorScheme={isSuperuser ? 'blue' : 'gray'}
            onClick={handleAddOrSuggest}
            loading={addCorrection.isPending || submitSuggestion.isPending}
          >
            {isSuperuser ? 'Add' : 'Suggest'}
          </Button>
        </HStack>

        {/* Corrections Table */}
        {isLoadingCorrections ? (
          <Text fontSize="sm" color={mutedColor}>Loading...</Text>
        ) : corrections.length === 0 ? (
          <Text fontSize="sm" color={mutedColor}>No corrections yet</Text>
        ) : (
          <Box maxH="300px" overflowY="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Wrong</Table.ColumnHeader>
                  <Table.ColumnHeader>Correct</Table.ColumnHeader>
                  <Table.ColumnHeader>Used</Table.ColumnHeader>
                  {isSuperuser && <Table.ColumnHeader w="60px"></Table.ColumnHeader>}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {corrections.map((c) => (
                  <Table.Row key={c.id}>
                    <Table.Cell fontFamily="mono" fontSize="xs" color="red.500" textDecoration="line-through">
                      {c.wrong_word}
                    </Table.Cell>
                    <Table.Cell fontFamily="mono" fontSize="xs">
                      {c.correct_word}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge size="xs" colorScheme="gray">{c.usage_count}</Badge>
                    </Table.Cell>
                    {isSuperuser && (
                      <Table.Cell>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(c.id)}
                        >
                          ×
                        </Button>
                      </Table.Cell>
                    )}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>

      {/* Pending Suggestions (superuser only) */}
      {isSuperuser && suggestions.length > 0 && (
        <Box p={4} bg={cardBg} border="1px" borderColor="orange.300" borderRadius="md">
          <HStack justify="space-between" mb={4}>
            <Box>
              <Heading size="sm">Pending Suggestions</Heading>
              <Text fontSize="xs" color={mutedColor}>
                {suggestions.length} awaiting review
              </Text>
            </Box>
          </HStack>

          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Wrong</Table.ColumnHeader>
                <Table.ColumnHeader>Suggested</Table.ColumnHeader>
                <Table.ColumnHeader>By</Table.ColumnHeader>
                <Table.ColumnHeader w="120px"></Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {suggestions.map((s) => (
                <Table.Row key={s.id}>
                  <Table.Cell fontFamily="mono" fontSize="xs">{s.wrong_word}</Table.Cell>
                  <Table.Cell fontFamily="mono" fontSize="xs">{s.correct_word}</Table.Cell>
                  <Table.Cell fontSize="xs" color={mutedColor}>{s.suggested_by_username}</Table.Cell>
                  <Table.Cell>
                    <HStack gap={1}>
                      <Button
                        size="xs"
                        colorScheme="green"
                        onClick={() => handleApprove(s.id)}
                        loading={approveSuggestion.isPending}
                      >
                        ✓
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleReject(s.id)}
                        loading={rejectSuggestion.isPending}
                      >
                        ×
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </VStack>
  );
}
