"use client";

// Middle column: the notes for the active facet, with one search box that
// matches either the writer's words (literal) or meaning (Stackroom).
// Rows are draggable onto Shape facets.

import { Box, Button, HStack, Input, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { FolioNoteHit, FolioNoteSearchMode } from "@mixtape/api/clients/folio/folioApi";
import { NOTE_DRAG_TYPE, SHAPE_LABELS, noteSnippet, shortDate } from "./shapes";

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
  mode: FolioNoteSearchMode;
  onModeChange: (mode: FolioNoteSearchMode) => void;
  heading: string;
  notes: FolioNoteHit[];
  isLoading: boolean;
  searchUnavailable: boolean;
  selectedId: string | null;
  onSelect: (noteId: string) => void;
};

export default function WorkbenchNoteList({
  query,
  onQueryChange,
  mode,
  onModeChange,
  heading,
  notes,
  isLoading,
  searchUnavailable,
  selectedId,
  onSelect,
}: Props) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const selectedBg = useColorModeValue("gray.100", "gray.700");

  return (
    <VStack className="fwb-notes" align="stretch" gap={3} minW={0}>
      <HStack className="fwb-search" gap={2}>
        <Input
          size="sm"
          placeholder={mode === "semantic" ? "Search by meaning…" : "Search your words…"}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <HStack gap={0} borderWidth="1px" borderColor={borderColor} borderRadius="md" flexShrink={0}>
          <Button size="xs" variant={mode === "literal" ? "solid" : "ghost"} onClick={() => onModeChange("literal")}>
            Words
          </Button>
          <Button size="xs" variant={mode === "semantic" ? "solid" : "ghost"} onClick={() => onModeChange("semantic")}>
            Meaning
          </Button>
        </HStack>
      </HStack>

      <Text fontSize="sm" color={mutedColor}>
        {heading}
      </Text>

      {searchUnavailable && (
        <Text fontSize="sm" color={mutedColor}>
          Meaning search is unavailable right now — try Words.
        </Text>
      )}

      {isLoading ? (
        <Skeleton height="200px" />
      ) : notes.length === 0 && !searchUnavailable ? (
        <Text fontSize="sm" color={mutedColor}>
          {query.trim() ? "No notes match." : "No notes here yet."}
        </Text>
      ) : (
        <VStack align="stretch" gap={1}>
          {notes.map((note) => (
            <Box
              key={note.id}
              as="button"
              textAlign="left"
              draggable
              onDragStart={(event: React.DragEvent) => {
                event.dataTransfer.setData(NOTE_DRAG_TYPE, note.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => onSelect(note.id)}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              px={3}
              py={2}
              bg={note.id === selectedId ? selectedBg : undefined}
              _hover={{ borderColor: "theme.accent" }}
              cursor="grab"
            >
              <Text fontSize="sm" lineClamp={2}>
                {note.status === "processing"
                  ? "Transcribing…"
                  : noteSnippet(note.text) || (note.status === "failed" ? "Transcription failed" : "(empty)")}
              </Text>
              <HStack gap={2} mt={1} fontSize="xs" color={mutedColor}>
                <Text>
                  {SHAPE_LABELS[note.shape]}
                  {note.confirmed_shape ? " ✓" : ""}
                </Text>
                <Text>·</Text>
                <Text>{shortDate(note.created_at)}</Text>
                {note.source_type === "voice" && <Text>· voice</Text>}
                {note.score != null && <Text>· {note.score.toFixed(2)}</Text>}
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
