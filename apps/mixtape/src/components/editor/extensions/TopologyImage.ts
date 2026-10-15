import Image from '@tiptap/extension-image'
import { getTopologyArtifact } from '@mixtape/content/topologyArtifacts'
import { normaliseInteractiveHtmlUrl, normaliseInteractivePageAlignment } from '@mixtape/content/interactivePages'

export const interactivePageEditorCss = {
  display: 'flow-root',
  '@media (max-width: 47.999rem)': {
    '& img[data-interactive-page-url], & img[data-topology-id]': {
      width: '100% !important', float: 'none !important', marginInline: '0 !important', marginBlock: '1rem !important',
    },
  },
}

// Keep the ordinary image node as a useful fallback for exports and other readers.
export const TopologyImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
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
          const placement = alignment === 'center' ? 'float:none;margin:1em auto'
            : alignment === 'left' ? 'float:left;margin:0 1.5em 1em 0' : 'float:right;margin:0 0 1em 1.5em'
          return { 'data-interactive-page-alignment': alignment, style: `width:60%;height:auto;display:block;${placement}` }
        },
      },
    }
  },
}).configure({ inline: false, HTMLAttributes: { class: 'editor-image' } })
