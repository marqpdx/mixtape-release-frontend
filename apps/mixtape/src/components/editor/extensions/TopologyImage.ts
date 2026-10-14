import Image from '@tiptap/extension-image'
import { getTopologyArtifact } from '@mixtape/content/topologyArtifacts'
import { normaliseInteractiveHtmlUrl } from '@mixtape/content/interactivePages'

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
          return artifact ? { 'data-topology-id': artifact.id, style: 'width:60%;height:auto;display:block;margin-inline:auto' } : {}
        },
      },
      interactivePageUrl: {
        default: null,
        parseHTML: (element: HTMLElement) => normaliseInteractiveHtmlUrl(element.getAttribute('data-interactive-page-url')) ?? null,
        renderHTML: (attributes: { interactivePageUrl?: string }) => {
          const url = normaliseInteractiveHtmlUrl(attributes.interactivePageUrl)
          return url ? { 'data-interactive-page-url': url, style: 'width:60%;height:auto;display:block;margin-inline:auto' } : {}
        },
      },
      interactivePageTitle: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-interactive-page-title'),
        renderHTML: (attributes: { interactivePageTitle?: string }) => attributes.interactivePageTitle
          ? { 'data-interactive-page-title': attributes.interactivePageTitle } : {},
      },
    }
  },
}).configure({ inline: false, HTMLAttributes: { class: 'editor-image' } })
