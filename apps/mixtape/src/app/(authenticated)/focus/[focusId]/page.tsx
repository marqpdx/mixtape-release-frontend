"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  IconButton,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { IconChevronDown, IconChevronUp, IconStar, IconStarFilled } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { TipTapRenderer, type TipTapDocument } from "@components/tiptap/TipTapRenderer";
import { useFocus } from "@mixtape/api/hooks/useFocus";
import { useIssue } from "@mixtape/api/hooks/useIssueBoard";
import { useWriting } from "@mixtape/api/hooks/useWriting";

// Focus-Centered Writing ADR (decisions/focus-centered-writing-adr/,
// puddlejump), Phase 2, FCW-6: the Focus view itself -- issue header,
// reorderable sequence with a starred primary piece, and an
// unassigned-docs candidate panel. Deliberately NOT built here (later
// checkpoints): row tools / Shape-Meta panel (FCW-7), the Edit instrument
// (FCW-8), the Sections instrument (FCW-9), Focus entry points (FCW-10),
// and Resolution (FCW-11).

export default function FocusViewPage({ params }: { params: Promise<{ focusId: string }> }) {
  const { focusId } = use(params);
  const { focus, isLoading: focusLoading, updateState } = useFocus(focusId);
  const issueId = focus?.object_type === "issue" ? focus.object_id : null;
  const { issue, isLoading: issueLoading, addPlacement, removePlacement, setPlacementLead, reorderPlacements } = useIssue(issueId);

  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  // Restore the last selection from Focus.state on load (exact resume --
  // ADR §6's `state` JSON) even though there's no dedicated piece route yet.
  useEffect(() => {
    if (focus?.state?.selected_piece_id && selectedPieceId === null) {
      setSelectedPieceId(focus.state.selected_piece_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.id]);

  const sponsorSlug = issue?.sponsor_slug ?? "";
  const sponsorType = issue?.sponsor_type === "group" ? "group" : "member";
  const { drafts, isLoading: draftsLoading } = useWriting(sponsorType, sponsorSlug);

  const placedPieceIds = useMemo(
    () => new Set((issue?.placements ?? []).map((p) => p.piece_id)),
    [issue?.placements],
  );
  const candidates = useMemo(
    () => drafts.filter((d) => d.piece.status === "draft" && !placedPieceIds.has(d.piece.id)),
    [drafts, placedPieceIds],
  );

  const handleSelect = (pieceId: string) => {
    setSelectedPieceId(pieceId);
    updateState.mutate({ selected_piece_id: pieceId });
  };

  const handleMove = (pieceId: string, direction: -1 | 1) => {
    if (!issue) return;
    const ordered = [...issue.placements].sort((a, b) => a.order_index - b.order_index);
    const index = ordered.findIndex((p) => p.piece_id === pieceId);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= ordered.length) return;
    const ids = ordered.map((p) => p.piece_id);
    [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];
    reorderPlacements.mutate(ids);
  };

  if (focusLoading || (issueId && issueLoading)) {
    return (
      <Container className="focus-view-root" maxW="900px" py={12}>
        <Skeleton height="200px" />
      </Container>
    );
  }

  if (!focus) {
    return (
      <Container className="focus-view-root" maxW="900px" py={12}>
        <Text color={mutedColor}>Focus not found.</Text>
      </Container>
    );
  }

  if (focus.status !== "active") {
    return (
      <Container className="focus-view-root" maxW="900px" py={12}>
        <Text color={mutedColor}>
          This focus is {focus.status}. {focus.status === "resolved" ? "It was already published." : "Its target no longer exists."}
        </Text>
      </Container>
    );
  }

  if (!issue) {
    return (
      <Container className="focus-view-root" maxW="900px" py={12}>
        <Text color={mutedColor}>Issue not found.</Text>
      </Container>
    );
  }

  const ordered = [...issue.placements].sort((a, b) => a.order_index - b.order_index);

  return (
    <Container className="focus-view-root" maxW="1000px" py={10}>
      <Box className="focus-view-header" mb={8}>
        {issue.designation && (
          <Text fontSize="sm" color={mutedColor} mb={1}>
            {issue.designation}
          </Text>
        )}
        <Heading size="lg" mb={3}>{issue.title || "Untitled Issue"}</Heading>
        {issue.description && (
          <Box fontSize="sm" color={mutedColor}>
            <TipTapRenderer content={issue.description as unknown as TipTapDocument} />
          </Box>
        )}
      </Box>

      <Box className="focus-view-sequence" mb={8}>
        <Text fontSize="sm" fontWeight="600" mb={2}>
          Sequence
        </Text>
        <VStack align="stretch" gap={0} borderWidth="1px" borderColor={borderColor} borderRadius="md">
          {ordered.length === 0 && (
            <Text p={4} color={mutedColor} fontSize="sm">
              No pieces in this Issue yet -- add one from the candidates below.
            </Text>
          )}
          {ordered.map((placement, index) => (
            <HStack
              key={placement.id}
              className="focus-sequence-row"
              p={3}
              gap={3}
              borderTopWidth={index === 0 ? "0" : "1px"}
              borderColor={borderColor}
              bg={selectedPieceId === placement.piece_id ? "theme.bgSecondary" : undefined}
              cursor="pointer"
              onClick={() => handleSelect(placement.piece_id)}
            >
              <VStack gap={0}>
                <IconButton
                  aria-label="Move up"
                  size="2xs"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleMove(placement.piece_id, -1); }}
                >
                  <IconChevronUp size={14} />
                </IconButton>
                <IconButton
                  aria-label="Move down"
                  size="2xs"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleMove(placement.piece_id, 1); }}
                >
                  <IconChevronDown size={14} />
                </IconButton>
              </VStack>
              <IconButton
                aria-label={placement.is_lead ? "Primary piece" : "Mark as primary"}
                size="xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setPlacementLead.mutate({ pieceId: placement.piece_id, isLead: !placement.is_lead });
                }}
              >
                {placement.is_lead ? <IconStarFilled size={16} /> : <IconStar size={16} />}
              </IconButton>
              <Text flex="1">{placement.piece_title || "Untitled"}</Text>
              <Text fontSize="xs" color={mutedColor}>{placement.word_count} words</Text>
              <Button
                size="xs"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); removePlacement.mutate(placement.piece_id); }}
              >
                Remove
              </Button>
            </HStack>
          ))}
        </VStack>
      </Box>

      <Box className="focus-view-candidates">
        <Text fontSize="sm" fontWeight="600" mb={2}>
          Unassigned docs
        </Text>
        <VStack align="stretch" gap={0} borderWidth="1px" borderColor={borderColor} borderRadius="md">
          {draftsLoading && <Skeleton height="60px" />}
          {!draftsLoading && candidates.length === 0 && (
            <Text p={4} color={mutedColor} fontSize="sm">
              No unassigned drafts in this sponsor.
            </Text>
          )}
          {candidates.map((draft, index) => (
            <HStack
              key={draft.piece.id}
              p={3}
              gap={3}
              borderTopWidth={index === 0 ? "0" : "1px"}
              borderColor={borderColor}
            >
              <Text flex="1">{draft.piece.title || "Untitled"}</Text>
              <Button size="xs" variant="outline" onClick={() => addPlacement.mutate(draft.piece.id)}>
                Add to issue
              </Button>
            </HStack>
          ))}
        </VStack>
      </Box>
    </Container>
  );
}
