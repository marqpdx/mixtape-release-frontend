const allowedTags = new Set(['a', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'small', 'sub', 'sup', 'code', 'span'])
const discardContents = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template'])

function captionHref(value: string | null): string | undefined {
  if (!value?.trim()) return undefined
  try {
    const href = value.trim()
    const url = new URL(href, 'https://caption.invalid/')
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol) || url.username || url.password) return undefined
    return href
  } catch { return undefined }
}

/** Parse in an inert template, then construct only allowed elements and attributes.
 * Never insert the input DOM into the document; scripts, styles, images and event
 * handlers cannot enter either a rendered caption or the exported figcaption.
 */
export function createImageCaptionElement(caption: string, ownerDocument: Document = document): HTMLElement {
  const input = ownerDocument.createElement('template')
  input.innerHTML = caption
  const output = ownerDocument.createElement('figcaption')
  const append = (source: Node, target: Node, depth = 0) => {
    if (depth > 32) return
    if (source.nodeType === 3) { target.appendChild(ownerDocument.createTextNode(source.textContent ?? '')); return }
    if (source.nodeType !== 1) return
    const element = source as Element
    const tag = element.tagName.toLowerCase()
    if (discardContents.has(tag)) return
    if (!allowedTags.has(tag)) {
      element.childNodes.forEach(child => append(child, target, depth + 1))
      return
    }
    const safe = ownerDocument.createElement(tag)
    if (tag === 'a') {
      const href = captionHref(element.getAttribute('href'))
      if (href) {
        safe.setAttribute('href', href)
        safe.setAttribute('target', '_blank')
        safe.setAttribute('rel', 'noopener noreferrer')
      }
    }
    element.childNodes.forEach(child => append(child, safe, depth + 1))
    target.appendChild(safe)
  }
  input.content.childNodes.forEach(child => append(child, output))
  return output
}

export function sanitiseImageCaption(caption: string): string {
  return createImageCaptionElement(caption).innerHTML
}
