// src/components/editor/InsertCodeBlockControl.tsx
//
// Toolbar control for code blocks: choose JSON, Python, TypeScript or Bash,
// paste the code, see it highlighted, and insert it (or update the block the
// cursor is in). Highlighting comes from @mixtape/content/codeHighlight, the
// same highlighter the editors and the reader use.

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Box, Button, Dialog, Field, HStack, Text, Textarea } from "@chakra-ui/react";
import { IconSourceCode } from "@tabler/icons-react";
import {
  CODE_LANGUAGES,
  type CodeLanguage,
  codeBlockCss,
  renderHighlightedCode,
} from "@mixtape/content/codeHighlight";
import EditorToolbarButton from "./EditorToolbarButton";

type Target = { pos: number; size: number } | null;

function currentCodeBlock(editor: Editor): { target: Target; code: string; language: string | null } {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type.name === "codeBlock") {
      return {
        target: { pos: $from.before(depth), size: node.nodeSize },
        code: node.textContent,
        language: typeof node.attrs.language === "string" ? node.attrs.language : null,
      };
    }
  }
  return { target: null, code: "", language: null };
}

function guessLanguage(code: string): CodeLanguage | null {
  const text = code.trim();
  if (!text) return null;
  if ((text.startsWith("{") || text.startsWith("[")) && (() => {
    try { JSON.parse(text); return true; } catch { return false; }
  })()) return "json";
  if (/^#!.*\b(ba|z)?sh\b/.test(text) || /^\$ /m.test(text)) return "bash";
  if (/^\s*(def |class \w+.*:\s*$|from \w+ import |import \w+$)/m.test(text)) return "python";
  if (/\b(interface|type)\s+\w+|:\s*(string|number|boolean)\b|\bexport (const|function|default)\b/.test(text)) return "typescript";
  return null;
}

export function InsertCodeBlockControl({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<CodeLanguage>("json");
  const [target, setTarget] = useState<Target>(null);
  const [jsonError, setJsonError] = useState("");
  const codeRef = useRef<HTMLTextAreaElement>(null);

  const isActive = editor.isActive("codeBlock");

  const openDialog = () => {
    const current = currentCodeBlock(editor);
    const known = CODE_LANGUAGES.some((entry) => entry.value === current.language);
    setTarget(current.target);
    setCode(current.code);
    setLanguage(known ? (current.language as CodeLanguage) : guessLanguage(current.code) ?? "json");
    setJsonError("");
    setOpen(true);
  };

  const onCodeChange = (value: string) => {
    // On a first paste into an empty box, pick the language the code looks like.
    if (!code.trim()) {
      const guess = guessLanguage(value);
      if (guess) setLanguage(guess);
    }
    setCode(value);
    setJsonError("");
  };

  const formatJson = () => {
    try {
      setCode(JSON.stringify(JSON.parse(code), null, 2));
      setJsonError("");
    } catch (error) {
      setJsonError(error instanceof Error ? `Not valid JSON: ${error.message}` : "Not valid JSON.");
    }
  };

  const apply = () => {
    const text = code.replace(/\s+$/, "");
    editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        const nodeType = state.schema.nodes.codeBlock;
        if (!nodeType) return false;
        const node = nodeType.create({ language }, text ? state.schema.text(text) : null);
        if (target) {
          tr.replaceWith(target.pos, target.pos + target.size, node);
        } else {
          tr.replaceSelectionWith(node);
        }
        return true;
      })
      .run();
    setOpen(false);
  };

  return (
    <>
      <EditorToolbarButton
        tooltip="Code block"
        icon={<IconSourceCode size={16} />}
        onClick={openDialog}
        isActive={isActive}
        tabIndex={-1}
        size="xs"
      />
      <Dialog.Root
        open={open}
        onOpenChange={({ open: next }) => setOpen(next)}
        initialFocusEl={() => codeRef.current}
        size="lg"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="760px">
            <Dialog.Header>
              <Dialog.Title>{target ? "Edit code block" : "Insert code block"}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <HStack gap={1} mb={3} role="radiogroup" aria-label="Language">
                {CODE_LANGUAGES.map((entry) => (
                  <Button
                    key={entry.value}
                    size="xs"
                    variant={language === entry.value ? "solid" : "outline"}
                    role="radio"
                    aria-checked={language === entry.value}
                    onClick={() => { setLanguage(entry.value); setJsonError(""); }}
                  >
                    {entry.label}
                  </Button>
                ))}
                {language === "json" && (
                  <Button size="xs" variant="ghost" ml="auto" onClick={formatJson} disabled={!code.trim()}>
                    Format JSON
                  </Button>
                )}
              </HStack>
              <Field.Root invalid={!!jsonError}>
                <Field.Label>Code</Field.Label>
                <Textarea
                  ref={codeRef}
                  value={code}
                  onChange={(event) => onCodeChange(event.target.value)}
                  placeholder="Paste or type code"
                  fontFamily="mono"
                  fontSize="13px"
                  rows={8}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      apply();
                    }
                  }}
                />
                {jsonError && <Field.ErrorText>{jsonError}</Field.ErrorText>}
              </Field.Root>
              {code.trim() && (
                <Box mt={3}>
                  <Text fontSize="xs" color="fg.muted" mb={1}>Preview</Text>
                  <Box css={{ "& pre": { ...codeBlockCss, margin: 0, maxHeight: "40vh", overflowY: "auto" } }}>
                    <pre>
                      <code className={`language-${language}`}>{renderHighlightedCode(code, language)}</code>
                    </pre>
                  </Box>
                </Box>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Text fontSize="xs" color="fg.muted" mr="auto">⌘↵ to {target ? "update" : "insert"}</Text>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={apply}>{target ? "Update" : "Insert"}</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
