"use client";

// Right column: one note — the writer's words, Shape correction, tending's
// summary, mention → Entity association, related notes, move to another
// Folio, and provenance (build plan §38: what the writer gave, what
// transcription produced, what the model inferred, what the writer changed).

import { Box, Button, Collapsible, Heading, HStack, NativeSelect, Separator, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { Folio, FolioNote, FolioNoteShape, WriterEntity } from "@mixtape/api/clients/folio/folioApi";
import { useRelatedFolioNotes } from "@mixtape/api/hooks/folio";
import WorkbenchMentions from "./WorkbenchMentions";
import { SHAPE_LABELS, SHAPE_ORDER, noteSnippet, shortDate } from "./shapes";

type Props = {
  folioId: string;
  note: FolioNote;
  folios: Folio[];
  entities: WriterEntity[];
  busy: boolean;
  onShape: (shape: FolioNoteShape | "") => void;
  onConfirmMention: (index: number, payload: { entity_id: string } | { name: string; kind?: string }) => void;
  onUnlinkMention: (index: number) => void;
  onMove: (targetFolioId: string) => void;
  onSelectNote: (note: FolioNote) => void;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Heading size="xs" mb={2}>
        {title}
      </Heading>
      {children}
    </Box>
  );
}

export default function WorkbenchNoteDetail({
  folioId,
  note,
  folios,
  entities,
  busy,
  onShape,
  onConfirmMention,
  onUnlinkMention,
  onMove,
  onSelectNote,
}: Props) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const { data: related = [], isLoading: relatedLoading, isError: relatedError } = useRelatedFolioNotes(folioId, note.id);
  const otherFolios = folios.filter((folio) => folio.id !== folioId);

  return (
    <VStack className="fwb-detail" align="stretch" gap={5} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4} minW={0}>
      <Box>
        <Text fontSize="xs" color={mutedColor} mb={1}>
          {note.source_type === "voice" ? "Voice" : "Text"} · {shortDate(note.created_at)}
        </Text>
        {note.status === "processing" ? (
          <Text color={mutedColor}>Transcribing…</Text>
        ) : note.status === "failed" ? (
          <Text color={mutedColor}>Transcription failed. The recording is kept.</Text>
        ) : (
          <Text whiteSpace="pre-wrap">{note.text}</Text>
        )}
      </Box>

      <Section title="Shape">
        <HStack gap={1} wrap="wrap">
          {SHAPE_ORDER.map((shape) => {
            const isCurrent = note.shape === shape;
            return (
              <Button
                key={shape}
                size="xs"
                variant={isCurrent ? "solid" : "outline"}
                disabled={busy}
                // Tapping the writer's confirmed Shape again clears it back to the suggestion.
                onClick={() => onShape(note.confirmed_shape === shape ? "" : shape)}
              >
                {SHAPE_LABELS[shape]}
                {isCurrent && (note.confirmed_shape ? " ✓" : " ▾")}
              </Button>
            );
          })}
        </HStack>
        <Text fontSize="xs" color={mutedColor} mt={1}>
          {note.confirmed_shape
            ? "Your choice. Select it again to return to the suggestion."
            : note.suggested_shape
              ? "Suggested. Choose a Shape to confirm or change it."
              : "Unplaced — its role can stay open."}
        </Text>
      </Section>

      {note.summary && (
        <Section title="Summary">
          <Text fontSize="sm">{note.summary}</Text>
        </Section>
      )}

      <Section title="Mentions">
        <WorkbenchMentions note={note} entities={entities} onConfirm={onConfirmMention} onUnlink={onUnlinkMention} busy={busy} />
      </Section>

      <Section title="Related">
        {relatedLoading ? (
          <Text fontSize="sm" color={mutedColor}>Finding related notes…</Text>
        ) : relatedError ? (
          <Text fontSize="sm" color={mutedColor}>Related notes are unavailable right now.</Text>
        ) : related.length === 0 ? (
          <Text fontSize="sm" color={mutedColor}>Nothing close yet.</Text>
        ) : (
          <VStack align="stretch" gap={1}>
            {related.map((hit) => (
              <Box key={hit.id} as="button" textAlign="left" onClick={() => onSelectNote(hit)} _hover={{ color: "theme.accent" }}>
                <Text fontSize="sm" lineClamp={1}>
                  {noteSnippet(hit.text, 90)}
                </Text>
                <Text fontSize="xs" color={mutedColor}>
                  {SHAPE_LABELS[hit.shape]}
                  {hit.score != null ? ` · ${hit.score.toFixed(2)}` : ""}
                </Text>
              </Box>
            ))}
          </VStack>
        )}
      </Section>

      {otherFolios.length > 0 && (
        <Section title="Move to Folio">
          <NativeSelect.Root size="xs" disabled={busy}>
            <NativeSelect.Field
              aria-label="Move to Folio"
              value=""
              onChange={(event) => {
                if (event.currentTarget.value) onMove(event.currentTarget.value);
              }}
            >
              <option value="">Choose a Folio…</option>
              {otherFolios.map((folio) => (
                <option key={folio.id} value={folio.id}>
                  {folio.title || "Untitled Folio"}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Section>
      )}

      <Separator />

      <Collapsible.Root className="fwb-provenance">
        <Collapsible.Trigger asChild>
          <Button size="xs" variant="ghost" alignSelf="flex-start">
            Provenance
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <VStack align="stretch" gap={1} mt={2} fontSize="xs" fontFamily="mono">
            <Text>source: {note.source_type}{note.source ? ` (${note.source})` : ""}</Text>
            {note.source_type === "voice" && <Text>recording kept: {note.has_audio ? "yes" : "no"}</Text>}
            {note.transcript_error && <Text>transcription error: {note.transcript_error}</Text>}
            <Text>
              model suggestion: {note.suggested_shape || "—"}
              {note.shape_confidence != null ? ` / ${note.shape_confidence.toFixed(2)}` : ""}
            </Text>
            <Text>writer&apos;s Shape: {note.confirmed_shape || "—"}</Text>
            <Text>model: {note.tending_model || "—"}</Text>
            <Text>prompt: {note.tending_prompt_version || "—"}</Text>
            <Text>tended: {note.tended_at ? new Date(note.tended_at).toLocaleString() : "not yet"}</Text>
          </VStack>
        </Collapsible.Content>
      </Collapsible.Root>
    </VStack>
  );
}
