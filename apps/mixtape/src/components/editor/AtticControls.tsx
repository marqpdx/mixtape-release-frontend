"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Slice } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import { Box, Button, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import { IconArchive } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { TipTapRenderer, type TipTapDocument } from "@components/tiptap/TipTapRenderer";
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogCloseTrigger } from "@components/ui/dialog";
import { toaster } from "@components/ui/toaster";
import EditorToolbarButton from "./EditorToolbarButton";

export interface AtticContext { pieceId: string; title: string }
interface AtticEntry {
  id: string;
  slice_json: { content: NonNullable<TipTapDocument["content"]>; openStart?: number; openEnd?: number };
  text: string;
  source_title: string;
  source_context: string;
  created_at: string;
  created_by_name: string;
}

export function AtticControls({ editor, pieceId, title }: AtticContext & { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const alive = useRef(true);
  // Keep the same ID when retrying the same selection after an uncertain response.
  const retry = useRef<{ fingerprint: string; id: string } | null>(null);
  const queryClient = useQueryClient();
  const queryKey = ["writing", "attic", pieceId];
  const endpoint = `/api/writing/pieces/${pieceId}/attic`;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const entries = useQuery<AtticEntry[]>({
    queryKey,
    enabled: open,
    queryFn: async () => {
      const all: AtticEntry[] = [];
      let next: string | null = endpoint;
      while (next) {
        const { data }: { data: AtticEntry[] | { results: AtticEntry[]; next: string | null } } = await axiosInstance.get(next);
        if (Array.isArray(data)) return data;
        all.push(...data.results);
        next = data.next;
      }
      return all;
    },
  });

  const moveToAttic = async () => {
    if (inFlight.current || !editor.isEditable || editor.state.selection.empty) return;
    const { from, to } = editor.state.selection;
    const originalDoc = editor.state.doc;
    const slice = editor.state.selection.content();
    const payload = {
      slice_json: slice.toJSON(),
      text: originalDoc.textBetween(from, to, "\n"),
      source_title: title,
      source_context: [
        originalDoc.textBetween(Math.max(0, from - 100), from, " "),
        originalDoc.textBetween(to, Math.min(originalDoc.content.size, to + 100), " "),
      ].join(" […] "),
    };
    const fingerprint = JSON.stringify({ from, to, ...payload });
    const id = retry.current?.fingerprint === fingerprint ? retry.current.id : crypto.randomUUID();
    retry.current = { fingerprint, id };
    inFlight.current = true;
    setSaving(true);
    try {
      await axiosInstance.post(endpoint, { id, ...payload });
      void queryClient.invalidateQueries({ queryKey: ["writing", "attic", pieceId] });
      if (!alive.current || editor.isDestroyed) return;
      if (!editor.isEditable || !originalDoc.eq(editor.state.doc)) {
        toaster.create({ title: "Saved to Attic", description: "The manuscript changed while saving, so the original passage was kept.", type: "info" });
      } else {
        // Delete only after the server confirms a durable copy. This transaction
        // follows the editor's normal autosave and undo path.
        editor.chain().focus().deleteRange({ from, to }).run();
        retry.current = null;
        toaster.create({ title: "Moved to Attic", description: "The formatted passage is saved with this piece.", type: "success" });
      }
    } catch {
      if (alive.current) toaster.create({ title: "Could not save to Attic", description: "Your manuscript was left unchanged. Try again.", type: "error" });
    } finally {
      inFlight.current = false;
      if (alive.current) setSaving(false);
    }
  };

  const insertEntry = (entry: AtticEntry) => {
    if (!editor.isEditable || editor.isDestroyed) return;
    try {
      const slice = Slice.fromJSON(editor.schema, entry.slice_json);
      const { from } = editor.state.selection;
      // Insert at the selection's start rather than replacing selected writing.
      const tr = editor.state.tr.setSelection(TextSelection.near(editor.state.doc.resolve(from))).replaceSelection(slice).scrollIntoView();
      editor.view.dispatch(tr);
      setOpen(false);
      editor.commands.focus();
      toaster.create({ title: "Inserted from Attic", description: "The saved entry is still in your Attic.", type: "success" });
    } catch {
      toaster.create({ title: "Could not insert this entry", description: "The saved passage is still in your Attic.", type: "error" });
    }
  };

  return (
    <HStack className="atc-controls" gap={1}>
      <EditorToolbarButton tooltip={saving ? "Saving to Attic…" : "Move selection to Attic"} icon={<IconArchive size={16} />} onClick={() => void moveToAttic()} onMouseDown={(event) => event.preventDefault()} disabled={saving || !editor.isEditable || editor.state.selection.empty} size="xs" />
      <Button size="xs" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => setOpen(true)}>Attic</Button>
      <DialogRoot open={open} onOpenChange={(details) => setOpen(details.open)} size="lg" scrollBehavior="inside">
        <DialogContent className="atc-dialog" bg="theme.bg" color="theme.text">
          <DialogHeader><DialogTitle>Attic</DialogTitle></DialogHeader>
          <DialogCloseTrigger />
          <DialogBody className="atc-body" pb={5}>
            <Text fontSize="sm" color="theme.textSecondary" mb={4}>Saved passages for {title || "this piece"}. Attic entries are visible to this piece’s editors and are never published.</Text>
            {entries.isPending && <Spinner size="sm" />}
            {entries.isError && <Box className="atc-load-error"><Text>Could not load the Attic.</Text><Button size="sm" onClick={() => void entries.refetch()}>Try again</Button></Box>}
            {entries.data?.length === 0 && <Text color="theme.textSecondary">No saved passages yet. Select some writing and use Move selection to Attic.</Text>}
            <VStack className="atc-entries" align="stretch" gap={4}>
              {entries.data?.map((entry) => (
                <Box className="atc-entry" key={entry.id} borderWidth="1px" borderColor="theme.border" borderRadius="md" p={4}>
                  <Text fontSize="xs" color="theme.textSecondary" mb={2}>{entry.source_title || "Untitled piece"} · {new Date(entry.created_at).toLocaleString()} · {entry.created_by_name}</Text>
                  <TipTapRenderer content={{ type: "doc", content: entry.slice_json.content }} />
                  <Button size="xs" mt={2} variant="outline" disabled={!editor.isEditable || saving} onClick={() => insertEntry(entry)}>Insert at cursor</Button>
                </Box>
              ))}
            </VStack>
          </DialogBody>
        </DialogContent>
      </DialogRoot>
    </HStack>
  );
}
