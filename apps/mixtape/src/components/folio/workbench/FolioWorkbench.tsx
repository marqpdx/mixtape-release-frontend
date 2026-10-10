"use client";

// Folio Notes PoC Phase 5 — Desktop Workbench (build plan §34, §55):
// browsing, correction, association, retrieval and light rearrangement over
// one Folio's notes. Not a manuscript editor; arranging notes into Chapters
// and Scenes is the Storyboard's job.
//
//   ┌ Facets ──────┬ Notes (search) ───────┬ Selected note ───────┐
//   │ Recent/Shape │ words | meaning       │ text, Shape, mentions │
//   │ Entities     │ draggable rows        │ related, provenance   │
//   └──────────────┴───────────────────────┴───────────────────────┘

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Box, Grid, Heading, HStack, Link, NativeSelect, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { toaster } from "@components/ui/toaster";
import type {
  FolioNote,
  FolioNoteSearchMode,
  FolioNoteSearchParams,
  FolioNoteShape,
} from "@mixtape/api/clients/folio/folioApi";
import {
  useConfirmFolioNoteMention,
  useFolioNoteFacets,
  useFolios,
  useMoveFolioNote,
  useSearchFolioNotes,
  useUnlinkFolioNoteMention,
  useUpdateFolioNoteShape,
  useWriterEntities,
} from "@mixtape/api/hooks/folio";
import WorkbenchFacets, { type WorkbenchFacet } from "./WorkbenchFacets";
import WorkbenchNoteDetail from "./WorkbenchNoteDetail";
import WorkbenchNoteList from "./WorkbenchNoteList";
import { SHAPE_LABELS } from "./shapes";

function errorMessage(error: unknown): string {
  const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail || (error instanceof Error ? error.message : "Something went wrong.");
}

