import Image from '@tiptap/extension-image'
import { mergeAttributes, type Attributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { getTopologyArtifact } from '@mixtape/content/topologyArtifacts'
import { normaliseInteractiveHtmlUrl, normaliseInteractivePageAlignment } from '@mixtape/content/interactivePages'
import { mediaPlacementStyle, normaliseMediaAlignment, normaliseMediaWidth } from '@mixtape/content/mediaLayout'
import { createImageCaptionElement } from '@mixtape/content/captionHtml'
import { MediaImageView } from './MediaImageView'

export const interactivePageEditorCss = {
  display: 'flow-root',
  '@media (max-width: 47.999rem)': {
    '& img[data-interactive-page-url], & img[data-topology-id], & figure[data-image-figure]': {
      width: '100% !important', float: 'none !important', marginInline: '0 !important', marginBlock: '1rem !important',
    },
  },
}

// Keep the ordinary image node as a useful fallback for exports and other readers.
export const TopologyImage = Image.extend({
  parseHTML() {
    return [
      { tag: 'figure[data-image-figure]', getAttrs: element => {
        const image = element.querySelector('img')
        return image?.getAttribute('src') ? {
          src: image.getAttribute('src'), alt: image.getAttribute('alt'), title: image.getAttribute('title'),
        } : false
      } },
      ...(this.parent?.() ?? []),
    ]
  },
  renderHTML({ node, HTMLAttributes }) {
    const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)
    if (node.attrs.interactivePageUrl || node.attrs.topologyId) return ['img', attrs]
    const caption = node.attrs.caption ? createImageCaptionElement(String(node.attrs.caption)) : null
    if (caption) caption.setAttribute('style', 'text-align:center;margin-top:0.5rem;font-size:0.875rem;white-space:pre-wrap')
    return ['figure', { 'data-image-figure': '', style: mediaPlacementStyle(node.attrs.imageAlignment, node.attrs.imageWidthPercent) },
      ['img', { ...attrs, style: 'width:100%;height:auto;display:block;margin:0' }],
      ...(caption ? [caption] : []),
    ]
  },
  addNodeView() { return ReactNodeViewRenderer(MediaImageView) },
  addAttributes() {
    const inherited: Attributes = this.parent?.() ?? {}
    // Figure parsing must read the nested image, including the base Image attributes.
    const imageAttributes = Object.fromEntries(Object.entries(inherited).map(([name, attribute]) => [name, {
      ...attribute,
      parseHTML: (element: HTMLElement) => (element.matches('img') ? element : element.querySelector('img'))?.getAttribute(name) ?? null,
    }]))
    return {
      ...imageAttributes,
      imageAlignment: {
        default: 'center',
        parseHTML: (element: HTMLElement) => normaliseMediaAlignment((element.matches('img') ? element : element.querySelector('img'))?.getAttribute('data-image-alignment')),
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-image-alignment': normaliseMediaAlignment(attributes.imageAlignment) }),
      },
      imageWidthPercent: {
        default: 60,
        parseHTML: (element: HTMLElement) => normaliseMediaWidth((element.matches('img') ? element : element.querySelector('img'))?.getAttribute('data-image-width-percent')),
        renderHTML: (attributes: Record<string, unknown>) => ({ 'data-image-width-percent': normaliseMediaWidth(attributes.imageWidthPercent) }),
      },
      caption: {
        default: '',
        parseHTML: (element: HTMLElement) => (element.matches('img') ? element : element.querySelector('img'))?.getAttribute('data-image-caption') ?? '',
        renderHTML: (attributes: Record<string, unknown>) => attributes.caption ? { 'data-image-caption': attributes.caption } : {},
      },
      topologyId: {
        default: null,
        parseHTML: (element: HTMLElement) => getTopologyArtifact(element.getAttribute('data-topology-id'))?.id ?? null,
        renderHTML: (attributes: { topologyId?: string }) => {
          const artifact = getTopologyArtifact(attributes.topologyId)
          return artifact ? { 'data-topology-id': artifact.id } : {}
        },
      },
      interactivePageUrl: {
        default: null,
        parseHTML: (element: HTMLElement) => normaliseInteractiveHtmlUrl(element.getAttribute('data-interactive-page-url')) ?? null,
        renderHTML: (attributes: { interactivePageUrl?: string }) => {
          const url = normaliseInteractiveHtmlUrl(attributes.interactivePageUrl)
          return url ? { 'data-interactive-page-url': url } : {}
        },
      },
      interactivePageTitle: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-interactive-page-title'),
        renderHTML: (attributes: { interactivePageTitle?: string }) => attributes.interactivePageTitle
          ? { 'data-interactive-page-title': attributes.interactivePageTitle } : {},
      },
      interactivePageAlignment: {
        default: 'center',
        parseHTML: (element: HTMLElement) => normaliseInteractivePageAlignment(element.getAttribute('data-interactive-page-alignment')),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!normaliseInteractiveHtmlUrl(attributes.interactivePageUrl) && !getTopologyArtifact(attributes.topologyId)) return {}
          const alignment = normaliseInteractivePageAlignment(attributes.interactivePageAlignment)
          return { 'data-interactive-page-alignment': alignment, style: mediaPlacementStyle(alignment) }
        },
      },
    }
  },
}).configure({ inline: false, HTMLAttributes: { class: 'editor-image' } })
