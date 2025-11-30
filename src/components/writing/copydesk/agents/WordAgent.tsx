// src/components/write/copydesk/agents/WordAgent.tsx

import React, { useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Button
} from '@chakra-ui/react';
import { IconBook, IconExternalLink } from '@tabler/icons-react';
import { useColorModeValue } from '@components/ui/color-mode';
import { AgentContainer } from '../shared/AgentContainer';
import { TextSelection } from '../../hooks/useTextSelection';

export interface WordAgentProps {
  selection: TextSelection | null;
  hasSelection: boolean;
}

interface DefinitionResult {
  word: string;
  definition: string;
  sources: Array<{
    title: string;
    url: string;
    excerpt: string;
  }>;
  timestamp: Date;
}

export function WordAgent({ selection, hasSelection }: WordAgentProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [results, setResults] = useState<DefinitionResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Base URL for API calls
  const BASE = process.env.NEXT_PUBLIC_INKWELL_BASE_URL ?? "";

  // Color mode values
  const bgColor = useColorModeValue("white", "#111");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const getStateMessage = (): string => {
    if (!hasSelection) {
      return 'Select a word to define';
    }

    if (selection?.isSingleWord) {
      return `"${selection.text}" selected`;
    }

    return 'Select a single word';
  };

  const handleDefine = async () => {
    if (!selection?.text || !selection.isSingleWord) return;

    setState('loading');

    try {
      const endpoint = `${BASE}/v1/research/define`;
      const requestBody = {
        text: selection.text,
        type: "define",
        context: null
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Definition failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      const newResult: DefinitionResult = {
        word: selection.text,
        definition: data.result,
        sources: data.sources || [],
        timestamp: new Date()
      };

      setResults(prev => [newResult, ...prev.slice(0, 4)]); // Keep last 5 results
      setState('ready');
      setIsExpanded(true);

    } catch (error) {
      console.error('Definition failed:', error);
      setState('error');

      // Show error result
      const errorResult: DefinitionResult = {
        word: selection.text,
        definition: `Definition failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        sources: [],
        timestamp: new Date()
      };
      setResults(prev => [errorResult, ...prev.slice(0, 4)]);
    }
  };

  return (
    <AgentContainer
      id="word-agent"
      title="Word Agent"
      state={hasSelection && selection?.isSingleWord ? (state === 'idle' ? 'ready' : state) : 'idle'}
      stateMessage={getStateMessage()}
      icon={<IconBook size={20} />}
      iconColor="#8B5CF6" // purple-500
      badge={hasSelection && selection?.isSingleWord ? {
        text: 'Word',
        colorScheme: 'purple'
      } : undefined}
    >
      <Box bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor} p={3}>
        <VStack gap={3} align="stretch">

          {/* Selected Word Display */}
          {hasSelection && selection?.isSingleWord && (
            <Box>
              <Text fontSize="xs" fontWeight="medium" mb={1}>
                Selected Word:
              </Text>
              <Box
                p={2}
                bg="purple.50"
                borderRadius="md"
                borderLeft="3px solid"
                borderLeftColor="purple.400"
                fontSize="sm"
              >
                {selection.text}
              </Box>
            </Box>
          )}

          {/* Define Button */}
          {hasSelection && selection?.isSingleWord && (
            <Button
              size="xs"
              colorScheme="purple"
              variant="solid"
              onClick={handleDefine}
              disabled={state === 'loading'}
            >
              <IconBook size={12} />
              Define
            </Button>
          )}

          {/* Loading State */}
          {state === 'loading' && (
            <Box p={3} textAlign="center">
              <Text fontSize="sm" color="purple.600">
                Defining "{selection?.text}..."
              </Text>
            </Box>
          )}

          {/* Error State */}
          {state === 'error' && (
            <Box
              p={2}
              bg="red.50"
              borderRadius="md"
              borderLeft="3px solid"
              borderLeftColor="red.400"
            >
              <Text fontSize="xs" color="red.600">
                Definition failed. Please try again.
              </Text>
            </Box>
          )}

          {/* Results */}
          {results.length > 0 && (
            <>
              <VStack gap={2} align="stretch">
                <HStack justify="space-between" align="center">
                  <Text fontSize="xs" fontWeight="medium">
                    Recent Definitions ({results.length})
                  </Text>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </Button>
                </HStack>

                {/* Results List */}
                {isExpanded && (
                  <VStack gap={2} align="stretch" maxH="300px" overflowY="auto">
                    {results.map((result, index) => (
                      <Box
                        key={index}
                        p={3}
                        bg={bgColor}
                        borderRadius="md"
                        border="1px solid"
                        borderColor={borderColor}
                        borderLeft="3px solid"
                        borderLeftColor="purple.400"
                      >
                        <HStack justify="space-between" align="start" mb={2}>
                          <Badge size="xs" colorScheme="purple">
                            Definition
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            {result.timestamp.toLocaleTimeString()}
                          </Text>
                        </HStack>

                        <Text fontSize="xs" fontWeight="medium" mb={1}>
                          "{result.word}"
                        </Text>

                        <Text fontSize="xs" lineHeight="1.4" mb={2}>
                          {result.definition}
                        </Text>

                        {/* Sources */}
                        {result.sources && result.sources.length > 0 && (
                          <HStack gap={1} mt={2}>
                            <Text fontSize="xs" color="gray.500">Sources:</Text>
                            {result.sources.slice(0, 2).map((source, i) => (
                              <Button
                                key={i}
                                size="xs"
                                variant="ghost"
                                fontSize="xs"
                                color="purple.600"
                                p={0}
                                h="auto"
                                minW="auto"
                                onClick={() => {
                                  if (source.url && source.url !== "#" && source.url !== "") {
                                    window.open(source.url, '_blank');
                                  }
                                }}
                                disabled={!source.url || source.url === "#" || source.url === ""}
                                title={(!source.url || source.url === "#" || source.url === "")
                                  ? "AI Generated - No external source available"
                                  : `Open: ${source.title}`}
                                cursor={(!source.url || source.url === "#" || source.url === "") ? "not-allowed" : "pointer"}
                                opacity={(!source.url || source.url === "#" || source.url === "") ? 0.5 : 1}
                              >
                                <IconExternalLink size={10} />
                              </Button>
                            ))}
                          </HStack>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            </>
          )}

          {/* No Selection State */}
          {(!hasSelection || !selection?.isSingleWord) && (
            <Box p={4} textAlign="center">
              <Text fontSize="sm" mb={2}>
                Select a single word to get definitions, etymology, and usage examples.
              </Text>
              <Text fontSize="xs" color="gray.400">
                Word definitions powered by AI language model
              </Text>
            </Box>
          )}

        </VStack>
      </Box>
    </AgentContainer>
  );
}