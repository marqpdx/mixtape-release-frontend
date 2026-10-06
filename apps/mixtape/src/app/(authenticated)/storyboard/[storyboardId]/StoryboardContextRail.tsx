"use client";

import { useState } from "react";
import { Box, Button, Heading, HStack, Input, Text, VStack } from "@chakra-ui/react";
import { useFolios } from "@mixtape/api/hooks/folio";
import {
  useAddStoryboardNoteLink,
  useAddStoryboardParticipation,
  useRemoveStoryboardNoteLink,
  useRemoveStoryboardParticipation,
  useStoryboardEntities,
  useStoryboardNotes,
  useUpdateStoryboardFolios,
} from "@mixtape/api/hooks/storyboard";
import type { StoryboardDetail, StoryboardItem } from "@mixtape/api/clients/storyboard/storyboardApi";
import { toaster } from "@components/ui/toaster";

type Props = { storyboardId: string; detail: StoryboardDetail; item: StoryboardItem | null };

export default function StoryboardContextRail({ storyboardId, detail, item }: Props) {
  const { data: folios = [] } = useFolios();
  const { data: notes = [] } = useStoryboardNotes(storyboardId);
  const { data: entities = [] } = useStoryboardEntities(storyboardId);
  const { mutate: updateFolios } = useUpdateStoryboardFolios(storyboardId);
  const { mutate: addParticipation } = useAddStoryboardParticipation(storyboardId);
  const { mutate: removeParticipation } = useRemoveStoryboardParticipation(storyboardId);
  const { mutate: addLink } = useAddStoryboardNoteLink(storyboardId);
  const { mutate: removeLink } = useRemoveStoryboardNoteLink(storyboardId);
  const [folioId, setFolioId] = useState("");
  const [kind, setKind] = useState<"character" | "setting">("character");
  const [entityId, setEntityId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const linked = item ? detail.links.filter((link) => link.item_id === item.id && link.kind === "note") : [];
  const linkedNoteIds = new Set(linked.map((link) => link.target_id));
  const participants = item ? detail.participations.filter((part) => part.item_id === item.id) : [];
  const availableFolios = folios.filter((folio) => !detail.storyboard.folio_ids.includes(folio.id));
  const showError = (failure: Error) => {
    const detail = (failure as { response?: { data?: { detail?: string } } }).response?.data?.detail;
    const message = detail || failure.message;
    setError(message);
    toaster.create({ title: "Could not save", description: message, type: "error" });
  };

  return <VStack className="sb-context-rail" align="stretch" gap={5} minW="260px" maxW="320px" borderWidth="1px" borderRadius="md" p={4}>
    <Box className="sb-folio-sources">
      <Heading size="sm" mb={2}>Folios</Heading>
      <Text fontSize="xs" mb={2}>{detail.storyboard.folio_ids.length} linked</Text>
      <HStack>
        <select aria-label="Choose a Folio" value={folioId} onChange={(event) => setFolioId(event.target.value)} style={{ minWidth: 0, flex: 1, border: "1px solid", borderRadius: 4, padding: 6 }}>
          <option value="">Choose a Folio</option>
          {availableFolios.map((folio) => <option key={folio.id} value={folio.id}>{folio.title || "Untitled Folio"}</option>)}
        </select>
        <Button size="xs" disabled={!folioId} onClick={() => updateFolios([...detail.storyboard.folio_ids, folioId], { onSuccess: () => setFolioId(""), onError: showError })}>Add</Button>
      </HStack>
    </Box>

    {item ? <>
      <Box className="sb-participants">
        <Heading size="sm" mb={2}>{item.title || `Untitled ${item.level}`} · Participants</Heading>
        <VStack align="stretch" gap={1} mb={3}>
          {participants.map((part) => <HStack key={part.id} justify="space-between"><Text fontSize="sm">{part.name} · {part.kind}</Text><Button size="2xs" variant="ghost" onClick={() => removeParticipation({ itemId: item.id, id: part.id }, { onError: showError })}>Remove</Button></HStack>)}
        </VStack>
        <HStack mb={2}>
          <select aria-label="Participation kind" value={kind} onChange={(event) => { setKind(event.target.value as "character" | "setting"); setEntityId(""); }} style={{ border: "1px solid", borderRadius: 4, padding: 6 }}>
            <option value="character">Character</option><option value="setting">Setting</option>
          </select>
          <select aria-label="Existing entity" value={entityId} onChange={(event) => setEntityId(event.target.value)} style={{ minWidth: 0, flex: 1, border: "1px solid", borderRadius: 4, padding: 6 }}>
            <option value="">New entity</option>
            {entities.filter((entity) => entity.kind === kind).map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
          </select>
        </HStack>
        {!entityId && <Input size="sm" placeholder={`New ${kind} name`} value={name} onChange={(event) => setName(event.target.value)} mb={2} />}
        <Button size="xs" disabled={!entityId && !name.trim()} onClick={() => addParticipation({ itemId: item.id, payload: { kind, ...(entityId ? { entity_id: entityId } : { name: name.trim() }) } }, { onSuccess: () => setName(""), onError: showError })}>Add participant</Button>
      </Box>

      <Box className="sb-note-links">
        <Heading size="sm" mb={2}>FolioNotes</Heading>
        {linked.map((link) => {
          const note = notes.find((candidate) => candidate.id === link.target_id);
          return <Box key={link.id} borderWidth="1px" borderRadius="sm" p={2} mb={2}>
            <HStack justify="space-between"><Text fontSize="xs" fontWeight="bold">Attached note</Text><Button size="2xs" variant="ghost" onClick={() => removeLink({ itemId: item.id, id: link.id }, { onError: showError })}>Detach</Button></HStack>
            <Text fontSize="sm">{note?.text || link.target_id}</Text>
            {note?.mentions.map((mention, index) => {
              if (!(["character", "setting"] as string[]).includes(mention.kind)) return null;
              return <Box key={`${note.id}-${index}`} mt={2} p={2} bg="bg.subtle" borderRadius="sm">
                <Text fontSize="xs">{mention.surface} · {mention.kind} · {Math.round((mention.confidence ?? 0) * 100)}%</Text>
                {mention.confirmed_entity_id ? <Text fontSize="xs">Confirmed</Text> : <HStack mt={1}>
                  {mention.existing_entity_id && <Button size="2xs" onClick={() => addParticipation({ itemId: item.id, payload: { kind: mention.kind, entity_id: mention.existing_entity_id ?? undefined, note_id: note.id, mention_index: index } }, { onError: showError })}>Use existing</Button>}
                  <Button size="2xs" variant="outline" onClick={() => addParticipation({ itemId: item.id, payload: { kind: mention.kind, name: mention.surface, note_id: note.id, mention_index: index } }, { onError: showError })}>New entity</Button>
                </HStack>}
              </Box>;
            })}
          </Box>;
        })}
        {linked.length === 0 && <Text fontSize="xs" mb={2}>No notes attached here.</Text>}
        <VStack className="sb-available-notes" align="stretch" maxH="260px" overflowY="auto" gap={2}>
          {notes.filter((note) => !linkedNoteIds.has(note.id)).map((note) => <HStack key={note.id} align="start" borderWidth="1px" borderRadius="sm" p={2}>
            <Text fontSize="xs" flex="1">{note.text.slice(0, 110)}</Text>
            <Button size="2xs" onClick={() => addLink({ itemId: item.id, noteId: note.id }, { onError: showError })}>Attach</Button>
          </HStack>)}
        </VStack>
      </Box>
    </> : <Text fontSize="sm">Select a Chapter or Scene to manage participants and notes.</Text>}
    {error && <Text fontSize="xs" color="red.500">{error}</Text>}
  </VStack>;
}
