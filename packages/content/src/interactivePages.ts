import { getTopologyArtifact, topologyArtifacts } from './topologyArtifacts'

const publicOrigin = 'https://www.crossroads.place'
export type InteractivePageAlignment = 'left' | 'center' | 'right'
export interface InteractivePage { title: string; htmlUrl: string; imageUrl: string; alignment?: InteractivePageAlignment }

export function normaliseInteractivePageAlignment(value: unknown): InteractivePageAlignment {
  return value === 'left' || value === 'right' ? value : 'center'
}

/** Only our published artifact HTML may run inside a reader. Not arbitrary websites. */
export function normaliseInteractiveHtmlUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  try {
    const url = new URL(value.trim(), publicOrigin)
    if (url.origin !== publicOrigin || url.username || url.password
      || !/^\/artifacts\/[a-zA-Z0-9_./-]+\.html?$/i.test(url.pathname)) return undefined
    return url.href
  } catch { return undefined }
}

export function suggestedPreviewUrl(htmlUrl: string): string {
  const valid = normaliseInteractiveHtmlUrl(htmlUrl)
  if (!valid) return ''
  const url = new URL(valid)
  url.pathname = url.pathname.replace(/\.html?$/i, '.png')
  url.search = ''
  url.hash = ''
  return url.href
}

export function normalisePreviewImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  try {
    const url = new URL(value.trim(), publicOrigin)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined
  } catch { return undefined }
}

export function resolveInteractivePage(attrs?: Record<string, unknown>): InteractivePage | undefined {
  if (attrs?.interactivePageUrl) {
    const htmlUrl = normaliseInteractiveHtmlUrl(attrs.interactivePageUrl)
    const imageUrl = normalisePreviewImageUrl(attrs.src)
    if (!htmlUrl || !imageUrl) return undefined
    const title = typeof attrs.interactivePageTitle === 'string' ? attrs.interactivePageTitle.trim() : ''
    return { htmlUrl, imageUrl, title: title.slice(0, 160) || (typeof attrs.alt === 'string' ? attrs.alt : 'Interactive page'), alignment: normaliseInteractivePageAlignment(attrs.interactivePageAlignment) }
  }
  // Preserve previews created with the original topology-specific control.
  const preset = getTopologyArtifact(attrs?.topologyId)
  return preset ? { ...preset, alignment: normaliseInteractivePageAlignment(attrs?.interactivePageAlignment) } : undefined
}

/** Restore shared reading URLs even when a preview is outside the visible manuscript. */
export function interactivePageForReadingUrl(value: string | null, legacyId?: string | null): InteractivePage | undefined {
  const htmlUrl = normaliseInteractiveHtmlUrl(value)
  if (htmlUrl) {
    const preset = topologyArtifacts.find(page => page.htmlUrl === htmlUrl)
    return preset ?? { htmlUrl, imageUrl: suggestedPreviewUrl(htmlUrl), title: 'Interactive page' }
  }
  return value ? undefined : getTopologyArtifact(legacyId)
}