export default function FolioWorkbench({ folioId }: { folioId: string }) {
  const router = useRouter();
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const [facet, setFacet] = useState<WorkbenchFacet>({ kind: "recent" });
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [mode, setMode] = useState<FolioNoteSearchMode>("semantic");
  const [selected, setSelected] = useState<FolioNote | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const params = useMemo<FolioNoteSearchParams>(() => {
    const next: FolioNoteSearchParams = { limit: 50 };
    if (debouncedQuery) {
      next.q = debouncedQuery;
      next.mode = mode;
    }
    if (facet.kind === "shape") next.shape = facet.shape;
    if (facet.kind === "entity") next.entity = facet.id;
    return next;
  }, [debouncedQuery, mode, facet]);

  const { data: folios = [] } = useFolios();
  const { data: facets, isLoading: facetsLoading } = useFolioNoteFacets(folioId);
  const { data: entities = [] } = useWriterEntities();
  const search = useSearchFolioNotes(folioId, params);
  const notes = useMemo(() => search.data?.results ?? [], [search.data]);
  const searchUnavailable = Boolean(debouncedQuery && mode === "semantic" && search.isError);

  const shapeMutation = useUpdateFolioNoteShape(folioId);
  const confirmMutation = useConfirmFolioNoteMention(folioId);
  const unlinkMutation = useUnlinkFolioNoteMention(folioId);
  const moveMutation = useMoveFolioNote(folioId);
  const busy = shapeMutation.isPending || confirmMutation.isPending || unlinkMutation.isPending || moveMutation.isPending;

  // Keep the open note fresh when the list refetches.
  useEffect(() => {
    if (!selected) return;
    const fresh = notes.find((note) => note.id === selected.id);
    if (fresh && fresh.updated_at !== selected.updated_at) setSelected(fresh);
  }, [notes, selected]);

  // Switching Folio starts fresh.
  useEffect(() => {
    setSelected(null);
    setFacet({ kind: "recent" });
    setQuery("");
  }, [folioId]);

  const folio = folios.find((item) => item.id === folioId);
  const onError = (title: string) => (error: unknown) =>
    toaster.create({ title, description: errorMessage(error), type: "error" });

  const setShape = (noteId: string, shape: FolioNoteShape | "") =>
    shapeMutation.mutate(
      { noteId, confirmedShape: shape },
      {
        onSuccess: (note) => {
          if (selected?.id === note.id) setSelected(note);
        },
        onError: onError("Could not change the Shape"),
      },
    );

  const heading =
    facet.kind === "recent"
      ? debouncedQuery ? "All notes" : "Most recent"
      : facet.kind === "shape"
        ? SHAPE_LABELS[facet.shape]
        : `Mentioning ${facet.name}`;

  return (
    <Box className="fwb-root" px={{ base: 4, md: 6 }} py={6} maxW="1600px" mx="auto">
      <HStack className="fwb-header" justify="space-between" align="flex-end" mb={6} gap={4} wrap="wrap">
        <VStack align="flex-start" gap={0}>
          <Link asChild fontSize="sm" color={mutedColor}>
            <NextLink href="/folio">All Folios</NextLink>
          </Link>
          <Heading size="lg">{folio ? folio.title || "Untitled Folio" : "Folio"}</Heading>
          <Text fontSize="sm" color={mutedColor}>
            Workbench — browse, correct and connect your notes. Capture happens in the mobile app.
          </Text>
        </VStack>
        {folios.length > 1 && (
          <NativeSelect.Root size="sm" w="240px">
            <NativeSelect.Field
              aria-label="Switch Folio"
              value={folioId}
              onChange={(event) => router.push(`/folio/${event.currentTarget.value}/notes`)}
            >
              {folios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title || "Untitled Folio"}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        )}
      </HStack>

      <Grid
        className="fwb-columns"
        templateColumns={{ base: "1fr", lg: "220px minmax(0, 1fr) minmax(320px, 420px)" }}
        gap={6}
        alignItems="start"
      >
        <WorkbenchFacets
          facets={facets}
          isLoading={facetsLoading}
          active={facet}
          onSelect={setFacet}
          onDropOnShape={(noteId, shape) => setShape(noteId, shape)}
        />

        <WorkbenchNoteList
          query={query}
          onQueryChange={setQuery}
          mode={mode}
          onModeChange={setMode}
          heading={heading}
          notes={searchUnavailable ? [] : notes}
          isLoading={search.isLoading}
          searchUnavailable={searchUnavailable}
          selectedId={selected?.id ?? null}
          onSelect={(noteId) => setSelected(notes.find((note) => note.id === noteId) ?? null)}
        />

        <Box className="fwb-detail-col" position={{ lg: "sticky" }} top={{ lg: 4 }}>
          {selected ? (
            <WorkbenchNoteDetail
              folioId={folioId}
              note={selected}
              folios={folios}
              entities={entities}
              busy={busy}
              onShape={(shape) => setShape(selected.id, shape)}
              onConfirmMention={(index, payload) =>
                confirmMutation.mutate(
                  { noteId: selected.id, index, payload },
                  { onSuccess: setSelected, onError: onError("Could not link the mention") },
                )
              }
              onUnlinkMention={(index) =>
                unlinkMutation.mutate(
                  { noteId: selected.id, index },
                  { onSuccess: setSelected, onError: onError("Could not unlink the mention") },
                )
              }
              onMove={(targetFolioId) =>
                moveMutation.mutate(
                  { noteId: selected.id, targetFolioId },
                  {
                    onSuccess: () => {
                      const target = folios.find((item) => item.id === targetFolioId);
                      toaster.create({ title: `Moved to ${target?.title || "another Folio"}`, type: "success" });
                      setSelected(null);
                    },
                    onError: onError("Could not move the note"),
                  },
                )
              }
              onSelectNote={(note) => setSelected(notes.find((item) => item.id === note.id) ?? note)}
            />
          ) : (
            <Text className="fwb-detail-empty" fontSize="sm" color={mutedColor} pt={2}>
              Select a note to see it in full.
            </Text>
          )}
        </Box>
      </Grid>
    </Box>
  );
}
