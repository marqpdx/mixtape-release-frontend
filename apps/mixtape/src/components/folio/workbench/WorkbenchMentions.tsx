"use client";

// Mentions on the selected note, and the writer's association of each one to
// an Entity (build plan §55, association). Tending only proposes; nothing is
// linked until the writer chooses an existing Entity or names a new one.
// Entities are the shared storyboard.Entity rows, so a link made here shows
// up in Storyboard and vice versa.

import { useState } from "react";
import { Button, HStack, Input, NativeSelect, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { FolioNote, WriterEntity } from "@mixtape/api/clients/folio/folioApi";

type Mention = FolioNote["mentions"][number];

type Props = {
  note: FolioNote;
  entities: WriterEntity[];
  onConfirm: (index: number, payload: { entity_id: string } | { name: string; kind?: string }) => void;
  onUnlink: (index: number) => void;
  busy: boolean;
};

const NEW = "__new__";

function mentionKind(mention: Mention): string {
  return mention.kind === "place" ? "setting" : mention.kind;
}

function MentionRow({ mention, index, entities, onConfirm, onUnlink, busy }: {
  mention: Mention;
  index: number;
} & Omit<Props, "note">) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const kind = mentionKind(mention);
  const byId = new Map(entities.map((entity) => [entity.id, entity]));
  const confirmed = mention.confirmed_entity_id ? byId.get(mention.confirmed_entity_id) : undefined;
  const suggested = mention.existing_entity_id ? byId.get(mention.existing_entity_id) : undefined;
  const [choice, setChoice] = useState<string>(suggested?.id ?? NEW);
  const [name, setName] = useState(mention.surface);
  // Same-kind Entities first; any Entity can still be chosen.
  const ordered = [...entities].sort((a, b) => Number(b.kind === kind) - Number(a.kind === kind) || a.name.localeCompare(b.name));

  if (mention.confirmed_entity_id) {
    return (
      <HStack justify="space-between" gap={2}>
        <Text fontSize="sm">
          {mention.surface} → <strong>{confirmed?.name ?? "Linked entity"}</strong>
          <Text as="span" color={mutedColor}> · {confirmed?.kind ?? mention.confirmed_kind ?? kind}</Text>
        </Text>
        <Button size="2xs" variant="ghost" disabled={busy} onClick={() => onUnlink(index)}>
          Unlink
        </Button>
      </HStack>
    );
  }

  return (
    <VStack align="stretch" gap={1}>
      <Text fontSize="sm">
        {mention.surface}
        <Text as="span" color={mutedColor}>
          {" "}· {kind}
          {typeof mention.confidence === "number" ? ` · ${Math.round(mention.confidence * 100)}%` : ""}
          {suggested ? ` · looks like ${suggested.name}` : ""}
        </Text>
      </Text>
      <HStack gap={2}>
        <NativeSelect.Root size="xs" flex={1} minW={0}>
          <NativeSelect.Field aria-label={`Link ${mention.surface}`} value={choice} onChange={(event) => setChoice(event.currentTarget.value)}>
            <option value={NEW}>New entity…</option>
            {ordered.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name} · {entity.kind}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        {choice === NEW && (
          <Input size="xs" flex={1} minW={0} value={name} onChange={(event) => setName(event.target.value)} aria-label="New entity name" />
        )}
        <Button
          size="xs"
          disabled={busy || (choice === NEW && !name.trim())}
          onClick={() => onConfirm(index, choice === NEW ? { name: name.trim(), kind } : { entity_id: choice })}
        >
          Link
        </Button>
      </HStack>
    </VStack>
  );
}

export default function WorkbenchMentions({ note, entities, onConfirm, onUnlink, busy }: Props) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  if (!note.mentions.length) {
    return (
      <Text fontSize="sm" color={mutedColor}>
        {note.tended_at ? "No mentions found." : "Not tended yet."}
      </Text>
    );
  }
  return (
    <VStack className="fwb-mentions" align="stretch" gap={3}>
      {note.mentions.map((mention, index) => (
        <MentionRow
          // Re-mount when the note or the mention's link changes so local choice resets.
          key={`${note.id}-${index}-${mention.confirmed_entity_id ?? ""}`}
          mention={mention}
          index={index}
          entities={entities}
          onConfirm={onConfirm}
          onUnlink={onUnlink}
          busy={busy}
        />
      ))}
    </VStack>
  );
}
