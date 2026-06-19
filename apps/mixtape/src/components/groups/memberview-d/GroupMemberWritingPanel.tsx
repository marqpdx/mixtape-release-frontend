// apps/mixtape/src/components/groups/memberview-d/GroupMemberWritingPanel.tsx

"use client";

import { Box, Flex, Text, Spinner } from "@chakra-ui/react";
import NextLink from "next/link";
import { IconClock, IconArrowRight } from "@tabler/icons-react";
import { format } from "date-fns";
import { useGroupWritingCatalog } from "@hooks/useWriting";
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

function PieceRow({ piece, groupSlug }: { piece: WritingPieceCatalogItem; groupSlug: string }) {
  const publishedDate = piece.published_at
    ? format(new Date(piece.published_at), "MMM d, yyyy")
    : null;

  return (
    <NextLink
      href={`/groups/${groupSlug}/writing/${piece.slug}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Box
        className="gmwp-piece-row"
        py="14px"
        borderBottomWidth="1px"
        borderColor="theme.border"
        _last={{ borderBottomWidth: 0 }}
        _hover={{ bg: "theme.bgSubtle" }}
        px="4px"
        borderRadius="6px"
        transition="background 0.1s"
        cursor="pointer"
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
    </NextLink>
  );
}

export function GroupMemberWritingPanel({ groupSlug }: GroupMemberWritingPanelProps) {
  const { pieces, isLoading } = useGroupWritingCatalog(groupSlug);

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

  return (
    <Box className="gmwp-root">
      {/* Header row */}
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
        <NextLink
          href={`/groups/${groupSlug}/writing`}
          style={{ textDecoration: "none" }}
        >
          <Flex
            align="center"
            gap="4px"
            fontSize="12px"
            fontWeight="600"
            color="theme.accent"
            _hover={{ opacity: 0.75 }}
            transition="opacity 0.1s"
            cursor="pointer"
          >
            <Text>Full catalog</Text>
            <IconArrowRight size={13} />
          </Flex>
        </NextLink>
      </Flex>

      {/* Named series */}
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
            <PieceRow key={piece.id} piece={piece} groupSlug={groupSlug} />
          ))}
        </Box>
      ))}

      {/* Uncategorized */}
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
            <PieceRow key={piece.id} piece={piece} groupSlug={groupSlug} />
          ))}
        </Box>
      )}
    </Box>
  );
}
