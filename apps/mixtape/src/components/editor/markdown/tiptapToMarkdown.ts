// src/components/editor/markdown/tiptapToMarkdown.ts
//
// Converts the TipTap JSON in our editors to Markdown for "Export to Markdown".
// Runs in the browser; no backend involved. Handles the node and mark types our
// schema actually uses. Editor-only markers (split points, segment boundaries,
// outline markers, LB anchors, comment highlights) are left out.
//
// Kept free of runtime imports so it can be tested on its own.
//
// TODO: consolidate Markdown converters. Catalyst has a second one, htmlToMd in
// src/app/(authenticated)/groups/[slug]/catalyst/page.tsx (a regex pass over
// editor.getHTML()). Move it onto this one and delete it.

import type { TipTapNode, TipTapMark } from '@mixtape/content/TipTapRenderer'

type Node = TipTapNode

const OMITTED_NODES = new Set(['splitMarker', 'segmentBoundary', 'outlineMarker', 'lbAnchor'])
const DIALOGUE_LABELS: Record<string, string> = { querent: 'Me', respondent: 'Agent' }

export function tiptapToMarkdown(doc: Node | null | undefined): string {
  if (!doc) return ''
  const body = renderBlocks(doc.content ?? [])
  return body ? `${body}\n` : ''
}

/** A filename stem from the first heading (or first line of text), else "manuscript". */
export function markdownFilename(doc: Node | null | undefined): string {
  const blocks = doc?.content ?? []
  const heading = blocks.find(block => block.type === 'heading')
  const source = heading ?? blocks.find(block => plainText(block).trim())
  const stem = (source ? plainText(source) : '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
  return `${stem || 'manuscript'}.md`
}

function plainText(node: Node): string {
  if (node.type === 'text') return node.text ?? ''
  return (node.content ?? []).map(child => plainText(child as Node)).join('')
}

// --- Blocks ---

function renderBlocks(blocks: Node[]): string {
  return blocks
    .map(renderBlock)
    .filter(text => text.trim() !== '')
    .join('\n\n')
}

function renderBlock(node: Node): string {
  if (OMITTED_NODES.has(node.type)) return ''
  switch (node.type) {
    case 'paragraph':
      return escapeLineStart(renderInline(node.content ?? []))
    case 'heading': {
      const level = Math.min(Math.max(Number(node.attrs?.level) || 1, 1), 6)
      return `${'#'.repeat(level)} ${renderInline(node.content ?? []).replace(/\n/g, ' ')}`
    }
    case 'blockquote': {
      let inner = renderBlocks(node.content ?? [])
      const label = DIALOGUE_LABELS[String(node.attrs?.role ?? '')]
      if (label) inner = `**${label}:** ${inner}`
      return prefixLines(inner, '> ', '>')
    }
    case 'bulletList':
      return renderList(node, () => '- ')
    case 'orderedList': {
      const start = Number(node.attrs?.start) || 1
      return renderList(node, index => `${start + index}. `)
    }
    case 'codeBlock': {
      const code = plainText(node)
      const fence = code.includes('```') ? '~~~' : '```'
      return `${fence}${node.attrs?.language ?? ''}\n${code}\n${fence}`
    }
    case 'horizontalRule':
      return '---'
    case 'image':
      return renderImage(node)
    default:
      // Unknown blocks: keep whatever text they hold.
      if (node.content?.some(child => child.type === 'text')) return renderInline(node.content)
      return renderBlocks(node.content ?? [])
  }
}

function renderList(list: Node, marker: (index: number) => string): string {
  return (list.content ?? [])
    .map((item, index) => {
      const bullet = marker(index)
      const body = renderBlocks((item as Node).content ?? []) || ''
      const indent = ' '.repeat(bullet.length)
      return bullet + body.split('\n').map((line, i) => (i === 0 || !line ? line : indent + line)).join('\n')
    })
    .join('\n')
}

function renderImage(node: Node): string {
  const attrs = node.attrs ?? {}
  const src = String(attrs.src ?? '')
  if (!src) return ''
  const pageUrl = typeof attrs.interactivePageUrl === 'string' ? attrs.interactivePageUrl : ''
  const pageTitle = typeof attrs.interactivePageTitle === 'string' ? attrs.interactivePageTitle.trim() : ''
  const alt = escapeText(String(attrs.alt ?? pageTitle ?? ''))
  const title = typeof attrs.title === 'string' && attrs.title ? ` "${attrs.title.replace(/"/g, '\\"')}"` : ''
  const parts = [`![${alt}](${linkTarget(src)}${title})`]
  if (pageUrl) parts.push(`[Open interactive page${pageTitle ? `: ${escapeText(pageTitle)}` : ''}](${linkTarget(pageUrl)})`)
  const caption = typeof attrs.caption === 'string' ? captionToMarkdown(attrs.caption) : ''
  if (caption) parts.push(`*${caption}*`)
  return parts.join('\n\n')
}

/** Captions are a small HTML subset (text, links, line breaks). */
function captionToMarkdown(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
        (_m, href: string, text: string) => `[${text.replace(/<[^>]+>/g, '')}](${linkTarget(decodeEntities(href))})`)
      .replace(/<[^>]+>/g, ''),
  ).replace(/\s+/g, ' ').trim()
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

