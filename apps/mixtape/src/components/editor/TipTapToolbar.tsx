// src/components/editor/TipTapToolbar.tsx

import { Editor } from "@tiptap/react";
import { HStack, IconButton } from "@chakra-ui/react";
import { IconBold, IconItalic, IconLink, IconUnderline, IconShare } from "@tabler/icons-react";

import { Tooltip } from "@components/ui/tooltip";
import EditorToolbarButton from "./EditorToolbarButton";
import { getSelectedBlockIds } from "@utils/getSelectedBlocks";

export default function TipTapToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <HStack p={1} gap={0.5}>
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
        tooltip="Link"
        icon={<IconLink size={16} />}
        onClick={() => editor.chain().focus().setMark("link", { href: "https://example.com" }).run()}
        isActive={editor.isActive("link")}
        tabIndex={-1}
        size="xs"
      />

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
