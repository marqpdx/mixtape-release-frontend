"use client";

// Left column: browse a Folio's notes by Recent, Shape, or confirmed Entity.
// Shape rows are drop targets — dropping a note on one sets its Shape
// (build plan §55, light rearrangement). Unplaced is shown as a neutral
// place, not a backlog (§33).

import { useState } from "react";
import { Box, Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { FolioNoteFacets, FolioNoteShape } from "@mixtape/api/clients/folio/folioApi";
import { NOTE_DRAG_TYPE, SHAPE_LABELS, SHAPE_ORDER } from "./shapes";

export type WorkbenchFacet =
  | { kind: "recent" }
  | { kind: "shape"; shape: FolioNoteShape }
  | { kind: "entity"; id: string; name: string };

type Props = {
  facets: FolioNoteFacets | undefined;
  isLoading: boolean;
  active: WorkbenchFacet;
  onSelect: (facet: WorkbenchFacet) => void;
  onDropOnShape: (noteId: string, shape: FolioNoteShape) => void;
};

export default function WorkbenchFacets({ facets, isLoading, active, onSelect, onDropOnShape }: Props) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const activeBg = useColorModeValue("gray.100", "gray.700");
  const dropBg = useColorModeValue("blue.50", "blue.900");
  const [dropTarget, setDropTarget] = useState<FolioNoteShape | null>(null);

  const counts = new Map((facets?.shapes ?? []).map((row) => [row.shape, row.count]));
  const isActive = (facet: WorkbenchFacet) =>
    facet.kind === active.kind &&
    (facet.kind !== "shape" || (active.kind === "shape" && facet.shape === active.shape)) &&
    (facet.kind !== "entity" || (active.kind === "entity" && facet.id === active.id));

  const row = (facet: WorkbenchFacet, label: string, count: number | undefined, extra: object = {}) => (
    <HStack
      key={facet.kind === "shape" ? facet.shape : facet.kind === "entity" ? facet.id : "recent"}
      as="button"
      justify="space-between"
      w="full"
      px={2}
      py={1}
      borderRadius="sm"
      textAlign="left"
      bg={isActive(facet) ? activeBg : undefined}
      _hover={{ bg: activeBg }}
      onClick={() => onSelect(facet)}
      {...extra}
    >
      <Text fontSize="sm" fontWeight={isActive(facet) ? "600" : "400"} truncate>
        {label}
      </Text>
      <Text fontSize="xs" color={mutedColor}>
        {count ?? ""}
      </Text>
    </HStack>
  );

  if (isLoading) {
    return <Skeleton className="fwb-facets" height="240px" />;
  }

  return (
    <VStack className="fwb-facets" align="stretch" gap={4}>
      <VStack align="stretch" gap={0.5}>
        {row({ kind: "recent" }, "Recent", facets?.total)}
      </VStack>

      <Box>
        <Heading size="xs" color={mutedColor} mb={1} px={2}>
          Shapes
        </Heading>
        <VStack align="stretch" gap={0.5}>
          {SHAPE_ORDER.map((shape) =>
            row({ kind: "shape", shape }, SHAPE_LABELS[shape], counts.get(shape) ?? 0, {
              bg: dropTarget === shape ? dropBg : isActive({ kind: "shape", shape }) ? activeBg : undefined,
              onDragOver: (event: React.DragEvent) => {
                if (event.dataTransfer.types.includes(NOTE_DRAG_TYPE)) {
                  event.preventDefault();
                  setDropTarget(shape);
                }
              },
              onDragLeave: () => setDropTarget((current) => (current === shape ? null : current)),
              onDrop: (event: React.DragEvent) => {
                event.preventDefault();
                setDropTarget(null);
                const noteId = event.dataTransfer.getData(NOTE_DRAG_TYPE);
                if (noteId) onDropOnShape(noteId, shape);
              },
            }),
          )}
        </VStack>
        <Text fontSize="xs" color={mutedColor} px={2} mt={1}>
          Drag a note onto a Shape to place it.
        </Text>
      </Box>

      <Box>
        <Heading size="xs" color={mutedColor} mb={1} px={2}>
          Entities
        </Heading>
        {facets?.entities.length ? (
          <VStack align="stretch" gap={0.5}>
            {facets.entities.map((entity) =>
              row({ kind: "entity", id: entity.id, name: entity.name }, entity.name, entity.count),
            )}
          </VStack>
        ) : (
          <Text fontSize="xs" color={mutedColor} px={2}>
            None linked yet. Link a note&apos;s mentions to see them here.
          </Text>
        )}
      </Box>
    </VStack>
  );
}
