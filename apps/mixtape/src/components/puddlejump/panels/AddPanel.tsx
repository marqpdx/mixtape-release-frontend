'use client';

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Textarea,
  Input,
  Badge,
} from '@chakra-ui/react';
import { PlusIcon, ClipboardDocumentIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAdd } from '@mixtape/api/hooks/switchboard';

interface AddPanelProps {
  surface?: 'console' | 'puddlejump';
}

export default function AddPanel({ surface = 'puddlejump' }: AddPanelProps) {
  const { submit, isSubmitting, result, error, reset } = useAdd();

  const [listTitle, setListTitle] = useState('');
  const [itemsText, setItemsText] = useState('');
  const [copied, setCopied] = useState(false);

  const parsedItems = itemsText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const canSubmit = listTitle.trim().length > 0 && parsedItems.length > 0 && !isSubmitting;

  function handleSubmit() {
    if (!canSubmit) return;
    submit({
      list_title: listTitle.trim(),
      items: parsedItems,
      create_if_missing: true,
      surface: surface === 'puddlejump' ? 'desktop' : 'desktop',
    });
  }

  function handleCopy() {
    if (!result?.body_text) return;
    navigator.clipboard.writeText(result.body_text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReset() {
    reset();
    setListTitle('');
    setItemsText('');
    setCopied(false);
  }

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="lg" color="theme.text" mb={1}>
          Add
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          Append items to a named list — creates the list if it doesn't exist
        </Text>
      </Box>

      {/* Form */}
      {!result && (
        <VStack gap={4} align="stretch">
          <Box>
            <Text fontSize="xs" color="theme.textSecondary" mb={1} fontWeight="medium">
              List name
            </Text>
            <Input
              placeholder="e.g. Home Depot, Weekly tasks, Garcia initiative..."
              value={listTitle}
              onChange={(e) => setListTitle(e.target.value)}
              fontSize="sm"
              disabled={isSubmitting}
            />
          </Box>

          <Box>
            <Text fontSize="xs" color="theme.textSecondary" mb={1} fontWeight="medium">
              Items to add{parsedItems.length > 0 && ` (${parsedItems.length})`}
            </Text>
            <Textarea
              placeholder={"bleach\npaper towels\nextra sponges"}
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              minH="120px"
              fontSize="sm"
              disabled={isSubmitting}
              resize="vertical"
            />
            <Text fontSize="xs" color="theme.textSecondary" mt={1}>
              One item per line
            </Text>
          </Box>

          <HStack justify="flex-end">
            <Button
              size="sm"
              colorPalette="blue"
              onClick={handleSubmit}
              disabled={!canSubmit}
              loading={isSubmitting}
            >
              <HStack gap={2}>
                <PlusIcon style={{ width: 16, height: 16 }} />
                <span>Add to list</span>
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
              Failed: {error instanceof Error ? error.message : 'Unknown error'}
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
                {result.title}
              </Text>
              <Badge colorPalette="green" variant="subtle" fontSize="xs">
                +{result.items_added} added
              </Badge>
            </HStack>
            <HStack gap={2}>
              <Button size="xs" variant="ghost" onClick={handleCopy} title="Copy list">
                <HStack gap={1}>
                  <ClipboardDocumentIcon style={{ width: 14, height: 14 }} />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </HStack>
              </Button>
              <Button size="xs" variant="ghost" colorPalette="gray" onClick={handleReset} title="Add more">
                <HStack gap={1}>
                  <ArrowPathIcon style={{ width: 14, height: 14 }} />
                  <span>Add more</span>
                </HStack>
              </Button>
            </HStack>
          </HStack>

          <Box
            p={4}
            bg="theme.surface"
            borderWidth="1px"
            borderColor="theme.border"
            borderRadius="lg"
            borderLeftWidth="3px"
            borderLeftColor="green.400"
          >
            <Text fontSize="sm" color="theme.text" whiteSpace="pre-wrap" fontFamily="mono">
              {result.body_text}
            </Text>
          </Box>
        </VStack>
      )}

      {/* Empty state */}
      {!result && !isSubmitting && !error && listTitle.length === 0 && (
        <Box
          p={8}
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="theme.border"
          borderRadius="lg"
          textAlign="center"
        >
          <Text color="theme.textSecondary" fontSize="sm">
            Name the list and enter items above
          </Text>
          <Text color="theme.textSecondary" fontSize="xs" mt={1}>
            Creates the list if it doesn't exist yet
          </Text>
        </Box>
      )}
    </VStack>
  );
}
