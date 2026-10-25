'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Box, IconButton, Portal } from '@chakra-ui/react'
import { IconArrowsVertical } from '@tabler/icons-react'
import { NodeSelection } from '@tiptap/pm/state'
import { closeHistory } from '@tiptap/pm/history'
import type { NodeViewProps } from '@tiptap/react'

type MoveTarget = { pos: number; top: number; left: number; width: number }

/** Move the document anchor, keeping the figure's alignment and other fields intact. */
export function MediaMoveControl({ editor, getPos }: Pick<NodeViewProps, 'editor' | 'getPos'>) {
  const startY = useRef<number | null>(null)
  const [target, setTarget] = useState<MoveTarget | null>(null)
  const [editable, setEditable] = useState(editor.isEditable)
  useEffect(() => {
    const updateEditable = () => setEditable(editor.isEditable)
    editor.on('update', updateEditable)
    return () => { editor.off('update', updateEditable) }
  }, [editor])

  const targetAtY = (y: number): MoveTarget | null => {
    const source = getPos()
    if (typeof source !== 'number') return null
    const bounds = editor.view.dom.getBoundingClientRect()
    const targets: MoveTarget[] = []
    let bottom = bounds.top
    editor.state.doc.forEach((node, pos) => {
      if (pos === source) return
      const dom = editor.view.nodeDOM(pos)
      if (!(dom instanceof HTMLElement)) return
      const element = dom.querySelector<HTMLElement>('[data-node-view-wrapper]') ?? dom
      const rect = element.getBoundingClientRect()
      targets.push({ pos, top: rect.top, left: bounds.left, width: bounds.width })
      bottom = Math.max(bottom, rect.bottom)
    })
    targets.push({ pos: editor.state.doc.content.size, top: bottom, left: bounds.left, width: bounds.width })
    return targets.reduce((closest, candidate) => Math.abs(candidate.top - y) < Math.abs(closest.top - y) ? candidate : closest)
  }

  const moveTo = (pos: number, focusHandle = false) => {
    const source = getPos()
    if (typeof source !== 'number' || !editor.isEditable) return
    const node = editor.state.doc.nodeAt(source)
    if (!node || pos === source || pos === source + node.nodeSize) return
    const tr = editor.state.tr.delete(source, source + node.nodeSize)
    const destination = tr.mapping.map(pos)
    tr.insert(destination, node)
    tr.setSelection(NodeSelection.create(tr.doc, destination))
    editor.view.dispatch(closeHistory(tr).scrollIntoView())
    editor.view.focus()
    if (focusHandle) requestAnimationFrame(() => {
      const dom = editor.view.nodeDOM(destination)
      if (dom instanceof HTMLElement) dom.querySelector<HTMLButtonElement>('.editor-media-move')?.focus()
    })
  }

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    startY.current = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (startY.current === null || Math.abs(event.clientY - startY.current) < 6) return
    // Only Y selects a block boundary; horizontal pointer movement never changes placement.
    setTarget(targetAtY(event.clientY))
  }

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (startY.current !== null && Math.abs(event.clientY - startY.current) >= 6) {
      const destination = targetAtY(event.clientY)
      if (destination) moveTo(destination.pos)
    }
    startY.current = null
    setTarget(null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      startY.current = null
      setTarget(null)
      return
    }
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    event.stopPropagation()
    const source = getPos()
    if (typeof source !== 'number') return
    const siblings: { pos: number; size: number }[] = []
    editor.state.doc.forEach((node, pos) => siblings.push({ pos, size: node.nodeSize }))
    const index = siblings.findIndex(node => node.pos === source)
    const sibling = siblings[index + (event.key === 'ArrowUp' ? -1 : 1)]
    if (index >= 0 && sibling) moveTo(event.key === 'ArrowUp' ? sibling.pos : sibling.pos + sibling.size, true)
  }

  if (!editable) return null
  return <>
    <IconButton className="editor-media-move" aria-label="Move image up or down"
      title="Drag up or down to move beside another paragraph. Arrow keys also move the image."
      size="xs" position="absolute" top={1} insetInlineStart={1} zIndex={1}
      cursor="ns-resize" touchAction="none" draggable={false}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      onPointerCancel={() => { startY.current = null; setTarget(null) }}
      onLostPointerCapture={() => { startY.current = null; setTarget(null) }}
      onKeyDown={onKeyDown}>
      <IconArrowsVertical size={16} />
    </IconButton>
    {target && <Portal><Box className="editor-media-move-target" position="fixed" pointerEvents="none"
      left={`${target.left}px`} top={`${target.top}px`} width={`${target.width}px`}
      height="3px" bg="theme.accent" zIndex={1500} /></Portal>}
  </>
}
