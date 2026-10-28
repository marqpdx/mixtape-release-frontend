// src/components/editor/ViewSourceDialog.tsx
//
// Read-only look at the manuscript's markup: Markdown (our export), HTML (TipTap's
// getHTML), and JSON (getJSON: what's actually stored in body_json).
// Snapshots the editor when opened; it doesn't follow later edits.

import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Box, Button, Dialog, HStack, Tabs, Text } from '@chakra-ui/react'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { tiptapToMarkdown } from './markdown/tiptapToMarkdown'

type SourceView = 'markdown' | 'html' | 'json'

interface Snapshot {
  markdown: string
  html: string
  json: string
}

export function takeSourceSnapshot(editor: Editor): Snapshot {
  const doc = editor.getJSON()
  return {
    markdown: tiptapToMarkdown(doc),
    // One block per line; inline tags stay on their line.
    html: editor.getHTML().replace(/(<\/(?:p|h[1-6]|li|figure|pre|ul|ol|blockquote)>|<(?:ul|ol|blockquote)[^>]*>)/g, '$1\n').trim(),
    json: JSON.stringify(doc, null, 2),
  }
}

const VIEWS: { value: SourceView; label: string; note: string }[] = [
  { value: 'markdown', label: 'Markdown', note: 'What Export to Markdown produces.' },
  { value: 'html', label: 'HTML', note: 'What the editor renders, including data-* attributes.' },
  { value: 'json', label: 'JSON', note: 'What is saved for this piece.' },
]

export function ViewSourceDialog({
  snapshot,
  onClose,
}: {
  snapshot: Snapshot | null
  onClose: () => void
}) {
  const [view, setView] = useState<SourceView>('markdown')
  const [copied, setCopied] = useState<SourceView | null>(null)

  const copy = async (value: SourceView) => {
    if (!snapshot) return
    try {
      await navigator.clipboard.writeText(snapshot[value])
      setCopied(value)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // Clipboard can be unavailable (permissions, insecure origin); the text stays selectable.
    }
  }

  return (
    <Dialog.Root open={snapshot !== null} onOpenChange={({ open }) => !open && onClose()} size="xl">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content className="vsd-root" maxW="900px">
          <Dialog.Header>
            <Dialog.Title>View source</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Tabs.Root
              className="vsd-tabs"
              value={view}
              onValueChange={({ value }) => setView(value as SourceView)}
              size="sm"
              variant="line"
            >
              <Tabs.List>
                {VIEWS.map(({ value, label }) => (
                  <Tabs.Trigger key={value} value={value}>{label}</Tabs.Trigger>
                ))}
              </Tabs.List>
              {VIEWS.map(({ value, note }) => (
                <Tabs.Content key={value} value={value} className="vsd-panel">
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" color="fg.muted">{note}</Text>
                    <Button size="xs" variant="ghost" onClick={() => copy(value)}>
                      {copied === value ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      Copy
                    </Button>
                  </HStack>
                  <Box
                    as="pre"
                    className="vsd-source"
                    fontFamily="mono"
                    fontSize="xs"
                    lineHeight="1.5"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                    bg="bg.subtle"
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="md"
                    p={3}
                    maxH="60vh"
                    overflowY="auto"
                  >
                    {snapshot?.[value] || '(empty)'}
                  </Box>
                </Tabs.Content>
              ))}
            </Tabs.Root>
          </Dialog.Body>
          <Dialog.Footer>
            <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
