'use client'

import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Button, Field, Input, NativeSelect, Text, VStack } from '@chakra-ui/react'
import { IconSitemap } from '@tabler/icons-react'
import { getTopologyArtifact, topologyArtifacts } from '@mixtape/content/topologyArtifacts'
import { normaliseInteractiveHtmlUrl, normalisePreviewImageUrl, suggestedPreviewUrl } from '@mixtape/content/interactivePages'
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger } from '@components/ui/dialog'
import EditorToolbarButton from './EditorToolbarButton'

/** General authoring control; topology maps are just convenient presets. */
export function InsertInteractivePageControl({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  const [presetId, setPresetId] = useState<string>('system')
  const [htmlUrl, setHtmlUrl] = useState<string>(topologyArtifacts[0].htmlUrl)
  const [imageUrl, setImageUrl] = useState<string>(topologyArtifacts[0].imageUrl)
  const [title, setTitle] = useState<string>(topologyArtifacts[0].title)
  const [error, setError] = useState('')
  const insertion = useRef<{ position: number; doc: ProseMirrorNode } | null>(null)
  const canInsert = editor.isEditable && !!editor.schema.nodes.image
  const insert = () => {
    const saved = insertion.current
    if (!saved || !editor.isEditable || editor.isDestroyed) return
    const pageUrl = normaliseInteractiveHtmlUrl(htmlUrl)
    const previewUrl = normalisePreviewImageUrl(imageUrl)
    if (!pageUrl) { setError('Use a published HTML URL under https://www.crossroads.place/artifacts/.'); return }
    if (!previewUrl) { setError('Use a public HTTPS preview image URL or an /artifacts/ image path.'); return }
    if (!title.trim()) { setError('Add a title so readers can identify this page.'); return }
    if (!saved.doc.eq(editor.state.doc)) {
      setError('The manuscript changed. Close this dialog and choose the insertion point again.')
      return
    }
    const inserted = editor.chain().focus().insertContentAt(saved.position, {
      type: 'image', attrs: {
        src: previewUrl, alt: title.trim(), interactivePageUrl: pageUrl,
        interactivePageTitle: title.trim(), topologyId: getTopologyArtifact(presetId)?.id ?? null,
      },
    }).run()
    if (inserted) setOpen(false)
    else setError('Could not insert here. Choose a position in the manuscript and try again.')
  }
  return <>
    <EditorToolbarButton tooltip="Insert interactive page" icon={<IconSitemap size={16} />} size="xs" disabled={!canInsert} onMouseDown={event => event.preventDefault()} onClick={() => {
      insertion.current = { position: editor.state.selection.to, doc: editor.state.doc }
      setError('')
      setOpen(true)
    }} />
    <DialogRoot open={open} onOpenChange={details => setOpen(details.open)}>
      <DialogContent className="itc-dialog" bg="theme.bg" color="theme.text">
        <DialogHeader><DialogTitle>Insert interactive page</DialogTitle></DialogHeader>
        <DialogCloseTrigger />
        <DialogBody className="itc-body">
          <VStack className="itc-fields" align="stretch" gap={3}>
            <Field.Root><Field.Label>Page preset</Field.Label><NativeSelect.Root><NativeSelect.Field aria-label="Page preset" value={presetId} onChange={event => {
              const id = event.target.value
              const preset = getTopologyArtifact(id)
              setPresetId(id)
              setHtmlUrl(preset?.htmlUrl ?? '')
              setImageUrl(preset?.imageUrl ?? '')
              setTitle(preset?.title ?? '')
              setError('')
            }}>
              {topologyArtifacts.map(page => <option key={page.id} value={page.id}>{page.title}</option>)}
              <option value="custom">Another interactive page</option>
            </NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
            <Field.Root><Field.Label>Interactive HTML URL</Field.Label><Input aria-label="Interactive HTML URL" value={htmlUrl} placeholder="/artifacts/my-page/index.html" onChange={event => {
              const next = event.target.value
              if (!imageUrl || imageUrl === suggestedPreviewUrl(htmlUrl)) setImageUrl(suggestedPreviewUrl(next))
              setHtmlUrl(next)
              setPresetId('custom')
              setError('')
            }} /></Field.Root>
            <Field.Root><Field.Label>Preview image URL</Field.Label><Input aria-label="Preview image URL" value={imageUrl} placeholder="/artifacts/my-page/index.png" onChange={event => { setImageUrl(event.target.value); setError('') }} /></Field.Root>
            <Field.Root><Field.Label>Page title</Field.Label><Input aria-label="Page title" value={title} maxLength={160} onChange={event => { setTitle(event.target.value); setError('') }} /></Field.Root>
          </VStack>
          <Text fontSize="sm" mt={3}>Use a published HTML page and its PNG preview. The matching PNG URL is suggested automatically; it is not generated or uploaded here.</Text>
          <Text fontSize="sm" mt={2}>The preview is 60% wide (full width on small screens). Public readers click it to dissolve into the page; Return or Escape brings them back to their place.</Text>
          {error && <Text role="alert" color="fg.error" mt={2}>{error}</Text>}
        </DialogBody>
        <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={insert}>Insert preview</Button></DialogFooter>
      </DialogContent>
    </DialogRoot>
  </>
}
