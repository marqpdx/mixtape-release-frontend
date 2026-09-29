// components/writing/composer/CategoryInput.tsx
/**
 * Category input with autocomplete, similar detection, and creation.
 * Mirrors TagInput but hits the categories endpoint.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  HStack,
  VStack,
  Input,
  Text,
  Badge,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";
import { useColorModeValue } from "@components/ui/color-mode";

export interface Category {
  id: number;
  title: string;
  slug: string;
  color?: string;
  usage_count: number;
}

interface CategoryInputProps {
  selectedCategories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  maxCategories?: number;
  placeholder?: string;
  inputSize?: "sm" | "md" | "lg";
  inputFontSize?: string;
  inputBg?: string;
  inputBorderColor?: string;
  inputFocusBorderColor?: string;
}

export function CategoryInput({
  selectedCategories,
  onCategoriesChange,
  maxCategories = 10,
  placeholder = "Type to search or create categories...",
  inputSize = "md",
  inputFontSize,
  inputBg,
  inputBorderColor,
  inputFocusBorderColor,
}: CategoryInputProps) {
  const dropdownBg = useColorModeValue("white", "gray.900");
  const dropdownBorder = useColorModeValue("gray.200", "gray.700");
  const rowSelected = useColorModeValue("gray.100", "gray.800");
  const warningBg = useColorModeValue("orange.50", "orange.950");
  const secondaryText = useColorModeValue("gray.600", "gray.400");
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Category[]>([]);
  const [similarWarning, setSimilarWarning] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getErrorMessage = useCallback((error: unknown): string => {
    if (error && typeof error === "object") {
      const data = (error as { response?: { data?: { title?: string[] } } }).response
        ?.data;
      if (data?.title?.[0]) return data.title[0];
    }
    if (error instanceof Error) return error.message;
    return "Please try again";
  }, []);

  const levenshteinDistance = useCallback((a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }, []);

  const checkSimilarCategories = useCallback(
    (input: string, categories: Category[]): Category | null => {
      const normalized = input.toLowerCase().trim();
      const singularized = normalized
        .replace(/ies$/, "y")
        .replace(/es$/, "e")
        .replace(/s$/, "");
      for (const category of categories) {
        const categoryNormalized = category.title.toLowerCase();
        if (normalized === categoryNormalized) continue;
        const categorySingularized = categoryNormalized
          .replace(/ies$/, "y")
          .replace(/es$/, "e")
          .replace(/s$/, "");
        if (singularized === categorySingularized) return category;
        if (levenshteinDistance(normalized, categoryNormalized) <= 2) return category;
      }
      return null;
    },
    [levenshteinDistance]
  );

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
        const response = await axiosInstance.get("/api/classifications/categories", {
          params: { search: inputValue },
        });
        const existingCategories = response.data.results || response.data;
        const filtered = existingCategories.filter(
          (category: Category) =>
            !selectedCategories.find((c) => c.id === category.id)
        );
        filtered.sort((a: Category, b: Category) => b.usage_count - a.usage_count);
        setSuggestions(filtered);
        const similar = checkSimilarCategories(inputValue, existingCategories);
        if (similar && !selectedCategories.find((c) => c.id === similar.id)) {
          setSimilarWarning(similar);
        } else {
          setSimilarWarning(null);
        }
        setIsOpen(true);
        setHighlightedIndex(0);
      } catch (err) {
        console.error("Failed to fetch category suggestions:", err);
      } finally {
        setLoading(false);
      }
    };
    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, selectedCategories, checkSimilarCategories]);

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addCategory = (category: Category) => {
    if (selectedCategories.length >= maxCategories) {
      toaster.create({
        title: `Maximum ${maxCategories} categories allowed`,
        type: "warning",
      });
      return;
    }
    onCategoriesChange([...selectedCategories, category]);
    setInputValue("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeCategory = (categoryId: number) => {
    onCategoriesChange(selectedCategories.filter((c) => c.id !== categoryId));
  };

  const createCategory = async () => {
    if (!inputValue.trim()) return;
    try {
      const response = await axiosInstance.post("/api/classifications/categories", {
        title: inputValue.trim(),
      });
      addCategory(response.data);
    } catch (err) {
      toaster.create({
        title: "Failed to create category",
        description: getErrorMessage(err),
        type: "error",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        createCategory();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length
      );
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      addCategory(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <Box position="relative">
      <VStack align="stretch" gap={2}>
        <HStack wrap="wrap" gap={2}>
          {selectedCategories.map((category) => (
            <Badge key={category.id} variant="subtle">
              {category.title}
              <Button
                size="xs"
                variant="ghost"
                ml={1}
                onClick={() => removeCategory(category.id)}
              >
                ×
              </Button>
            </Badge>
          ))}
        </HStack>

        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          size={inputSize}
          fontSize={inputFontSize}
          bg={inputBg}
          borderColor={inputBorderColor}
          _focus={{ borderColor: inputFocusBorderColor }}
        />

        <Text fontSize="xs" color={secondaryText}>
          {selectedCategories.length} / {maxCategories} categories
        </Text>
      </VStack>

      {isOpen && (suggestions.length > 0 || inputValue.length >= 2) && (
        <Box
          ref={dropdownRef}
          position="absolute"
          zIndex={10}
          mt={2}
          w="100%"
          bg={dropdownBg}
          border="1px solid"
          borderColor={dropdownBorder}
          borderRadius="md"
          shadow="md"
          maxH="220px"
          overflowY="auto"
        >
          {similarWarning && (
            <Box p={2} bg={warningBg}>
              <Text fontSize="xs">
                Similar category exists: <strong>{similarWarning.title}</strong>
              </Text>
              <Button
                size="xs"
                mt={1}
                onClick={() => addCategory(similarWarning)}
              >
                Use this instead
              </Button>
            </Box>
          )}

          {loading && (
            <Box p={3} textAlign="center">
              <Spinner size="sm" />
            </Box>
          )}

          {!loading && suggestions.length === 0 && (
            <Box p={2}>
              <Text fontSize="xs">No categories found</Text>
              <Button size="xs" mt={2} variant="outline" onClick={createCategory}>
                Create "{inputValue.trim()}"
              </Button>
            </Box>
          )}

          {!loading &&
            suggestions.map((category, index) => (
              <Box
                key={category.id}
                p={2}
                bg={index === highlightedIndex ? rowSelected : "transparent"}
                cursor="pointer"
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => addCategory(category)}
              >
                <Text fontSize="sm">{category.title}</Text>
                <Text fontSize="xs" color={secondaryText}>
                  Used {category.usage_count} times
                </Text>
              </Box>
            ))}
        </Box>
      )}
    </Box>
  );
}
