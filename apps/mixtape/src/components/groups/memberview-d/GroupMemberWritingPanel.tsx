// apps/mixtape/src/components/groups/memberview-d/GroupMemberWritingPanel.tsx

"use client";

import { useState, useMemo } from "react";
import { Box, Flex, Text, Spinner } from "@chakra-ui/react";
import { IconClock, IconArrowLeft, IconList, IconFolder } from "@tabler/icons-react";
import { format } from "date-fns";
import { useGroupWritingCatalog, useWritingPiece } from "@hooks/useWriting";
import { TipTapRenderer } from "@components/tiptap/TipTapRenderer";
import type { TipTapDocument } from "@components/tiptap/TipTapRenderer";
import type { WritingPieceCatalogItem, WritingSeries } from "@mixtape/core/types/writingTypes";

interface GroupMemberWritingPanelProps {
  groupSlug: string;
}

interface SeriesGroup {
  series: WritingSeries | null;
  pieces: WritingPieceCatalogItem[];
}

function groupBySeries(pieces: WritingPieceCatalogItem[]): SeriesGroup[] {
  const order: Array<string | null> = [];
  const map = new Map<string | null, WritingPieceCatalogItem[]>();
  for (const piece of pieces) {
    const key = piece.series?.id ?? null;
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(piece);
  }
  return order.map((key) => ({
    series: key ? pieces.find((p) => p.series?.id === key)?.series ?? null : null,
    pieces: map.get(key)!,
  }));
}

// ── Catalog list ───────────────────────────────────────────────────────────

function PieceRow({
  piece,
  onSelect,
}: {
  piece: WritingPieceCatalogItem;
  onSelect: (slug: string) => void;
}) {
  const publishedDate = piece.published_at
    ? format(new Date(piece.published_at), "MMM d, yyyy")
    : null;

  return (
    <Box
      className="gmwp-piece-row"
      as="button"
      w="full"
      textAlign="left"
      py="14px"
      borderBottomWidth="1px"
      borderColor="theme.border"
      _last={{ borderBottomWidth: 0 }}
      _hover={{ bg: "theme.bgSubtle" }}
      px="4px"
      borderRadius="6px"
      transition="background 0.1s"
      cursor="pointer"
      onClick={() => onSelect(piece.slug)}
    >
      <Text
        fontSize="14.5px"
        fontWeight="600"
        color="theme.text"
        lineHeight="1.3"
        mb={piece.excerpt ? "4px" : 0}
      >
        {piece.title}
      </Text>
      {piece.excerpt && (
        <Text
          fontSize="13px"
          color="theme.textSecondary"
          lineHeight="1.5"
          mb="6px"
          lineClamp={2}
        >
          {piece.excerpt}
        </Text>
      )}
      <Flex align="center" gap="8px" fontSize="12px" color="theme.textMuted" flexWrap="wrap">
        {piece.author_name && <Text>{piece.author_name}</Text>}
        {publishedDate && (
          <>
            <Text>·</Text>
            <Text>{publishedDate}</Text>
          </>
        )}
        {piece.reading_time != null && piece.reading_time > 0 && (
          <>
            <Text>·</Text>
            <Flex align="center" gap="3px">
              <IconClock size={11} />
              <Text>{piece.reading_time} min</Text>
            </Flex>
          </>
        )}
      </Flex>
    </Box>
  );
}

function groupByCategory(pieces: WritingPieceCatalogItem[]): Array<{ categoryTitle: string; pieces: WritingPieceCatalogItem[] }> {
  const order: string[] = [];
  const map = new Map<string, WritingPieceCatalogItem[]>();
  const uncatKey = "__uncategorized__";

  for (const piece of pieces) {
    const cats = piece.categories_list;
    if (!cats || cats.length === 0) {
      if (!map.has(uncatKey)) { map.set(uncatKey, []); order.push(uncatKey); }
      map.get(uncatKey)!.push(piece);
    } else {
      cats.forEach((cat) => {
        if (!map.has(cat.id)) { map.set(cat.id, []); order.push(cat.id); }
        map.get(cat.id)!.push(piece);
      });
    }
  }

  return order.map((key) => ({
    categoryTitle: key === uncatKey ? "" : pieces.find((p) => p.categories_list?.some((c) => c.id === key))?.categories_list?.find((c) => c.id === key)?.title ?? key,
    pieces: map.get(key)!,
  }));
}

