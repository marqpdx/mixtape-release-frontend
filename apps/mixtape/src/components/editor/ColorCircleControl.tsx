// src/components/editor/ColorCircleControl.tsx
//
// Extras-row control: type a hex value and a filled circle, one capital letter
// tall, is inserted at the cursor. Hovering the circle shows its hex.

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Box, Button, Dialog, Field, HStack, Input, Text } from "@chakra-ui/react";
import { IconCircleFilled } from "@tabler/icons-react";
import { ColorCircle, normaliseHex } from "@mixtape/content/writingExtras";
import EditorToolbarButton from "./EditorToolbarButton";

export function ColorCircleControl({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hex = normaliseHex(value);
  const showError = value.trim() !== "" && !hex;

  const insert = () => {
    if (!hex) return;
    editor.chain().focus().insertColorCircle(hex).run();
    setOpen(false);
  };

  return (
    <>
      <EditorToolbarButton
        tooltip="Color circle"
        icon={<IconCircleFilled size={14} />}
        onClick={() => { setValue(""); setOpen(true); }}
        disabled={!editor.isEditable}
        tabIndex={-1}
        size="xs"
      />
      <Dialog.Root open={open} onOpenChange={({ open: next }) => setOpen(next)}
        initialFocusEl={() => inputRef.current} size="xs">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="ccc-dialog">
            <Dialog.Header>
              <Dialog.Title>Insert color circle</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Field.Root invalid={showError}>
                <Field.Label>Hex value</Field.Label>
                <HStack gap={3} w="full">
                  <Input ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)} placeholder="#0B5B2A"
                    fontFamily="mono" spellCheck={false} autoCapitalize="off" autoCorrect="off"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insert(); } }} />
                  <Box className="ccc-preview" fontSize="2xl" lineHeight="1" minW="1.5em" aria-hidden>
                    {hex ? <>A<ColorCircle hex={hex} /></> : <Text as="span" color="fg.muted">A</Text>}
                  </Box>
                </HStack>
                {showError && <Field.ErrorText>Use 3 or 6 hex digits, e.g. #0B5 or #0B5B2A.</Field.ErrorText>}
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={insert} disabled={!hex}>Insert</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
