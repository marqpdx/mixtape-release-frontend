// components/writing/draft-room/AtelierShapeTab.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import {
  TagInput,
  Tag,
} from "@components/writing/composer/TagInput";
import {
  CategoryInput,
  Category,
} from "@components/writing/composer/CategoryInput";
import { Divider } from "@/components/common/Divider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReadinessState = "untouched" | "partial" | "confirmed" | "deferred";

interface Readiness {
  tags: ReadinessState;
  category: ReadinessState;
  summaries: ReadinessState;
  series: ReadinessState;
  relations: ReadinessState;
  overall: ReadinessState;
}

interface SummaryField {
  text: string;
  confirmed: boolean;
}

interface Summaries {
  public_synopsis: SummaryField;
  linkedin_synopsis: SummaryField;
  internal_abstract: SummaryField;
}

interface SeriesOption {
  id: string;
  title: string;
  slug: string;
}

interface AtelierShapeTabProps {
  pieceSlug: string;
  pieceId: string;
  onTagsChange?: (tags: Tag[]) => void;
  onCategoriesChange?: (categories: Category[]) => void;
  initialTags?: Tag[];
  initialCategories?: Category[];
}

// ---------------------------------------------------------------------------
// Readiness circle
// ---------------------------------------------------------------------------

function ReadinessDot({ state, label }: { state: ReadinessState; label: string }) {
  const colors: Record<ReadinessState, string> = {
    untouched: "orange.400",
    partial: "yellow.400",
    confirmed: "green.400",
    deferred: "gray.400",
  };
  const textColor = useColorModeValue("gray.600", "gray.300");
  return (
    <HStack gap={2}>
      <Box w="8px" h="8px" borderRadius="full" bg={colors[state]} flexShrink={0} />
      <Text fontSize="xs" color={textColor} w="80px">
        {label}
      </Text>
      {state === "deferred" && (
        <Text fontSize="xs" color={textColor}>
          Phase 2
        </Text>
      )}
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AtelierShapeTab({
  pieceSlug,
  pieceId,
  onTagsChange,
  onCategoriesChange,
  initialTags = [],
  initialCategories = [],
}: AtelierShapeTabProps) {
  const textSecondary = useColorModeValue("gray.600", "gray.300");
  const inputBg = useColorModeValue("gray.50", "gray.900");
  const inputBorder = useColorModeValue("gray.200", "gray.700");
  const inputFocusBorder = useColorModeValue("blue.400", "blue.300");
  const sectionBorder = useColorModeValue("gray.100", "gray.700");

  // Readiness
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);

  // Tags / categories (kept in sync with parent via callbacks)
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  // Summaries
  const [summaries, setSummaries] = useState<Summaries | null>(null);
  const [summariesLoading, setSummariesLoading] = useState(false);
  const [savingSummary, setSavingSummary] = useState<string | null>(null);

  // Series
  const [currentSeries, setCurrentSeries] = useState<SeriesOption | null>(null);
  const [availableSeries, setAvailableSeries] = useState<SeriesOption[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesSearch, setSeriesSearch] = useState("");

  const fetchReadiness = useCallback(() => {
    setReadinessLoading(true);
    axiosInstance
      .get(`/api/atelier/${pieceSlug}/readiness/`)
      .then((res) => setReadiness(res.data as Readiness))
      .catch(() => setReadiness(null))
      .finally(() => setReadinessLoading(false));
  }, [pieceSlug]);

  const fetchSummaries = useCallback(() => {
    setSummariesLoading(true);
    axiosInstance
      .get(`/api/atelier/${pieceSlug}/summaries/`)
      .then((res) => setSummaries(res.data as Summaries))
      .catch(() => setSummaries(null))
      .finally(() => setSummariesLoading(false));
  }, [pieceSlug]);

  const fetchSeries = useCallback(() => {
    setSeriesLoading(true);
    axiosInstance
      .get(`/api/atelier/${pieceSlug}/series/`)
      .then((res) => {
        const data = res.data as { current: SeriesOption | null; available: SeriesOption[] };
        setCurrentSeries(data.current);
        setAvailableSeries(data.available);
      })
      .catch(() => {
        setCurrentSeries(null);
        setAvailableSeries([]);
      })
      .finally(() => setSeriesLoading(false));
  }, [pieceSlug]);

  useEffect(() => {
    if (!pieceSlug) return;
    fetchReadiness();
    fetchSummaries();
    fetchSeries();
  }, [pieceSlug, fetchReadiness, fetchSummaries, fetchSeries]);

  // Refresh readiness after any mutation
  const refreshReadiness = useCallback(() => {
    void fetchReadiness();
  }, [fetchReadiness]);

  // Tags
  const handleTagsChange = (next: Tag[]) => {
    setTags(next);
    onTagsChange?.(next);
    setTimeout(refreshReadiness, 500);
  };

  // Categories
  const handleCategoriesChange = (next: Category[]) => {
    setCategories(next);
    onCategoriesChange?.(next);
    setTimeout(refreshReadiness, 500);
  };

  // Summaries — patch a single field
  const handleSummaryBlur = (field: keyof Summaries, text: string) => {
    setSavingSummary(field);
    axiosInstance
      .patch(`/api/atelier/${pieceSlug}/summaries/`, { [field]: text })
      .then((res) => {
        setSummaries(res.data as Summaries);
        refreshReadiness();
      })
      .finally(() => setSavingSummary(null));
  };

  // Summaries — confirm
  const handleConfirm = (type: keyof Summaries) => {
    setSavingSummary(type + "_confirm");
    axiosInstance
      .post(`/api/atelier/${pieceSlug}/summaries/confirm/`, { types: [type] })
      .then((res) => {
        setSummaries(res.data as Summaries);
        refreshReadiness();
      })
      .finally(() => setSavingSummary(null));
  };

  // Series — set
  const handleSetSeries = (series: SeriesOption) => {
    axiosInstance
      .put(`/api/atelier/${pieceSlug}/series/`, { series_id: series.id })
      .then(() => {
        setCurrentSeries(series);
        refreshReadiness();
      });
  };

  // Series — clear
  const handleClearSeries = () => {
    axiosInstance
      .delete(`/api/atelier/${pieceSlug}/series/`)
      .then(() => {
        setCurrentSeries(null);
        refreshReadiness();
      });
  };

  const filteredSeries = availableSeries.filter((s) =>
    s.title.toLowerCase().includes(seriesSearch.toLowerCase())
  );

  void pieceId;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <VStack align="stretch" gap={4}>

      {/* Readiness overview */}
      <Box borderBottomWidth="1px" borderColor={sectionBorder} pb={4}>
        <HStack justify="space-between" mb={3}>
          <Text fontSize="sm" fontWeight="semibold">
            Craft Readiness
          </Text>
          {readinessLoading && <Spinner size="xs" />}
        </HStack>
        {readiness ? (
          <HStack gap={6} flexWrap="wrap">
            <ReadinessDot state={readiness.tags} label="Tags" />
            <ReadinessDot state={readiness.category} label="Category" />
            <ReadinessDot state={readiness.summaries} label="Summaries" />
            <ReadinessDot state={readiness.series} label="Series" />
            <ReadinessDot state={readiness.relations} label="Relations" />
          </HStack>
        ) : (
          !readinessLoading && (
            <Text fontSize="xs" color={textSecondary}>
              Readiness unavailable.
            </Text>
          )
        )}
      </Box>

      {/* Tags */}
      <Box borderBottomWidth="1px" borderColor={sectionBorder} pb={4}>
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          Tags
        </Text>
        <TagInput
          selectedTags={tags}
          onTagsChange={handleTagsChange}
          maxTags={10}
          inputSize="sm"
          inputFontSize="sm"
          inputBg={inputBg}
          inputBorderColor={inputBorder}
          inputFocusBorderColor={inputFocusBorder}
        />
      </Box>

      {/* Category */}
      <Box borderBottomWidth="1px" borderColor={sectionBorder} pb={4}>
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          Category
        </Text>
        <CategoryInput
          selectedCategories={categories}
          onCategoriesChange={handleCategoriesChange}
          maxCategories={1}
          inputSize="sm"
          inputFontSize="sm"
          inputBg={inputBg}
          inputBorderColor={inputBorder}
          inputFocusBorderColor={inputFocusBorder}
        />
      </Box>

      {/* Summaries */}
      <Box borderBottomWidth="1px" borderColor={sectionBorder} pb={4}>
        <Text fontSize="sm" fontWeight="medium" mb={3}>
          Summaries
        </Text>
        {summariesLoading && <Spinner size="sm" />}
        {summaries && (
          <VStack align="stretch" gap={4}>
            {(
              [
                ["public_synopsis", "Public synopsis"],
                ["linkedin_synopsis", "LinkedIn synopsis"],
                ["internal_abstract", "Internal abstract"],
              ] as [keyof Summaries, string][]
            ).map(([field, label]) => (
              <Box key={field}>
                <HStack justify="space-between" mb={1}>
                  <HStack gap={2}>
                    <Box
                      w="6px"
                      h="6px"
                      borderRadius="full"
                      flexShrink={0}
                      bg={summaries[field].confirmed ? "green.400" : "orange.400"}
                    />
                    <Text fontSize="xs" fontWeight="medium">
                      {label}
                    </Text>
                  </HStack>
                  <Button
                    size="xs"
                    variant={summaries[field].confirmed ? "solid" : "outline"}
                    colorScheme={summaries[field].confirmed ? "green" : "gray"}
                    disabled={
                      summaries[field].confirmed ||
                      !summaries[field].text ||
                      savingSummary === field + "_confirm"
                    }
                    onClick={() => handleConfirm(field)}
                  >
                    {summaries[field].confirmed ? "Confirmed" : "Confirm"}
                  </Button>
                </HStack>
                <Textarea
                  size="sm"
                  rows={3}
                  defaultValue={summaries[field].text}
                  placeholder={`Write ${label.toLowerCase()}…`}
                  bg={inputBg}
                  borderColor={inputBorder}
                  _focus={{ borderColor: inputFocusBorder }}
                  fontSize="sm"
                  onBlur={(e) => handleSummaryBlur(field, e.target.value)}
                  disabled={savingSummary === field}
                />
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {/* Series */}
      <Box>
        <HStack justify="space-between" mb={2}>
          <Text fontSize="sm" fontWeight="medium">
            Series
          </Text>
          {seriesLoading && <Spinner size="xs" />}
        </HStack>

        {currentSeries ? (
          <HStack>
            <Box
              flex="1"
              px={3}
              py={1.5}
              borderWidth="1px"
              borderColor={inputBorder}
              borderRadius="md"
              bg={inputBg}
              fontSize="sm"
            >
              {currentSeries.title}
            </Box>
            <Button size="sm" variant="ghost" onClick={handleClearSeries}>
              Remove
            </Button>
          </HStack>
        ) : (
          <VStack align="stretch" gap={2}>
            <Text fontSize="xs" color={textSecondary}>
              No series set.
            </Text>
            {availableSeries.length > 0 && (
              <>
                <input
                  style={{
                    padding: "4px 8px",
                    border: `1px solid`,
                    borderRadius: "6px",
                    fontSize: "13px",
                    background: "transparent",
                  }}
                  placeholder="Search series…"
                  value={seriesSearch}
                  onChange={(e) => setSeriesSearch(e.target.value)}
                />
                <VStack align="stretch" gap={1} maxH="140px" overflowY="auto">
                  {filteredSeries.map((s) => (
                    <Box
                      key={s.id}
                      px={3}
                      py={1.5}
                      borderWidth="1px"
                      borderColor={sectionBorder}
                      borderRadius="md"
                      cursor="pointer"
                      fontSize="sm"
                      _hover={{ bg: inputBg }}
                      onClick={() => handleSetSeries(s)}
                    >
                      {s.title}
                    </Box>
                  ))}
                  {filteredSeries.length === 0 && (
                    <Text fontSize="xs" color={textSecondary}>
                      No match.
                    </Text>
                  )}
                </VStack>
              </>
            )}
          </VStack>
        )}
      </Box>

      <Divider />
    </VStack>
  );
}
