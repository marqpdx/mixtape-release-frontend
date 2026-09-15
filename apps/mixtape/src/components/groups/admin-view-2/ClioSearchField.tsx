"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  HStack,
  Input,
  Spinner,
  Text,
  Link,
} from "@chakra-ui/react";
import { IconSearch, IconX, IconExternalLink } from "@tabler/icons-react";
import {
  groupSearch,
  type GroupSearchResponse,
  type GroupSearchSource,
} from "@mixtape/api/clients/switchboard/switchboardApi";

// ─── GroupSearchResultPane ────────────────────────────────────────────────────

interface GroupSearchResultPaneProps {
  result: GroupSearchResponse;
  onDismiss: () => void;
}

function GroupSearchResultPane({ result, onDismiss }: GroupSearchResultPaneProps) {
  return (
    <Box
      className="clio-result-pane"
      position="absolute"
      top="calc(100% + 6px)"
      left={0}
      right={0}
      zIndex={200}
      bg="theme.surface"
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="xl"
      boxShadow="lg"
      p={4}
      minW="320px"
    >
      {/* Dismiss button */}
      <Box
        as="button"
        position="absolute"
        top={2.5}
        right={2.5}
        p={1}
        borderRadius="md"
        color="theme.textSecondary"
        _hover={{ bg: "theme.bgSecondary", color: "theme.text" }}
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <IconX size={14} />
      </Box>

      {/* Answer */}
      <Text fontSize="sm" mb={result.sources.length > 0 ? 3 : 0} pr={6} lineHeight="1.6">
        {result.answer}
      </Text>

      {/* Sources */}
      {result.sources.length > 0 && (
        <Box borderTopWidth="1px" borderColor="theme.border" pt={2.5}>
          <Text fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="wider" color="theme.textSecondary" mb={1.5}>
            Sources
          </Text>
          <Flex direction="column" gap={1}>
            {result.sources.map((source: GroupSearchSource, i: number) => (
              <HStack key={i} gap={1.5}>
                <Box color="theme.textSecondary" flexShrink={0}>·</Box>
                <Link
                  href={source.url}
                  fontSize="xs"
                  color="orange.600"
                  _hover={{ textDecoration: "underline" }}
                  display="inline-flex"
                  alignItems="center"
                  gap={0.5}
                >
                  {source.label}
                  <IconExternalLink size={10} />
                </Link>
              </HStack>
            ))}
          </Flex>
        </Box>
      )}

      {/* Phase 2 affordance — broader search */}
      {!result.found && (
        <Box mt={2} pt={2} borderTopWidth="1px" borderColor="theme.border">
          <Text fontSize="xs" color="theme.textSecondary" opacity={0.5} cursor="not-allowed">
            Search across all Mixtape ▶ (coming soon)
          </Text>
        </Box>
      )}
    </Box>
  );
}

// ─── GroupSearchField ─────────────────────────────────────────────────────────

interface GroupSearchFieldProps {
  groupId: string;
  placeholder?: string;
}

export function GroupSearchField({
  groupId,
  placeholder = "Search this group…",
}: GroupSearchFieldProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GroupSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  // Outside click → dismiss
  useEffect(() => {
    if (!result && !error) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        dismiss();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [result, error, dismiss]);

  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await groupSearch({ group_id: groupId, query: trimmed });
      setResult(res);
    } catch {
      setError("Search unavailable — please try again.");
    } finally {
      setLoading(false);
    }
  }, [query, groupId, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") dismiss();
  };

  return (
    <Box ref={wrapperRef} position="relative" flex="1" maxW="480px">
      {/* Search icon / spinner */}
      <Box
        position="absolute"
        left={2.5}
        top="50%"
        transform="translateY(-50%)"
        color="orange.500"
        pointerEvents="none"
        zIndex={1}
      >
        {loading ? <Spinner size="xs" color="orange.500" /> : <IconSearch size={14} />}
      </Box>

      <Input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        size="sm"
        bg="theme.surface"
        borderRadius="lg"
        pl={8}
        pr={query ? 8 : 3}
        disabled={loading}
        _focus={{ borderColor: "orange.400", boxShadow: "0 0 0 1px var(--chakra-colors-orange-400)" }}
      />

      {/* Clear button */}
      {query && !loading && (
        <Box
          as="button"
          position="absolute"
          right={2.5}
          top="50%"
          transform="translateY(-50%)"
          color="theme.textSecondary"
          _hover={{ color: "theme.text" }}
          onClick={() => { setQuery(""); dismiss(); }}
          zIndex={1}
        >
          <IconX size={12} />
        </Box>
      )}

      {/* Result pane */}
      {result && (
        <GroupSearchResultPane result={result} onDismiss={dismiss} />
      )}

      {/* Error pane */}
      {error && (
        <Box
          position="absolute"
          top="calc(100% + 6px)"
          left={0}
          right={0}
          zIndex={200}
          bg="theme.surface"
          borderWidth="1px"
          borderColor="red.200"
          borderRadius="xl"
          boxShadow="lg"
          px={4}
          py={3}
        >
          <Text fontSize="sm" color="red.600">{error}</Text>
        </Box>
      )}
    </Box>
  );
}
