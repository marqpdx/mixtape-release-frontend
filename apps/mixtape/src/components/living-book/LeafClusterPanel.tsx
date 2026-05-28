'use client'

import {
  Box,
  Button,
  HStack,
  Text,
  VStack,
  Badge,
  Spinner,
} from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import { useLeafClusters, useDetachLeafCluster } from '@mixtape/api/hooks/useBranches'
import { VoiceLeafCluster } from './VoiceLeafCluster'
import type { LeafCluster } from '@mixtape/api/clients/livingBook/branchApi'

interface LeafClusterPanelProps {
  lbId: string
  branchId: string
  currentUserId: string
  onClose: () => void
  onAttach: () => void
  onNavigateToPiece: (piece: { slug: string }) => void
}

export function LeafClusterPanel({
  lbId,
  branchId,
  currentUserId,
  onClose,
  onAttach,
  onNavigateToPiece,
}: LeafClusterPanelProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const bg = useColorModeValue('white', 'gray.800')
  const rowBg = useColorModeValue('gray.50', 'gray.750')

  const { data: leafClusters = [], isLoading } = useLeafClusters(lbId, branchId)
  const detach = useDetachLeafCluster(lbId, branchId)

  return (
    <Box
      w="360px"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      bg={bg}
      p={4}
      shadow="md"
      maxH="480px"
      overflowY="auto"
    >
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between">
          <Text fontSize="sm" fontWeight="semibold">Leaf Clusters</Text>
          <HStack gap={2}>
            <Button size="xs" colorPalette="teal" variant="outline" onClick={onAttach}>
              + Attach
            </Button>
            <Button size="xs" variant="ghost" onClick={onClose}>✕</Button>
          </HStack>
        </HStack>

        {isLoading && <Spinner size="sm" />}

        {!isLoading && leafClusters.length === 0 && (
          <Text fontSize="sm" color="gray.500">
            No responses yet. Attach a piece or send a writing invitation.
          </Text>
        )}

        {leafClusters.map((lc: LeafCluster) => (
          <Box key={lc.id} bg={rowBg} borderRadius="md" p={3}>
            {lc.media_type === 'voice' ? (
              <VoiceLeafCluster leafCluster={lc} />
            ) : (
              <VStack align="stretch" gap={1}>
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                    {lc.piece.title}
                  </Text>
                  <Badge size="xs" colorPalette="gray" variant="subtle">
                    {lc.media_type}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  by {lc.piece.author_username ?? 'unknown'}
                </Text>
              </VStack>
            )}

            <HStack mt={2} gap={2}>
              <Button
                size="xs"
                variant="outline"
                onClick={() => onNavigateToPiece(lc.piece)}
              >
                Open
              </Button>
              {lc.created_by === currentUserId && (
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  disabled={detach.isPending}
                  onClick={() => detach.mutate(lc.id)}
                >
                  Detach
                </Button>
              )}
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}
