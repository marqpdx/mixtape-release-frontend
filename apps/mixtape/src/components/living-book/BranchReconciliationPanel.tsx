'use client'

import {
  Box,
  Button,
  HStack,
  Text,
  VStack,
  Badge,
} from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import { useBranches, useDeleteBranch } from '@mixtape/api/hooks/useBranches'
import type { Branch } from '@mixtape/api/clients/livingBook/branchApi'

interface BranchReconciliationPanelProps {
  lbId: string
  // Called when user triggers reattach for a specific anchorId.
  // Parent should put the editor into anchor-insertion mode with this ID.
  onReattach: (anchorId: string) => void
  onClose: () => void
}

export function BranchReconciliationPanel({
  lbId,
  onReattach,
  onClose,
}: BranchReconciliationPanelProps) {
  const bg = useColorModeValue('white', 'gray.800')
  const rowBg = useColorModeValue('orange.50', 'orange.900')

  const { data: branches = [] } = useBranches(lbId)
  const deleteBranch = useDeleteBranch(lbId)

  const detached = branches.filter((b: Branch) => b.is_detached)

  if (detached.length === 0) return null

  return (
    <Box
      border="1px solid"
      borderColor="orange.300"
      borderRadius="md"
      bg={bg}
      p={4}
      shadow="md"
      maxH="400px"
      overflowY="auto"
    >
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between">
          <HStack gap={2}>
            <Text fontSize="sm" fontWeight="semibold" color="orange.600">
              ⚠ Detached Branches
            </Text>
            <Badge colorPalette="orange" variant="subtle" size="xs">
              {detached.length}
            </Badge>
          </HStack>
          <Button size="xs" variant="ghost" onClick={onClose}>✕</Button>
        </HStack>

        <Text fontSize="xs" color="gray.500">
          These branch anchors were removed from the trunk text. Reattach them to
          restore their position, or discard if no longer needed.
        </Text>

        {detached.map((branch: Branch) => {
          const leafCount = 0 // populated from leaf-cluster query if needed
          return (
            <Box key={branch.id} bg={rowBg} borderRadius="md" p={3}>
              <VStack align="stretch" gap={1}>
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                  {branch.anchor_node_id.slice(0, 8)}…
                </Text>
                {branch.prompt_text && (
                  <Text fontSize="sm" lineClamp={2}>
                    "{branch.prompt_text}"
                  </Text>
                )}
                <HStack gap={2} mt={1}>
                  <Button
                    size="xs"
                    colorPalette="teal"
                    onClick={() => onReattach(branch.anchor_node_id)}
                  >
                    Reattach
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorPalette="red"
                    disabled={leafCount > 0 || deleteBranch.isPending}
                    onClick={() => deleteBranch.mutate(branch.id)}
                  >
                    {leafCount > 0 ? `Discard (${leafCount} attached)` : 'Discard'}
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )
        })}
      </VStack>
    </Box>
  )
}