function WritingCatalog({
  groupSlug,
  onSelect,
}: {
  groupSlug: string;
  onSelect: (slug: string) => void;
}) {
  const { pieces, isLoading } = useGroupWritingCatalog(groupSlug);
  const [viewMode, setViewMode] = useState<"series" | "folders">("series");

  const hasCategoryData = useMemo(
    () => pieces.some((p) => p.categories_list && p.categories_list.length > 0),
    [pieces]
  );

  if (isLoading) {
    return (
      <Flex justify="center" py={12}>
        <Spinner size="sm" color="theme.accent" />
      </Flex>
    );
  }

  if (pieces.length === 0) {
    return (
      <Box
        className="gmwp-empty"
        bg="theme.surface"
        borderWidth="1px"
        borderColor="theme.border"
        borderRadius="16px"
        px={5}
        py={10}
        textAlign="center"
      >
        <Text fontSize="15px" fontWeight="600" color="theme.text" mb="6px">
          Nothing published yet.
        </Text>
        <Text fontSize="13px" color="theme.textMuted">
          Check back later for writing from this group.
        </Text>
      </Box>
    );
  }

  const seriesGroups = groupBySeries(pieces);
  const namedGroups = seriesGroups.filter((g) => g.series !== null);
  const uncategorized = seriesGroups.find((g) => g.series === null);

  const categoryGroups = groupByCategory(pieces);
  const namedCatGroups = categoryGroups.filter((g) => g.categoryTitle !== "");
  const uncatPieces = categoryGroups.find((g) => g.categoryTitle === "")?.pieces ?? [];

  return (
    <Box className="gmwp-catalog">
      {/* Header with view toggle */}
      <Flex align="center" justify="space-between" mb={5}>
        <Text
          fontSize="11.5px"
          fontWeight="600"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="theme.textMuted"
        >
          Published Writing
        </Text>
        {hasCategoryData && (
          <Flex gap="4px">
            <Box
              as="button"
              px="8px"
              py="4px"
              borderRadius="6px"
              fontSize="12px"
              fontWeight="600"
              display="flex"
              alignItems="center"
              gap="4px"
              bg={viewMode === "series" ? "theme.accent" : "transparent"}
              color={viewMode === "series" ? "white" : "theme.textMuted"}
              _hover={{ bg: viewMode === "series" ? "theme.accent" : "theme.bgSubtle" }}
              onClick={() => setViewMode("series")}
            >
              <IconList size={12} />
              <Text>List</Text>
            </Box>
            <Box
              as="button"
              px="8px"
              py="4px"
              borderRadius="6px"
              fontSize="12px"
              fontWeight="600"
              display="flex"
              alignItems="center"
              gap="4px"
              bg={viewMode === "folders" ? "theme.accent" : "transparent"}
              color={viewMode === "folders" ? "white" : "theme.textMuted"}
              _hover={{ bg: viewMode === "folders" ? "theme.accent" : "theme.bgSubtle" }}
              onClick={() => setViewMode("folders")}
            >
              <IconFolder size={12} />
              <Text>Folders</Text>
            </Box>
          </Flex>
        )}
      </Flex>

      {viewMode === "folders" ? (
        // Folder / category view
        <>
          {namedCatGroups.map(({ categoryTitle, pieces: catPieces }) => (
            <Box
              key={categoryTitle}
              className="gmwp-category"
              bg="theme.surface"
              borderWidth="1px"
              borderColor="theme.border"
              borderRadius="16px"
              px={5}
              pt={4}
              pb={1}
              mb={4}
            >
              <Flex align="center" gap="6px" mb="10px">
                <IconFolder size={13} color="var(--chakra-colors-theme-accent)" />
                <Text
                  fontSize="11px"
                  fontWeight="700"
                  letterSpacing="0.13em"
                  textTransform="uppercase"
                  color="theme.accent"
                >
                  {categoryTitle}
                </Text>
              </Flex>
              {catPieces.map((piece) => (
                <PieceRow key={piece.id} piece={piece} onSelect={onSelect} />
              ))}
            </Box>
          ))}
          {uncatPieces.length > 0 && (
            <Box
              className="gmwp-cat-uncategorized"
              bg="theme.surface"
              borderWidth="1px"
              borderColor="theme.border"
              borderRadius="16px"
              px={5}
              pt={4}
              pb={1}
            >
              {namedCatGroups.length > 0 && (
                <Text
                  fontSize="11px"
                  fontWeight="700"
                  letterSpacing="0.13em"
                  textTransform="uppercase"
                  color="theme.textMuted"
                  mb="10px"
                >
                  Other
                </Text>
              )}
              {uncatPieces.map((piece) => (
                <PieceRow key={piece.id} piece={piece} onSelect={onSelect} />
              ))}
            </Box>
          )}
        </>
      ) : (
        // Series / list view (existing behaviour)
        <>
          {namedGroups.map(({ series, pieces: sectionPieces }) => (
            <Box
              key={series!.id}
              className="gmwp-series"
              bg="theme.surface"
              borderWidth="1px"
              borderColor="theme.border"
              borderRadius="16px"
              px={5}
              pt={4}
              pb={1}
              mb={4}
            >
              <Text
                fontSize="11px"
                fontWeight="700"
                letterSpacing="0.13em"
                textTransform="uppercase"
                color="theme.accent"
                mb={series!.subtitle ? "2px" : "10px"}
              >
                {series!.title}
              </Text>
              {series!.subtitle && (
                <Text fontSize="13px" color="theme.textSecondary" mb="10px">
                  {series!.subtitle}
                </Text>
              )}
              {sectionPieces.map((piece) => (
                <PieceRow key={piece.id} piece={piece} onSelect={onSelect} />
              ))}
            </Box>
          ))}
          {uncategorized && uncategorized.pieces.length > 0 && (
            <Box
              className="gmwp-uncategorized"
              bg="theme.surface"
              borderWidth="1px"
              borderColor="theme.border"
              borderRadius="16px"
              px={5}
              pt={4}
              pb={1}
            >
              {namedGroups.length > 0 && (
                <Text
                  fontSize="11px"
                  fontWeight="700"
                  letterSpacing="0.13em"
                  textTransform="uppercase"
                  color="theme.textMuted"
                  mb="10px"
                >
                  More
                </Text>
              )}
              {uncategorized.pieces.map((piece) => (
                <PieceRow key={piece.id} piece={piece} onSelect={onSelect} />
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

// ── Inline piece reader ────────────────────────────────────────────────────

function PieceReader({
  pieceSlug,
  onBack,
}: {
  pieceSlug: string;
  onBack: () => void;
}) {
  const { piece, isLoading, error } = useWritingPiece(pieceSlug);

  if (isLoading) {
    return (
      <Flex justify="center" py={16}>
        <Spinner size="sm" color="theme.accent" />
      </Flex>
    );
  }

  if (error || !piece) {
    return (
      <Box
        bg="theme.surface"
        borderWidth="1px"
        borderColor="theme.border"
        borderRadius="16px"
        px={5}
        py={10}
        textAlign="center"
      >
        <Text fontSize="14px" color="theme.textMuted" mb={4}>
          This piece could not be loaded.
        </Text>
        <Box
          as="button"
          fontSize="13px"
          fontWeight="600"
          color="theme.accent"
          cursor="pointer"
          _hover={{ opacity: 0.75 }}
          onClick={onBack}
        >
          ← Back to Writing
        </Box>
      </Box>
    );
  }

  const publishedDate = piece.published_at
    ? format(new Date(piece.published_at), "MMMM d, yyyy")
    : null;

  return (
    <Box className="gmwp-reader">
      {/* Back link */}
      <Flex
        as="button"
        align="center"
        gap="6px"
        mb={6}
        fontSize="13px"
        fontWeight="600"
        color="theme.textMuted"
        cursor="pointer"
        _hover={{ color: "theme.text" }}
        transition="color 0.1s"
        onClick={onBack}
      >
        <IconArrowLeft size={14} />
        <Text>Back to Writing</Text>
      </Flex>

      <Box
        className="gmwp-reader-body"
        bg="theme.surface"
        borderWidth="1px"
        borderColor="theme.border"
        borderRadius="16px"
        px={{ base: 5, md: 8 }}
        py={8}
        maxW="680px"
      >
        {/* Series label */}
        {piece.series && (
          <Text
            fontSize="11px"
            fontWeight="700"
            letterSpacing="0.13em"
            textTransform="uppercase"
            color="theme.accent"
            mb="10px"
          >
            {piece.series.title}
          </Text>
        )}

        {/* Title */}
        <Text
          as="h1"
          fontSize={{ base: "22px", md: "28px" }}
          fontWeight="700"
          lineHeight="1.2"
          letterSpacing="-0.01em"
          color="theme.text"
          mb={3}
        >
          {piece.title}
        </Text>

        {/* Meta */}
        <Flex align="center" gap="8px" fontSize="13px" color="theme.textMuted" mb={6} flexWrap="wrap">
          {piece.author_name && <Text>{piece.author_name}</Text>}
          {publishedDate && (
            <>
              <Text>·</Text>
              <Text>{publishedDate}</Text>
            </>
          )}
          {piece.reading_time != null && piece.reading_time > 0 && (
            <>
              <Text>·</Text>
              <Flex align="center" gap="3px">
                <IconClock size={12} />
                <Text>{piece.reading_time} min read</Text>
              </Flex>
            </>
          )}
        </Flex>

        {/* Excerpt as lede */}
        {piece.excerpt && (
          <>
            <Text
              fontSize="17px"
              lineHeight="1.65"
              color="theme.textSecondary"
              mb={5}
              fontStyle="italic"
            >
              {piece.excerpt}
            </Text>
            <Box borderTopWidth="1px" borderColor="theme.border" mb={6} />
          </>
        )}

        {/* Body */}
        <Box
          fontSize="15px"
          lineHeight="1.85"
          color="theme.text"
          css={{ "& p + p": { marginTop: "1.2em" } }}
        >
          <TipTapRenderer content={piece.body_json as TipTapDocument} />
        </Box>

        {/* Footer back link */}
        <Box borderTopWidth="1px" borderColor="theme.border" mt={10} pt={5}>
          <Flex
            as="button"
            align="center"
            gap="6px"
            fontSize="13px"
            fontWeight="600"
            color="theme.textMuted"
            cursor="pointer"
            _hover={{ color: "theme.text" }}
            transition="color 0.1s"
            onClick={onBack}
          >
            <IconArrowLeft size={14} />
            <Text>Back to Writing</Text>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}

// ── Shell ──────────────────────────────────────────────────────────────────

export function GroupMemberWritingPanel({ groupSlug }: GroupMemberWritingPanelProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  if (selectedSlug) {
    return (
      <PieceReader
        pieceSlug={selectedSlug}
        onBack={() => setSelectedSlug(null)}
      />
    );
  }

  return (
    <WritingCatalog
      groupSlug={groupSlug}
      onSelect={(slug) => {
        setSelectedSlug(slug);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  );
}
