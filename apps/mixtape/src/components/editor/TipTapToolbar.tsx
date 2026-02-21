// apps/mixtape/src/components/editor/TipTapToolbar.tsx

import { Editor } from "@tiptap/react";
import { Box, HStack, IconButton, Text } from "@chakra-ui/react";
import {
  IconBold,
  IconItalic,
  IconLink,
  IconUnderline,
  IconShare,
  IconStrikethrough,
  IconList,
  IconListNumbers,
  IconH1,
  IconH2,
  IconH3,
} from "@tabler/icons-react";

import { Tooltip } from "@components/ui/tooltip";
import EditorToolbarButton from "./EditorToolbarButton";
import { getSelectedBlockIds } from "@utils/getSelectedBlocks";
import { useCallback, useEffect, useState } from "react";

export default function TipTapToolbar({ editor }: { editor: Editor | null }) {
  const [fontMode, setFontMode] = useState<"serif" | "sans">("sans");
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

  if (!editor) return null;

  return (
    <HStack p={1} gap={0.5} justify="space-between">
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

      <Box w="1px" h="16px" bg="gray.300" mx={0.5} />

      <EditorToolbarButton
        tooltip="Bold (Ctrl+B)"
        icon={<IconBold size={16} />}
        onClick={() => editor.chain().focus().toggleMark("bold").run()}
        isActive={editor.isActive("bold")}
        tabIndex={-1}
        size="xs"
      />
      <EditorToolbarButton
        tooltip="Italic (Ctrl+I)"
        icon={<IconItalic size={16} />}
        onClick={() => editor.chain().focus().toggleMark("italic").run()}
        isActive={editor.isActive("italic")}
        tabIndex={-1}
        size="xs"
      />
      <EditorToolbarButton
        tooltip="Underline (Ctrl+U)"
        icon={<IconUnderline size={16} />}
        onClick={() => editor.chain().focus().toggleMark("underline").run()}
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
        onClick={() => editor.chain().focus().setMark("link", { href: "https://example.com" }).run()}
        isActive={editor.isActive("link")}
        tabIndex={-1}
        size="xs"
      />
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
    </HStack>
  );
}
