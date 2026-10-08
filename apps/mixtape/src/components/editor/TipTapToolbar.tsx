// apps/mixtape/src/components/editor/TipTapToolbar.tsx

import { Editor } from "@tiptap/react";
import NextLink from "next/link";
import { Box, Button, Dialog, Field, HStack, IconButton, Input, Link, Text } from "@chakra-ui/react";
import {
  IconBold,
  IconItalic,
  IconLink,
  IconUnlink,
  IconUnderline,
  IconShare,
  IconStrikethrough,
  IconCode,
  IconList,
  IconListNumbers,
  IconH1,
  IconH2,
  IconH3,
  IconH4,
  IconHelpCircle,
  IconScissors,
  IconPhoto,
  IconTextSpellcheck,
  IconBlockquote,
  IconMessageQuestion,
  IconMessageReply,
} from "@tabler/icons-react";

import { Tooltip } from "@components/ui/tooltip";
import EditorToolbarButton from "./EditorToolbarButton";
import { getSelectedBlockIds } from "@utils/getSelectedBlocks";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { ConversationRole } from "./extensions/ConversationBlockquote";

function normalizeLinkHref(value: string): string | null {
  const href = value.trim();
  if (!href || href.startsWith("//")) return null;
  if (href.startsWith("/")) return href;
  if (/^(mailto|tel):/i.test(href)) {
    const target = href.slice(href.indexOf(":") + 1);
    return target && !/\s/.test(target) ? href : null;
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(href) && !/^https?:\/\//i.test(href)) return null;

  const candidate = /^https?:\/\//i.test(href) ? href : `https://${href}`;
  try {
    const url = new URL(candidate);
    return url.hostname ? candidate : null;
  } catch {
    return null;
  }
}

export default function TipTapToolbar({
  editor,
  gristMode = false,
  onImagePick,
  onSpellScan,
}: {
  editor: Editor | null
  gristMode?: boolean
  onImagePick?: (file: File) => void
  onSpellScan?: () => void
}) {
  const { user } = useAuth();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const isSuperuser = !!user?.is_superuser;
  const [fontMode, setFontMode] = useState<"serif" | "sans">("sans");
  const [showHelp, setShowHelp] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [editingLink, setEditingLink] = useState(false);
  const [linkSelection, setLinkSelection] = useState<{ from: number; to: number } | null>(null);
  const [, setEditorTick] = useState(0);
  const fontModeKey = "writing_font_mode";
  const SerifIcon = (
    <Box w="16px" h="16px" display="flex" alignItems="center" justifyContent="center">
      <Text
        fontFamily="Georgia, Times New Roman, serif"
        fontSize="14px"
        lineHeight="1"
        transform="translate(11%, -4%)"
        ml={'-2px'}
      >
        A
      </Text>
    </Box>
  );
  const SansIcon = (
    <Box w="16px" h="16px" display="flex" alignItems="center" justifyContent="center">
      <Text
        fontFamily="Helvetica, Arial, sans-serif"
        fontSize="14px"
        lineHeight="1"
        transform="translate(13%, 3%)"
        ml={'-2px'}
      >
        A
      </Text>
    </Box>
  );

  useEffect(() => {
    const dom = editor?.view?.dom;
    if (!dom) return;

    let initialMode: "serif" | "sans" = "sans";
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(fontModeKey);
      if (stored === "serif" || stored === "sans") {
        initialMode = stored;
      }
    }

    dom.classList.remove("font-serif", "font-sans");
    dom.classList.add(initialMode === "serif" ? "font-serif" : "font-sans");
    setFontMode(initialMode);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const notify = () => setEditorTick((tick) => tick + 1);
    editor.on("selectionUpdate", notify);
    editor.on("transaction", notify);
    editor.on("focus", notify);
    editor.on("blur", notify);
    return () => {
      editor.off("selectionUpdate", notify);
      editor.off("transaction", notify);
      editor.off("focus", notify);
      editor.off("blur", notify);
    };
  }, [editor]);

  const applyFontMode = useCallback(
    (mode: "serif" | "sans") => {
      const dom = editor?.view?.dom;
      if (!dom) return;
      dom.classList.remove("font-serif", "font-sans");
      dom.classList.add(mode === "serif" ? "font-serif" : "font-sans");
      setFontMode(mode);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(fontModeKey, mode);
      }
    },
    [editor]
  );

  const openLinkDialog = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const active = editor.isActive("link");
    if (from === to && !active) return;
    setLinkSelection({ from, to });
    setEditingLink(active);
    setLinkUrl(active ? String(editor.getAttributes("link").href ?? "") : "");
    setLinkError("");
    setLinkDialogOpen(true);
  };

  const applyLink = () => {
    if (!editor || !linkSelection) return;
    const href = normalizeLinkHref(linkUrl);
    if (!href) {
      setLinkError("Enter a valid web address, email link, phone link, or site path.");
      return;
    }
    const chain = editor.chain().focus().setTextSelection(linkSelection);
    if (editingLink) chain.extendMarkRange("link");
    chain.setLink({ href }).run();
    setLinkDialogOpen(false);
  };

  const removeLink = () => {
    if (!editor || !linkSelection) return;
    editor.chain().focus().setTextSelection(linkSelection).extendMarkRange("link").unsetLink().run();
    setLinkDialogOpen(false);
  };

  const toggleConversationRole = (role: ConversationRole) => {
    if (!editor) return;
    if (editor.isActive("blockquote", { role })) {
      editor.chain().focus().toggleBlockquote().run();
    } else if (editor.isActive("blockquote")) {
      editor.chain().focus().updateAttributes("blockquote", { role }).run();
    } else {
      editor.chain().focus().toggleBlockquote().updateAttributes("blockquote", { role }).run();
    }
  };

  const togglePlainBlockquote = () => {
    if (!editor) return;
    if (editor.isActive("blockquote") && !editor.getAttributes("blockquote").role) {
      editor.chain().focus().toggleBlockquote().run();
    } else if (editor.isActive("blockquote")) {
      editor.chain().focus().updateAttributes("blockquote", { role: null }).run();
    } else {
      editor.chain().focus().toggleBlockquote().run();
    }
  };

  if (!editor) return null;

  return (
    <>
    <HStack p={1} pt={2} gap={0.5} justify="space-between" align="start" wrap="wrap">
      <HStack gap={0.5}>
        <EditorToolbarButton
          tooltip="Heading 1"
          icon={<IconH1 size={16} />}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Heading 2"
          icon={<IconH2 size={16} />}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Heading 3"
          icon={<IconH3 size={16} />}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Heading 4"
          icon={<IconH4 size={16} />}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          isActive={editor.isActive("heading", { level: 4 })}
          tabIndex={-1}
          size="xs"
        />

        <Box w="1px" h="16px" bg="gray.300" mx={0.5} />

        <EditorToolbarButton
          tooltip="Bold (Ctrl+B)"
          icon={<IconBold size={16} />}
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Italic (Ctrl+I)"
          icon={<IconItalic size={16} />}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Underline (Ctrl+U)"
          icon={<IconUnderline size={16} />}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Strikethrough"
          icon={<IconStrikethrough size={16} />}
          onClick={() => editor.chain().focus().toggleMark("strike").run()}
          isActive={editor.isActive("strike")}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Blockquote"
          icon={<IconBlockquote size={16} />}
          onClick={togglePlainBlockquote}
          isActive={editor.isActive("blockquote") && !editor.getAttributes("blockquote").role}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Chat: Querent"
          icon={<IconMessageQuestion size={16} />}
          onClick={() => toggleConversationRole("querent")}
          isActive={editor.isActive("blockquote", { role: "querent" })}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Chat: Respondent"
          icon={<IconMessageReply size={16} />}
          onClick={() => toggleConversationRole("respondent")}
          isActive={editor.isActive("blockquote", { role: "respondent" })}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Inline code"
          icon={<IconCode size={16} />}
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Bullet list"
          icon={<IconList size={16} />}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Numbered list"
          icon={<IconListNumbers size={16} />}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Link"
          icon={<IconLink size={16} />}
          onClick={openLinkDialog}
          isActive={editor.isActive("link")}
          disabled={editor.state.selection.empty && !editor.isActive("link")}
          tabIndex={-1}
          size="xs"
        />
        {onImagePick && (
          <>
            <EditorToolbarButton
              tooltip="Insert image"
              icon={<IconPhoto size={16} />}
              onClick={() => imageInputRef.current?.click()}
              isActive={false}
              tabIndex={-1}
              size="xs"
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImagePick(file);
                e.target.value = "";
              }}
            />
          </>
        )}
        {gristMode && (
          <>
            <Box w="1px" h="16px" bg="gray.300" mx={0.5} />
            <EditorToolbarButton
              tooltip="Insert split point (/split)"
              icon={<IconScissors size={16} />}
              onClick={() =>
                editor
                  ?.chain()
                  .focus()
                  .insertSplitMarker({ source: 'manual', title: null, rationale: null })
                  .run()
              }
              isActive={false}
              tabIndex={-1}
              size="xs"
            />
          </>
        )}
      </HStack>
      <HStack gap={0.5}>
        <EditorToolbarButton
          tooltip="Serif"
          icon={SerifIcon}
          onClick={() => applyFontMode("serif")}
          isActive={fontMode === "serif"}
          tabIndex={-1}
          size="xs"
        />
        <EditorToolbarButton
          tooltip="Sans Serif"
          icon={SansIcon}
          onClick={() => applyFontMode("sans")}
          isActive={fontMode === "sans"}
          tabIndex={-1}
          size="xs"
        />
      </HStack>

      <HStack gap={0.5} align="start">
        <Tooltip content="Publish as Section">
          <IconButton
            size="xs"
            variant="ghost"
            onClick={() => {
              const ids = getSelectedBlockIds(editor)
              ids.forEach((id) => {
                editor.commands.appendBlockDestination(id, { kind: "post", id: "123" })
                const blockRouting = editor.extensionManager.extensions.find(e => e.name === "blockRouting") as
                  | { options?: { getRouteMeta?: (blockId: string) => unknown } }
                  | undefined
                const meta = blockRouting?.options?.getRouteMeta?.(id)
                console.log("🔎 Route meta for block:", meta)
              })
              console.log("✅ Routed blocks:", ids)
            }}
            tabIndex={-1}
            aria-label="Publish as Section"
          >
            <IconShare size={16} />
          </IconButton>
        </Tooltip>
        {onSpellScan && (
          <Tooltip content="Check Spelling">
            <IconButton
              size="xs"
              variant="ghost"
              onClick={onSpellScan}
              tabIndex={-1}
              aria-label="Check spelling"
            >
              <IconTextSpellcheck size={16} />
            </IconButton>
          </Tooltip>
        )}
        {isSuperuser ? (
          <Tooltip content="Writing Help">
            <IconButton
              size="xs"
              variant={showHelp ? "subtle" : "ghost"}
              colorPalette={showHelp ? "blue" : undefined}
              onClick={() => setShowHelp((prev) => !prev)}
              tabIndex={-1}
              aria-label="Toggle writing help"
            >
              <IconHelpCircle size={16} />
            </IconButton>
          </Tooltip>
        ) : null}
      </HStack>
      {isSuperuser && showHelp ? (
        <Box
          w="100%"
          mt={1}
          p={2}
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          bg="bg.subtle"
        >
          <Text fontSize="xs" color="fg.muted" whiteSpace="pre-wrap">
            {`Spelling helpers
Manual popup: Cmd/Ctrl + double-click a word.
Auto-replace: typing a known misspelling + boundary key (space, punctuation, Enter) will auto-correct.

@mentions
Type @ + username letters to open suggestions.
Use Arrow Up/Down + Enter (or Tab) to insert a mention.

Stream Authoring - Writing Across Artifacts
When editing a piece, you can create new artifacts inline without leaving the editor.

/new [type] [title] - Creates a new artifact (example: /new event Birthday Party or /new seed) and inserts a boundary marker. Writing below the marker belongs to the new artifact.
/renew - Returns focus to your original piece. A boundary marker is inserted and subsequent writing flows back into the anchor piece.
Merging - Delete a boundary marker to merge that segment's content back into the anchor piece.

Supported types: writingpiece, seed, event, course.
Sessions are created automatically on your first /new command. Autosave keeps the surface document synced. When you navigate away, the session closes with a final checkpoint.`}
          </Text>
          <Link asChild mt={2} fontSize="xs" color="fg" textDecoration="underline" textUnderlineOffset="3px">
            <NextLink href="/help/tech/writing">Open technical writing reference</NextLink>
          </Link>
        </Box>
      ) : null}
    </HStack>
    <Dialog.Root open={linkDialogOpen} onOpenChange={({ open }) => setLinkDialogOpen(open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="440px">
          <Dialog.Header>
            <Dialog.Title>{editingLink ? "Edit link" : "Add link"}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Field.Root invalid={!!linkError}>
              <Field.Label>Destination URL</Field.Label>
              <Input
                autoFocus
                type="text"
                inputMode="url"
                value={linkUrl}
                placeholder="https://..."
                onChange={(event) => {
                  setLinkUrl(event.target.value);
                  setLinkError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyLink();
                  }
                }}
              />
              {linkError && <Field.ErrorText>{linkError}</Field.ErrorText>}
            </Field.Root>
          </Dialog.Body>
          <Dialog.Footer justifyContent="space-between">
            {editingLink ? (
              <Button size="sm" variant="ghost" onClick={removeLink}>
                <IconUnlink size={16} /> Remove link
              </Button>
            ) : <Box />}
            <HStack gap={2}>
              <Button size="sm" variant="ghost" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={applyLink}>{editingLink ? "Save link" : "Add link"}</Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
    </>
  );
}
