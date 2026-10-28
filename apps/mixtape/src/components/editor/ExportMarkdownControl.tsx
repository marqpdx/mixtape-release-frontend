// src/components/editor/ExportMarkdownControl.tsx
//
// Toolbar menu: copy the manuscript as Markdown, download it as a .md file, or
// view its source (Markdown, HTML, stored JSON).
// Conversion happens in the browser (see markdown/tiptapToMarkdown.ts).

import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Menu, Portal } from '@chakra-ui/react'
import { IconCode, IconCopy, IconDownload, IconMarkdown } from '@tabler/icons-react'
import { toaster } from '@mixtape/core/lib/toaster'
import EditorToolbarButton from './EditorToolbarButton'
import { markdownFilename, tiptapToMarkdown } from './markdown/tiptapToMarkdown'
import { ViewSourceDialog, takeSourceSnapshot } from './ViewSourceDialog'

export function ExportMarkdownControl({ editor }: { editor: Editor }) {
  const [source, setSource] = useState<ReturnType<typeof takeSourceSnapshot> | null>(null)

  const build = () => {
    const doc = editor.getJSON()
    return { markdown: tiptapToMarkdown(doc), filename: markdownFilename(doc) }
  }

  const copy = async () => {
    const { markdown } = build()
    if (!markdown) { toaster.create({ title: 'Nothing to export yet', type: 'info' }); return }
    try {
      await navigator.clipboard.writeText(markdown)
      toaster.create({ title: 'Markdown copied', type: 'success' })
    } catch {
      toaster.create({ title: 'Could not copy to the clipboard', type: 'error' })
    }
  }

  const download = () => {
    const { markdown, filename } = build()
    if (!markdown) { toaster.create({ title: 'Nothing to export yet', type: 'info' }); return }
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <>
    <Menu.Root positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger asChild>
        <EditorToolbarButton
          className="emc-trigger"
          tooltip="Export to Markdown / view source"
          icon={<IconMarkdown size={16} />}
          onClick={() => {}}
          tabIndex={-1}
          size="xs"
        />
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content className="emc-menu" minW="180px">
            <Menu.Item value="copy" onSelect={copy}>
              <IconCopy size={14} /> Copy as Markdown
            </Menu.Item>
            <Menu.Item value="download" onSelect={download}>
              <IconDownload size={14} /> Download .md file
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item value="source" onSelect={() => setSource(takeSourceSnapshot(editor))}>
              <IconCode size={14} /> View source…
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
    <ViewSourceDialog snapshot={source} onClose={() => setSource(null)} />
    </>
  )
}
