'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Box, HStack, Input, Text, VStack } from '@chakra-ui/react';

export interface MemberCandidate {
  id: number | string;
  displayName: string;
  username: string;
  badge?: string;
}

interface MemberPickerProps {
  candidates: MemberCandidate[];
  selected: (number | string)[];
  onToggle: (id: number | string) => void;
  multiSelect?: boolean;
  searchable?: boolean;
  placeholder?: string;
  maxH?: string;
  emptyText?: string;
}

export function MemberPicker({
  candidates,
  selected,
  onToggle,
  multiSelect = true,
  searchable = true,
  placeholder = 'Search by name or username…',
  maxH = '220px',
  emptyText = 'No members available.',
}: MemberPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return candidates;
    const q = query.toLowerCase();
    return candidates.filter(
      c =>
        c.displayName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q)
    );
  }, [candidates, query]);

  const selectedSet = useMemo(() => new Set(selected.map(String)), [selected]);

  return (
    <Box className="mp-root">
      {searchable && candidates.length > 0 && (
        <Input
          className="mp-search"
          size="sm"
          placeholder={placeholder}
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          mb={2}
        />
      )}

      {candidates.length === 0 ? (
        <Text fontSize="sm" color="gray.500" py={2}>{emptyText}</Text>
      ) : filtered.length === 0 ? (
        <Text fontSize="sm" color="gray.400" py={2} textAlign="center">
          No results for &ldquo;{query}&rdquo;
        </Text>
      ) : (
        <Box
          className="mp-list"
          maxH={maxH}
          overflowY="auto"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          _dark={{ borderColor: 'gray.700' }}
        >
          <VStack gap={0} align="stretch">
            {filtered.map(candidate => {
              const isSelected = selectedSet.has(String(candidate.id));
              return (
                <HStack
                  key={candidate.id}
                  className="mp-row"
                  px={3}
                  py={2}
                  cursor="pointer"
                  bg={isSelected ? 'blue.50' : 'white'}
                  _hover={{ bg: isSelected ? 'blue.100' : 'gray.50' }}
                  _dark={{
                    bg: isSelected ? 'blue.950' : 'gray.800',
                    _hover: { bg: isSelected ? 'blue.900' : 'gray.700' },
                    borderColor: 'gray.700',
                  }}
                  borderBottomWidth="1px"
                  borderColor="gray.100"
                  _last={{ borderBottomWidth: '0' }}
                  onClick={() => {
                    if (!multiSelect) {
                      if (!isSelected) onToggle(candidate.id);
                    } else {
                      onToggle(candidate.id);
                    }
                  }}
                  gap={2}
                >
                  {/* Checkbox / radio indicator */}
                  <Box
                    w="16px"
                    h="16px"
                    flexShrink={0}
                    borderRadius={multiSelect ? 'sm' : 'full'}
                    borderWidth="2px"
                    borderColor={isSelected ? 'blue.500' : 'gray.300'}
                    bg={isSelected ? 'blue.500' : 'transparent'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {isSelected && (
                      <Box
                        w={multiSelect ? '8px' : '6px'}
                        h={multiSelect ? '8px' : '6px'}
                        bg="white"
                        borderRadius={multiSelect ? 'xs' : 'full'}
                      />
                    )}
                  </Box>

                  <VStack align="start" gap={0} flex={1} minW={0}>
                    <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                      {candidate.displayName}
                    </Text>
                    <Text fontSize="xs" color="gray.500">@{candidate.username}</Text>
                  </VStack>

                  {candidate.badge && (
                    <Text
                      fontSize="xs"
                      px={1.5}
                      py={0.5}
                      bg="green.100"
                      color="green.700"
                      borderRadius="sm"
                      _dark={{ bg: 'green.900', color: 'green.300' }}
                    >
                      {candidate.badge}
                    </Text>
                  )}
                </HStack>
              );
            })}
          </VStack>
        </Box>
      )}
    </Box>
  );
}
