'use client'

import { useEffect, useRef, useState } from 'react'
import { Box, Image } from '@chakra-ui/react'
import { MediaFigure } from './MediaFigure'
import { normaliseMediaAlignment, normaliseMediaWidth } from './mediaLayout'
import { ReadingMediaDialog } from './ReadingMediaDialog'
import { ImageCaption, useImageCaption } from './ImageCaption'

export function normaliseImageSource(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const source = value.trim()
  if (source.startsWith('/') && !source.startsWith('//')) return source
  try {
    const url = new URL(source)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined
  } catch { return undefined }
}

export function ImagePreview({ attrs }: { attrs?: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLAnchorElement>(null)
  const owner = useRef('')
  const returning = useRef(false)
  useEffect(() => {
    const sync = () => {
      returning.current = false
      setOpen(!!owner.current && window.history.state?.readingImageOwner === owner.current)
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])
  const showImage = () => {
    if (!owner.current) owner.current = crypto.randomUUID()
    returning.current = false
    window.history.pushState({ ...window.history.state, readingImageOwner: owner.current }, '', window.location.href)
    setOpen(true)
  }
  const returnToReading = () => {
    if (returning.current) return
    if (window.history.state?.readingImageOwner === owner.current) {
      returning.current = true
      window.history.back()
    } else setOpen(false)
  }
  const src = normaliseImageSource(attrs?.src)
  const alt = typeof attrs?.alt === 'string' ? attrs.alt : ''
  const caption = typeof attrs?.caption === 'string' ? attrs.caption : ''
  const parsedCaption = useImageCaption(caption)
  const title = parsedCaption?.text || alt || 'Image'
  if (!src) return null
  return <>
    <MediaFigure alignment={normaliseMediaAlignment(attrs?.imageAlignment)} widthPercent={normaliseMediaWidth(attrs?.imageWidthPercent)} className="img-preview">
      <Box asChild className="img-preview-trigger" display="block" w="full" cursor="zoom-in" borderRadius="md"
        _focusVisible={{ outline: '2px solid', outlineColor: 'theme.accent', outlineOffset: '3px' }}>
        <a ref={trigger} href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open full image: ${title}`} onClick={event => {
          if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); showImage() }
        }}>
          <Image src={src} alt={alt} w="full" h="auto" borderRadius="md" style={{ margin: 0 }} />
        </a>
      </Box>
      {caption && <ImageCaption as="figcaption" className="img-preview-caption" caption={caption} mt={2} />}
    </MediaFigure>
    <ReadingMediaDialog open={open} title={title} href={src} standaloneLabel="Open full image" onClose={returnToReading} returnFocusTo={trigger.current}>
      <Box className="img-modal-body" flex="1" minH={0} overflow="auto" p={4} display="flex" flexDirection="column" alignItems="center" gap={3}>
        <Image src={src} alt={alt} maxW="100%" maxH="calc(98vh - 8rem)" objectFit="contain" flexShrink={0} style={{ margin: 'auto' }} />
        {caption && <ImageCaption className="img-modal-caption" caption={caption} />}
      </Box>
    </ReadingMediaDialog>
  </>
}