// --- Inline ---

const MARK_ORDER = ['link', 'bold', 'italic', 'strike', 'underline'] as const

function renderInline(nodes: Node[]): string {
  let out = ''
  for (const node of nodes) {
    if (node.type === 'text') out += renderText(node.text ?? '', node.marks ?? [])
    else if (node.type === 'hardBreak') out += '\\\n'
    else if (node.type === 'image') out += renderImage(node)
    else if (OMITTED_NODES.has(node.type)) continue
    else if (node.content) out += renderInline(node.content as Node[])
  }
  return out
}

function renderText(text: string, marks: TipTapMark[]): string {
  if (!text) return ''
  const types = new Set(marks.map(mark => mark.type))
  if (types.has('code')) {
    const ticks = text.includes('`') ? '``' : '`'
    const pad = ticks.length > 1 ? ' ' : ''
    return wrapLink(`${ticks}${pad}${text}${pad}${ticks}`, marks)
  }
  // Keep surrounding spaces outside the delimiters: "** bold**" isn't bold.
  const [, lead, core, trail] = text.match(/^(\s*)([\s\S]*?)(\s*)$/) ?? ['', '', text, '']
  if (!core) return text
  let result = escapeText(core)
  for (const type of [...MARK_ORDER].reverse()) {
    if (!types.has(type) || type === 'link') continue
    if (type === 'bold') result = `**${result}**`
    if (type === 'italic') result = `*${result}*`
    if (type === 'strike') result = `~~${result}~~`
    if (type === 'underline') result = `<u>${result}</u>`
  }
  return lead + wrapLink(result, marks) + trail
}

function wrapLink(text: string, marks: TipTapMark[]): string {
  const link = marks.find(mark => mark.type === 'link')
  const href = typeof link?.attrs?.href === 'string' ? link.attrs.href : ''
  return href ? `[${text}](${linkTarget(href)})` : text
}

function linkTarget(url: string): string {
  return /[\s()<>]/.test(url) ? `<${url.replace(/[<>]/g, encodeURIComponent)}>` : url
}

function escapeText(text: string): string {
  return text.replace(/([\\`*_[\]<>~])/g, '\\$1')
}

/** Stop plain paragraphs from turning into headings, quotes, or lists. */
function escapeLineStart(text: string): string {
  return text
    .split('\n')
    .map(line => line
      .replace(/^(\s*)(#{1,6}\s|>|[-+]\s|=+\s*$|-{3,}\s*$)/, '$1\\$2')
      .replace(/^(\s*)(\d+)([.)]\s)/, '$1$2\\$3'))
    .join('\n')
}

function prefixLines(text: string, prefix: string, blankPrefix: string): string {
  return text.split('\n').map(line => (line ? prefix + line : blankPrefix)).join('\n')
}
