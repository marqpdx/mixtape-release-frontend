'use client'

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { Box, Image } from '@chakra-ui/react'
import { MediaFigure } from '@mixtape/content/MediaFigure'
import { normaliseMediaAlignment, normaliseMediaWidth } from '@mixtape/content/mediaLayout'
import { ImageCaption } from '@mixtape/content/ImageCaption'
import { resolveInteractivePage } from '@mixtape/content/interactivePages'
import { MediaMoveControl } from './MediaMoveControl'

/** Keep figures atomic: select the image, then edit its fields from the toolbar. */
export function MediaImageView({ node, selected, editor, getPos }: NodeViewProps) {
  const interactive = resolveInteractivePage(node.attrs)
  const alignment = interactive?.alignment ?? normaliseMediaAlignment(node.attrs.imageAlignment)
  const caption = typeof node.attrs.caption === 'string' ? node.attrs.caption : ''
  return <MediaFigure asChild alignment={alignment} widthPercent={interactive ? undefined : normaliseMediaWidth(node.attrs.imageWidthPercent)} className="editor-image-figure"
    position="relative"
    outline={selected ? '2px solid' : undefined} outlineColor="theme.accent" outlineOffset="3px">
    <NodeViewWrapper as="figure" contentEditable={false} data-image-figure="" data-alignment={alignment}>
      <MediaMoveControl editor={editor} getPos={getPos} />
      <Image className="editor-image" src={node.attrs.src} alt={node.attrs.alt || ''} title={node.attrs.title || undefined}
        data-interactive-page-url={interactive?.htmlUrl} data-interactive-page-title={interactive?.title}
        data-interactive-page-alignment={interactive?.alignment} data-topology-id={node.attrs.topologyId || undefined}
        data-image-alignment={normaliseMediaAlignment(node.attrs.imageAlignment)} data-image-caption={caption || undefined}
        data-image-width-percent={normaliseMediaWidth(node.attrs.imageWidthPercent)}
        draggable={false} w="full" h="auto" style={{ margin: 0 }} borderRadius="md" />
      {interactive ? <Box as="figcaption" className="editor-image-caption" textAlign="center" mt={2} fontSize="sm">Open standalone page ↗</Box>
        : caption && <ImageCaption as="figcaption" className="editor-image-caption" caption={caption} mt={2} />}
    </NodeViewWrapper>
  </MediaFigure>
}
