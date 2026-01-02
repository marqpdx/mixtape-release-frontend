// src/components/write/copydesk/agents/ResearchAgent.tsx

import React, { useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Badge,
} from '@chakra-ui/react';
import {
  IconSearch,
  IconSparkles,
  IconBulb,
  IconExternalLink
} from '@tabler/icons-react';
import { useColorModeValue } from '@components/ui/color-mode';
import { AgentContainer, AgentState } from '../shared/AgentContainer';
import { TextSelection } from '../../hooks/useTextSelection';
import { Divider } from '@components/common/Divider';

export interface ResearchAgentProps {
  selection: TextSelection | null;
  hasSelection: boolean;
}

interface ResearchResult {
  type: 'define' | 'explain' | 'research' | 'summarize';
  query: string;
  result: string;
  sources?: Array<{
    title: string;
    url: string;
    excerpt: string;
  }>;
  timestamp: Date;
}

export function ResearchAgent({ selection, hasSelection }: ResearchAgentProps) {
  const [state, setState] = useState<AgentState>('idle');
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Base URL for API calls
  const BASE = process.env.NEXT_PUBLIC_INKWELL_BASE_URL ?? "";

  // Color mode values
  const bgColor = useColorModeValue("white", "#111");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Debug logging
  React.useEffect(() => {
    console.log("🔍 ResearchAgent props updated:", { selection, hasSelection });
  }, [selection, hasSelection]);

  const getAgentState = (): AgentState => {
    if (!hasSelection) return 'idle';
    return state;
  };

  const getStateMessage = (): string => {
    if (!hasSelection) {
      return 'Select text to research';
    }

    if (selection?.isSingleWord) {
      return `"${selection.text}" selected`;
    }

    return `${selection?.wordCount} words selected`;
  };

  const handleResearch = async (type: ResearchResult['type']) => {
    if (!selection?.text) return;

    setState('loading');

    try {
      // Call your FastAPI research endpoint
      const endpoint = `${BASE}/v1/research/${type}`;
      const requestBody = {
        text: selection.text,
        type: type,
        context: null // Could add document context here
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
        throw new Error(`Research failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      const newResult: ResearchResult = {
        type,
        query: selection.text,
        result: data.result,
        sources: data.sources || [],
        timestamp: new Date()
      };

      setResults(prev => [newResult, ...prev.slice(0, 4)]); // Keep last 5 results
      setState('ready');
      setIsExpanded(true);

    } catch (error) {
      console.error('Research failed:', error);
      setState('error');

      // Show error result
      const errorResult: ResearchResult = {
        type,
        query: selection.text,
        result: `Research failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        sources: [],
        timestamp: new Date()
      };
      setResults(prev => [errorResult, ...prev.slice(0, 4)]);
    }
  };

  // Remove the mock API - no longer needed

  const getActionButtons = () => {
    if (!hasSelection || !selection) return null;

    if (selection.isSingleWord) {
      return (
        <HStack gap={2} wrap="wrap">
          <Button
            size="xs"
            colorScheme="blue"
            variant="outline"
            onClick={() => handleResearch('explain')}
            disabled={state === 'loading'}
          >
            <IconBulb size={12} />
            Explain
          </Button>
        </HStack>
      );
    }

    return (
      <HStack gap={2} wrap="wrap">
        <Button
          size="xs"
          colorScheme="blue"
          variant="solid"
          onClick={() => handleResearch('summarize')}
          disabled={state === 'loading'}
        >
          <IconSparkles size={12} />
          Summarize
        </Button>
        <Button
          size="xs"
          colorScheme="blue"
          variant="outline"
          onClick={() => handleResearch('research')}
          disabled={state === 'loading'}
        >
          <IconSearch size={12} />
          Research
        </Button>
      </HStack>
    );
  };

  return (
    <AgentContainer
      id="research-agent"
      title="Research Agent"
      state={getAgentState()}
      stateMessage={getStateMessage()}
      icon={<IconSearch size={20} />}
      iconColor="#3B82F6" // blue-500
      badge={hasSelection ? {
        text: selection?.isSingleWord ? 'Word' : 'Text',
        colorScheme: 'blue'
      } : undefined}
    >
      <Box bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor} p={3}>
        <VStack gap={3} align="stretch">

        {/* Selected Text Display */}
        {hasSelection && selection && (
          <Box>
            <Text fontSize="xs" fontWeight="medium" color="gray.600" mb={1}>
              Selected Text:
            </Text>
            <Box
              p={2}
              bg="blue.50"
              borderRadius="md"
              borderLeft="3px solid"
              borderLeftColor="blue.400"
              fontSize="sm"
              maxH="80px"
              overflowY="auto"
            >
              {selection.text}
            </Box>
          </Box>
        )}

        {/* Action Buttons */}
        {getActionButtons()}

        {/* Loading State */}
        {state === 'loading' && (
          <Box p={3} textAlign="center">
            <Text fontSize="sm" color="blue.600">
              Researching "{selection?.text.substring(0, 30)}..."
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
              Research failed. Please try again.
            </Text>
          </Box>
        )}

        {/* Results */}
        {results.length > 0 && (
          <>
            <Divider />
            <VStack gap={2} align="stretch">
              <HStack justify="space-between" align="center">
                <Text fontSize="xs" fontWeight="medium" color="gray.600">
                  Recent Research ({results.length})
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
                      p={2}
                      bg="gray.50"
                      borderRadius="md"
                      borderLeft="2px solid"
                      borderLeftColor="blue.300"
                    >
                      <HStack justify="space-between" align="start" mb={1}>
                        <Badge size="xs" colorScheme="blue" textTransform="capitalize">
                          {result.type}
                        </Badge>
                        <Text fontSize="xs" color="gray.500">
                          {result.timestamp.toLocaleTimeString()}
                        </Text>
                      </HStack>

                      <Text fontSize="xs" fontWeight="medium" color="gray.700" mb={1}>
                        "{result.query}"
                      </Text>

                      <Text fontSize="xs" color="gray.600" lineHeight="1.4">
                        {result.result.substring(0, 150)}
                        {result.result.length > 150 ? '...' : ''}
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
                              color="blue.600"
                              p={0}
                              h="auto"
                              minW="auto"
                              onClick={() => window.open(source.url, '_blank')}
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
        {!hasSelection && (
          <Box p={4} textAlign="center">
            <Text fontSize="sm" mb={2}>
              Select text in your document to research explanations or find related information.
            </Text>
            <Text fontSize="xs" color="gray.400">
              • Multiple words: Get summaries and research
            </Text>
          </Box>
        )}

      </VStack>
      </Box>
    </AgentContainer>
  );
}
