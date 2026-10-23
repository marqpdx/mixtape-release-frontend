'use client'

import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { NodeSelection } from '@tiptap/pm/state'
import { Button, Field, Input, Text, Textarea, VStack } from '@chakra-ui/react'
import { IconPhoto } from '@tabler/icons-react'
import { normaliseImageSource } from '@mixtape/content/ImagePreview'
import { resolveInteractivePage } from '@mixtape/content/interactivePages'
import { normaliseMediaAlignment, normaliseMediaWidth, type MediaAlignment } from '@mixtape/content/mediaLayout'
import { sanitiseImageCaption } from '@mixtape/content/captionHtml'
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger } from '@components/ui/dialog'
import EditorToolbarButton from './EditorToolbarButton'
import { MediaPlacementField } from './MediaPlacementField'

export type ImageFields = { alt: string; caption: string; imageAlignment: MediaAlignment; imageWidthPercent: number }
export type ImagePick = (file: File, attrs: ImageFields, position: number) => Promise<boolean>

export function InsertImageControl({ editor, onImagePick }: { editor: Editor; onImagePick?: ImagePick }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [src, setSrc] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState('')
  const [caption, setCaption] = useState('')
  const [alignment, setAlignment] = useState<MediaAlignment>('center')
  const [widthPercent, setWidthPercent] = useState('60')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [, setSelectionTick] = useState(0)
  const insertion = useRef<{ position: number; doc: ProseMirrorNode } | null>(null)
  useEffect(() => {
    const notify = () => setSelectionTick(tick => tick + 1)
    editor.on('selectionUpdate', notify)
    return () => { editor.off('selectionUpdate', notify) }
  }, [editor])
  const selectedImage = editor.state.selection instanceof NodeSelection && editor.state.selection.node.type.name === 'image'
    && !resolveInteractivePage(editor.state.selection.node.attrs) ? editor.state.selection.node : undefined

  const save = async () => {
    const saved = insertion.current
    if (busy || !saved || !editor.isEditable || editor.isDestroyed) return
    if (!saved.doc.eq(editor.state.doc)) { setError('The manuscript changed. Close this dialog and choose the insertion point again.'); return }
    const width = Number(widthPercent)
    if (!widthPercent.trim() || !Number.isFinite(width) || width < 1 || width > 100) { setError('Enter an image width between 1% and 100%.'); return }
    const attrs: ImageFields = { alt: alt.trim(), caption: sanitiseImageCaption(caption.trim()), imageAlignment: alignment, imageWidthPercent: width }
    if (!file && !normaliseImageSource(src)) { setError('Choose an image file or enter an HTTP(S) image URL or a site-relative path.'); return }
    setBusy(true)
    setError('')
    try {
      let inserted: boolean
      if (file && onImagePick) {
        inserted = await onImagePick(file, attrs, saved.position)
      } else {
        const imageAttrs = { src: normaliseImageSource(src), ...attrs }
        inserted = editing
          ? editor.chain().focus().setNodeSelection(saved.position).updateAttributes('image', imageAttrs).run()
          : editor.chain().focus().insertContentAt(saved.position, { type: 'image', attrs: imageAttrs }).run()
      }
      if (inserted) setOpen(false)
      else setError('Could not insert this image. Check the upload and choose the insertion point again.')
    } catch {
      setError('Could not upload this image. Please try again.')
    } finally { setBusy(false) }
  }

  return <>
    <EditorToolbarButton tooltip={selectedImage ? 'Edit image' : 'Insert image'} icon={<IconPhoto size={16} />} size="xs"
      disabled={!editor.isEditable || !editor.schema.nodes.image} onMouseDown={event => event.preventDefault()} onClick={() => {
        setEditing(!!selectedImage)
        setSrc(selectedImage?.attrs.src ?? '')
        setAlt(selectedImage?.attrs.alt ?? '')
        setCaption(selectedImage?.attrs.caption ?? '')
        setAlignment(normaliseMediaAlignment(selectedImage?.attrs.imageAlignment))
        setWidthPercent(String(normaliseMediaWidth(selectedImage?.attrs.imageWidthPercent)))
        setFile(null)
        setError('')
        insertion.current = { position: selectedImage ? editor.state.selection.from : editor.state.selection.to, doc: editor.state.doc }
        setOpen(true)
      }} />
    <DialogRoot open={open} onOpenChange={details => { if (!busy) setOpen(details.open) }}>
      <DialogContent className="imc-dialog" bg="theme.bg" color="theme.text">
        <DialogHeader><DialogTitle>{editing ? 'Edit image' : 'Insert image'}</DialogTitle></DialogHeader>
        {!busy && <DialogCloseTrigger />}
        <DialogBody className="imc-body">
          <VStack className="imc-fields" align="stretch" gap={3}>
            {!editing && onImagePick && <Field.Root><Field.Label>Image file</Field.Label>
              <Input type="file" aria-label="Image file" accept="image/jpeg,image/png,image/gif,image/webp" disabled={busy}
                onChange={event => { setFile(event.target.files?.[0] ?? null); setError('') }} />
            </Field.Root>}
            <Field.Root><Field.Label>Image URL</Field.Label><Input aria-label="Image URL" value={src} disabled={busy || !!file}
              placeholder="https://… or /images/…" onChange={event => { setSrc(event.target.value); setError('') }} /></Field.Root>
            <Field.Root><Field.Label>Alt text</Field.Label><Input aria-label="Alt text" value={alt} disabled={busy}
              onChange={event => setAlt(event.target.value)} /></Field.Root>
            <Field.Root><Field.Label>Caption</Field.Label><Textarea aria-label="Caption" value={caption} disabled={busy}
              placeholder={'Optional caption, including <a href="https://…">photo credits</a>'} onChange={event => setCaption(event.target.value)} />
              <Field.HelperText>HTML links and basic formatting are supported. Links open in a new tab.</Field.HelperText>
            </Field.Root>
            <Field.Root><Field.Label>Image width (%)</Field.Label><Input aria-label="Image width (%)" type="number" inputMode="decimal"
              min={1} max={100} step="any" value={widthPercent} disabled={busy} onChange={event => { setWidthPercent(event.target.value); setError('') }} />
              <Field.HelperText>Percentage of the text column, from 1% to 100%.</Field.HelperText>
            </Field.Root>
            <MediaPlacementField label="Image placement" value={alignment} onChange={setAlignment} />
          </VStack>
          <Text fontSize="sm" mt={3}>Choose the image width as a percentage. Left or right placement lets the following text wrap beside it; on small screens it becomes full width. Readers click it to open the full image; ×, Escape, or browser Back brings them back.</Text>
          {error && <Text role="alert" color="fg.error" mt={2}>{error}</Text>}
        </DialogBody>
        <DialogFooter><Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={busy} onClick={() => void save()}>{editing ? 'Save changes' : 'Insert image'}</Button></DialogFooter>
      </DialogContent>
    </DialogRoot>
  </>
}
