'use client'

import { Box, Image, Link } from '@chakra-ui/react'
import { normaliseInteractivePageAlignment, type InteractivePage } from './interactivePages'
import { useTopologyReadingSurface } from './TopologyReadingSurface'

/** Clickable still; public reading surfaces supply the Dissolve interaction. */
export function TopologyPreview({ artifact }: { artifact: InteractivePage }) {
  const openTopology = useTopologyReadingSurface()
  const alignment = normaliseInteractivePageAlignment(artifact.alignment)
  return (
    <Box as="figure" className="top-preview" data-alignment={alignment} w={{ base: '100%', md: '60%' }}
      float={{ base: 'none', md: alignment === 'center' ? 'none' : alignment }}
      ms={{ base: 0, md: alignment === 'right' ? 6 : alignment === 'center' ? 'auto' : 0 }}
      me={{ base: 0, md: alignment === 'left' ? 6 : alignment === 'center' ? 'auto' : 0 }}
      mt={{ base: 5, md: alignment === 'center' ? 5 : 0 }} mb={5}>
      <Box asChild className="top-preview-trigger" display="block" w="full" p={0} border={0} bg="transparent" cursor="zoom-in" borderRadius="md" _focusVisible={{ outline: '2px solid', outlineColor: 'theme.accent', outlineOffset: '3px' }}>
        <a href={artifact.htmlUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open interactive ${artifact.title}`} onClick={event => {
          if (openTopology && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            event.preventDefault()
            openTopology(artifact, event.currentTarget)
          }
        }}>
          <Image src={artifact.imageUrl} alt={artifact.title} w="full" h="auto" borderRadius="md" style={{ margin: 0 }} />
        </a>
      </Box>
      <Box as="figcaption" className="top-preview-caption" textAlign="center" mt={2} fontSize="sm">
        <Link href={artifact.htmlUrl} target="_blank" rel="noopener noreferrer" textDecoration="underline">Open standalone page ↗</Link>
      </Box>
    </Box>
  )
}
