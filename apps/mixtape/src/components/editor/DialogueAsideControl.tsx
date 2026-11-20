// src/components/editor/DialogueAsideControl.tsx
//
// Extras-row control for a Dialogue Aside: a short visible phrase that opens
// both sides of an exchange (your request, the agent's reply) in a popover.
// Written for pieces that show readers how the work was asked for.

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button, Dialog, Field, Input, Portal, Text, Textarea } from "@chakra-ui/react";
import { IconMessages } from "@tabler/icons-react";
import { dialogueAsidePreview, type DialogueAsideAttrs } from "@mixtape/content/writingExtras";
import EditorToolbarButton from "./EditorToolbarButton";

const EMPTY: DialogueAsideAttrs = { label: "", request: "", response: "" };

export function DialogueAsideDialog({ open, initial, onClose, onSave }: {
  open: boolean;
  initial: DialogueAsideAttrs;
  onClose: () => void;
  onSave: (attrs: DialogueAsideAttrs) => void;
}) {
  const [draft, setDraft] = useState<DialogueAsideAttrs>(initial);
  const labelRef = useRef<HTMLInputElement | null>(null);
  const set = (key: keyof DialogueAsideAttrs) =>
    (event: { target: { value: string } }) => setDraft((d) => ({ ...d, [key]: event.target.value }));
  const ready = !!draft.label.trim() && !!(draft.request.trim() || draft.response.trim());
  const save = () => {
    if (!ready) return;
    onSave({ label: draft.label.trim(), request: draft.request.trim(), response: draft.response.trim() });
  };
  const editing = !!initial.label;

  return (
    <Dialog.Root open={open} onOpenChange={({ open: next }) => { if (!next) onClose(); }}
      initialFocusEl={() => labelRef.current} size="lg">
      {/* Portalled: when editing, this renders from a node view inside the
          editor's contenteditable, where ProseMirror would take its clicks and keys. */}
      <Portal>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content className="dac-dialog" maxW="720px"
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); save(); }
          }}>
          <Dialog.Header>
            <Dialog.Title>{editing ? "Edit dialogue aside" : "Insert dialogue aside"}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body display="flex" flexDirection="column" gap={4}>
            <Field.Root required>
              <Field.Label>Visible phrase</Field.Label>
              <Input ref={labelRef} value={draft.label} onChange={set("label")}
                placeholder="and here I wanted two new features" />
              <Field.HelperText>Shown in the text. Hovering shows the opening of your request; clicking shows the exchange.</Field.HelperText>
            </Field.Root>
            <Field.Root>
              <Field.Label>Me (the request)</Field.Label>
              <Textarea value={draft.request} onChange={set("request")} rows={6} placeholder="Paste what you asked" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Agent (the reply)</Field.Label>
              <Textarea value={draft.response} onChange={set("response")} rows={6} placeholder="Paste what the agent answered" />
            </Field.Root>
            {draft.request.trim() && (
              <Text fontSize="xs" color="fg.muted" whiteSpace="pre-line">Hover: {dialogueAsidePreview(draft.request)}</Text>
            )}
          </Dialog.Body>
          <Dialog.Footer>
            <Text fontSize="xs" color="fg.muted" mr="auto">⌘↵ to {editing ? "update" : "insert"}</Text>
            <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={!ready}>{editing ? "Update" : "Insert"}</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export function DialogueAsideControl({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  // Remember the selection so inserting lands where the cursor was, and use
  // any selected text as the starting phrase.
  const [seed, setSeed] = useState<{ from: number; to: number; label: string }>({ from: 0, to: 0, label: "" });

  const openDialog = () => {
    const { from, to } = editor.state.selection;
    setSeed({ from, to, label: editor.state.doc.textBetween(from, to, " ").trim() });
    setOpen(true);
  };

  return (
    <>
      <EditorToolbarButton
        tooltip="Dialogue aside: a phrase that opens both sides of an exchange"
        icon={<IconMessages size={16} />}
        onClick={openDialog}
        disabled={!editor.isEditable}
        tabIndex={-1}
        size="xs"
      />
      {open && (
        <DialogueAsideDialog
          open
          initial={{ ...EMPTY, label: seed.label }}
          onClose={() => setOpen(false)}
          onSave={(attrs) => {
            editor.chain().focus().insertContentAt({ from: seed.from, to: seed.to }, { type: "dialogueAside", attrs }).run();
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
