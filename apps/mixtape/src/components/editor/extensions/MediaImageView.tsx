'use client'

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { Box, Image } from '@chakra-ui/react'
import { MediaFigure } from '@mixtape/content/MediaFigure'
import { normaliseMediaAlignment } from '@mixtape/content/mediaLayout'
import { resolveInteractivePage } from '@mixtape/content/interactivePages'

/** Keep figures atomic: select the image, then edit its fields from the toolbar. */
export function MediaImageView({ node, selected }: NodeViewProps) {
  const interactive = resolveInteractivePage(node.attrs)
  const alignment = interactive?.alignment ?? normaliseMediaAlignment(node.attrs.imageAlignment)
  const caption = typeof node.attrs.caption === 'string' ? node.attrs.caption : ''
  return <MediaFigure asChild alignment={alignment} className="editor-image-figure"
    outline={selected ? '2px solid' : undefined} outlineColor="theme.accent" outlineOffset="3px">
    <NodeViewWrapper as="figure" contentEditable={false} data-image-figure="" data-alignment={alignment}>
      <Image className="editor-image" src={node.attrs.src} alt={node.attrs.alt || ''} title={node.attrs.title || undefined}
        data-interactive-page-url={interactive?.htmlUrl} data-interactive-page-title={interactive?.title}
        data-interactive-page-alignment={interactive?.alignment} data-topology-id={node.attrs.topologyId || undefined}
        data-image-alignment={normaliseMediaAlignment(node.attrs.imageAlignment)} data-image-caption={caption || undefined}
        draggable={false} w="full" h="auto" style={{ margin: 0 }} borderRadius="md" />
      {(interactive || caption) && <Box as="figcaption" className="editor-image-caption" textAlign="center" mt={2} fontSize="sm" whiteSpace="pre-wrap">
        {interactive ? 'Open standalone page ↗' : caption}
      </Box>}
    </NodeViewWrapper>
  </MediaFigure>
}
