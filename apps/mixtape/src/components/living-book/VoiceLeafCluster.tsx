'use client'

import { useState } from 'react'
import { Box, Button, Text, VStack, HStack } from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import type { LeafCluster } from '@mixtape/api/clients/livingBook/branchApi'

interface VoiceLeafClusterProps {
  leafCluster: LeafCluster
  // audioUrl is derived from the piece if it has a voice_note_url field;
  // passed explicitly here to keep this component independent of the piece fetch.
  audioUrl?: string
  transcript?: string
}

export function VoiceLeafCluster({
  leafCluster,
  audioUrl,
  transcript,
}: VoiceLeafClusterProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const transcriptBg = useColorModeValue('gray.50', 'gray.750')

  return (
    <VStack align="stretch" gap={2}>
      <HStack justify="space-between">
        <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
          {leafCluster.piece.title}
        </Text>
        <Text fontSize="xs" color="gray.500">
          by {leafCluster.piece.author_username ?? 'unknown'}
        </Text>
      </HStack>

      {/* Audio player — primary element */}
      {audioUrl ? (
        <audio
          controls
          src={audioUrl}
          style={{ width: '100%', height: '36px' }}
        />
      ) : (
        <Text fontSize="xs" color="gray.400">Audio unavailable</Text>
      )}

      {/* Transcript — secondary, collapsed by default */}
      {transcript && (
        <Box>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setTranscriptOpen((v) => !v)}
          >
            {transcriptOpen ? 'Hide transcript' : 'Show transcript'}
          </Button>
          {transcriptOpen && (
            <Box bg={transcriptBg} p={2} borderRadius="md" mt={1}>
              <Text fontSize="xs" color="gray.600" whiteSpace="pre-wrap">
                {transcript}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </VStack>
  )
}
