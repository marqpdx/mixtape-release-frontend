// components/writing/composer/TagInput.tsx
/**
 * Smart tag input with autocomplete, similar tag detection, and creation
 * - Search existing tags as you type
 * - Detects similar tags (e.g., "bakery" vs "bakeries")
 * - Create new tags on the fly
 * - Keyboard navigation support
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  HStack,
  VStack,
  Input,
  Text,
  Badge,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import { toaster } from '@mixtape/core/lib/toaster';

export interface Tag {
  id: number;
  title: string;
  slug: string;
  color?: string;
  usage_count: number;
}

interface TagInputProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  maxTags?: number;
  placeholder?: string;
  inputSize?: "sm" | "md" | "lg";
  inputFontSize?: string;
  inputBg?: string;
  inputBorderColor?: string;
  inputFocusBorderColor?: string;
}

export function TagInput({
  selectedTags,
  onTagsChange,
  maxTags = 10,
  placeholder = 'Type to search or create tags...',
  inputSize = "md",
  inputFontSize,
  inputBg,
  inputBorderColor,
  inputFocusBorderColor,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [similarWarning, setSimilarWarning] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getErrorMessage = useCallback((error: unknown): string => {
    if (error && typeof error === 'object') {
      const data = (error as { response?: { data?: { title?: string[] } } }).response?.data;
      if (data?.title?.[0]) return data.title[0];
    }
    if (error instanceof Error) return error.message;
    return 'Please try again';
  }, []);

  /**
   * Calculate Levenshtein distance (edit distance)
   * Used to detect typos like "bakery" vs "bakerys"
   */
  const levenshteinDistance = useCallback((a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }, []);

  /**
   * Fuzzy match to detect similar tags
   * Detects: plurals, typos, case differences
   */
  const checkSimilarTags = useCallback((input: string, tags: Tag[]): Tag | null => {
    const normalized = input.toLowerCase().trim();

    // Check for plurals: remove trailing 's', 'es', 'ies'
    const singularized = normalized
      .replace(/ies$/, 'y')
      .replace(/es$/, 'e')
      .replace(/s$/, '');

    for (const tag of tags) {
      const tagNormalized = tag.title.toLowerCase();

      // Skip exact matches
      if (normalized === tagNormalized) continue;

      const tagSingularized = tagNormalized
        .replace(/ies$/, 'y')
        .replace(/es$/, 'e')
        .replace(/s$/, '');

      // Check if roots are the same (handles plural/singular)
      if (singularized === tagSingularized) {
        return tag;
      }

      // Check Levenshtein distance (typos within 2 characters)
      if (levenshteinDistance(normalized, tagNormalized) <= 2) {
        return tag;
      }
    }

    return null;
  }, [levenshteinDistance]);

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length < 2) {
        setSuggestions([]);
        setSimilarWarning(null);
        setHighlightedIndex(0);
        return;
      }

      setLoading(true);
      try {
        // Search for existing tags
        const response = await axiosInstance.get('/api/classifications/tags', {
          params: { search: inputValue }
        });

        const existingTags = response.data.results || response.data;

        // Filter out already selected tags
        const filtered = existingTags.filter(
          (tag: Tag) => !selectedTags.find(t => t.id === tag.id)
        );

        // Sort by usage count (most used first)
        filtered.sort((a: Tag, b: Tag) => b.usage_count - a.usage_count);

        setSuggestions(filtered);

        // Check for similar tags (fuzzy matching)
        const similar = checkSimilarTags(inputValue, existingTags);
        if (similar && !selectedTags.find(t => t.id === similar.id)) {
          setSimilarWarning(similar);
        } else {
          setSimilarWarning(null);
        }

        setIsOpen(true);
        setHighlightedIndex(0);
      } catch (err) {
        console.error('Failed to fetch tag suggestions:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, selectedTags, checkSimilarTags]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Select existing tag from suggestions
   */
  const handleSelectTag = (tag: Tag) => {
    if (selectedTags.length >= maxTags) {
      toaster.create({
        title: 'Maximum tags reached',
        description: `You can only add up to ${maxTags} tags`,
        type: 'warning',
      });
      return;
    }

    onTagsChange([...selectedTags, tag]);
    setInputValue('');
    setSuggestions([]);
    setSimilarWarning(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  /**
   * Create new tag
   */
  const handleCreateTag = async () => {
    const trimmed = inputValue.trim();

    if (!trimmed) return;

    if (selectedTags.length >= maxTags) {
      toaster.create({
        title: 'Maximum tags reached',
        description: `You can only add up to ${maxTags} tags`,
        type: 'warning',
      });
      return;
    }

    // Check if tag already exists (case-insensitive)
    const existingTag = suggestions.find(
      t => t.title.toLowerCase() === trimmed.toLowerCase()
    );

    if (existingTag) {
      handleSelectTag(existingTag);
      return;
    }

    try {
      setLoading(true);

      // Create new tag
      const response = await axiosInstance.post('/api/classifications/tags', {
        title: trimmed
      });

      const newTag = response.data;
      onTagsChange([...selectedTags, newTag]);

      toaster.create({
        title: 'Tag created',
        description: `New tag "${newTag.title}" has been created`,
        type: 'success',
      });

      setInputValue('');
      setSuggestions([]);
      setSimilarWarning(null);
      setIsOpen(false);
      inputRef.current?.focus();
    } catch (error) {
      toaster.create({
        title: 'Failed to create tag',
        description: getErrorMessage(error),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove tag from selection
   */
  const handleRemoveTag = (tagId: number) => {
    onTagsChange(selectedTags.filter(t => t.id !== tagId));
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key === 'ArrowDown') {
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;

      case 'Enter':
        e.preventDefault();

        if (suggestions.length > 0 && highlightedIndex < suggestions.length) {
          // Select highlighted suggestion
          handleSelectTag(suggestions[highlightedIndex]);
        } else if (inputValue.trim()) {
          // Create new tag
          handleCreateTag();
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;

      case 'Tab':
        if (suggestions.length > 0) {
          e.preventDefault();
          handleSelectTag(suggestions[highlightedIndex]);
        }
        break;
    }
  };

  const showDropdown = isOpen && (
    suggestions.length > 0 ||
    similarWarning ||
    inputValue.length >= 2
  );

  return (
    <VStack align="stretch" gap={3} position="relative">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <HStack wrap="wrap" gap={2}>
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              colorScheme="blue"
              size="lg"
              px={3}
              py={1.5}
              borderRadius="full"
              cursor="pointer"
              display="flex"
              alignItems="center"
              gap={1}
              onClick={() => handleRemoveTag(tag.id)}
              _hover={{ bg: 'red.100' }}
              transition="all 0.2s"
            >
              <Text fontSize="sm">{tag.title}</Text>
              <Text fontSize="sm" fontWeight="bold" ml={1}>×</Text>
            </Badge>
          ))}
        </HStack>
      )}

      {/* Input */}
      <Box position="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={selectedTags.length >= maxTags}
          size={inputSize}
          fontSize={inputFontSize}
          bg={inputBg}
          borderColor={inputBorderColor}
          _focus={{ borderColor: inputFocusBorderColor }}
        />

        {loading && (
          <Box
            position="absolute"
            right={3}
            top="50%"
            transform="translateY(-50%)"
          >
            <Spinner size="sm" />
          </Box>
        )}

        {/* Suggestions Dropdown */}
        {showDropdown && (
          <Box
            ref={dropdownRef}
            position="absolute"
            top="100%"
            left={0}
            right={0}
            mt={1}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            boxShadow="lg"
            maxH="220px"
            overflowY="auto"
            zIndex={1000}
          >
            {/* Similar tag warning */}
            {similarWarning && (
              <Box
                p={2}
                bg="orange.50"
                borderBottom="1px solid"
                borderColor="orange.200"
                cursor="pointer"
                onClick={() => handleSelectTag(similarWarning)}
                _hover={{ bg: 'orange.100' }}
              >
                <Text fontSize="xs" color="orange.900" fontWeight="medium">
                  ⚠️ Similar tag exists: "{similarWarning.title}"
                </Text>
                <Text fontSize="xs" color="orange.700" mt={0.5}>
                  Click to use this instead
                </Text>
              </Box>
            )}

            {/* Existing tag suggestions */}
            {suggestions.length > 0 ? (
              <VStack align="stretch" gap={0}>
                {suggestions.map((tag, index) => (
                  <Box
                    key={tag.id}
                    p={2}
                    cursor="pointer"
                    bg={index === highlightedIndex ? 'blue.50' : 'white'}
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => handleSelectTag(tag)}
                    borderBottom={
                      index < suggestions.length - 1 ? '1px solid' : 'none'
                    }
                    borderColor="gray.100"
                  >
                    <HStack justify="space-between">
                      <VStack align="start" gap={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {tag.title}
                        </Text>
                        {tag.usage_count > 0 && (
                          <Text fontSize="xs" color="gray.500">
                            Used {tag.usage_count} time{tag.usage_count !== 1 ? 's' : ''}
                          </Text>
                        )}
                      </VStack>
                      {index === highlightedIndex && (
                        <Text fontSize="xs" color="blue.600">
                          ↵
                        </Text>
                      )}
                    </HStack>
                  </Box>
                ))}
              </VStack>
            ) : inputValue.trim().length >= 2 && !loading ? (
              <HStack p={2} gap={2} align="center">
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="blue"
                  onClick={handleCreateTag}
                >
                  Create "{inputValue.trim()}"
                </Button>
                <Text fontSize="xs" color="gray.600">
                  No existing tags found
                </Text>
              </HStack>
            ) : null}
          </Box>
        )}
      </Box>

      {/* Helper text */}
      <Text fontSize="xs" color="gray.500" mt={-2}>
        {selectedTags.length} / {maxTags} tags
        {' • '}
        Type to search, Enter to create, Esc to close
      </Text>
    </VStack>
  );
}
