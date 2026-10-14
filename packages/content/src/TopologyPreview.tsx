'use client'

import { Box, Image, Link } from '@chakra-ui/react'
import type { InteractivePage } from './interactivePages'
import { useTopologyReadingSurface } from './TopologyReadingSurface'

/** Clickable still; public reading surfaces supply the Dissolve interaction. */
export function TopologyPreview({ artifact }: { artifact: InteractivePage }) {
  const openTopology = useTopologyReadingSurface()
  return (
    <Box as="figure" className="top-preview" w={{ base: '100%', md: '60%' }} mx="auto" my={5}>
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
