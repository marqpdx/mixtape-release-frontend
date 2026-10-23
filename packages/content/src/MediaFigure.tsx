'use client'

import { Box, type BoxProps } from '@chakra-ui/react'
import { normaliseMediaWidth, type MediaAlignment } from './mediaLayout'

/** One placement contract for interactive previews and ordinary images. */
export function MediaFigure({ alignment = 'center', widthPercent, ...props }: BoxProps & { alignment?: MediaAlignment; widthPercent?: number }) {
  return <Box as="figure" className="media-figure" data-alignment={alignment}
    w={{ base: '100%', md: `${normaliseMediaWidth(widthPercent)}%` }}
    float={{ base: 'none', md: alignment === 'center' ? 'none' : alignment }}
    ms={{ base: 0, md: alignment === 'right' ? 6 : alignment === 'center' ? 'auto' : 0 }}
    me={{ base: 0, md: alignment === 'left' ? 6 : alignment === 'center' ? 'auto' : 0 }}
    mt={{ base: 5, md: alignment === 'center' ? 5 : 0 }} mb={5} {...props} />
}
