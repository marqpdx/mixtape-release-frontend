'use client'

import { useEffect, useState } from 'react'
import { Box, type BoxProps } from '@chakra-ui/react'
import { createImageCaptionElement } from './captionHtml'

export function useImageCaption(caption: string) {
  const [parsed, setParsed] = useState<{ source: string; html: string; text: string } | null>(null)
  useEffect(() => {
    const safe = createImageCaptionElement(caption)
    setParsed({ source: caption, html: safe.innerHTML, text: safe.textContent ?? '' })
  }, [caption])
  return parsed?.source === caption ? parsed : null
}

/** The SSR fallback is escaped text; only our allowlisted DOM becomes HTML. */
export function ImageCaption({ caption, ...props }: BoxProps & { caption: string }) {
  const parsed = useImageCaption(caption)
  const style = { '& a[href]': { color: 'theme.accent', textDecoration: 'underline', textUnderlineOffset: '2px' } }
  return parsed
    ? <Box textAlign="center" fontSize="sm" whiteSpace="pre-wrap" css={style} {...props} dangerouslySetInnerHTML={{ __html: parsed.html }} />
    : <Box textAlign="center" fontSize="sm" whiteSpace="pre-wrap" {...props}>{caption}</Box>
}
