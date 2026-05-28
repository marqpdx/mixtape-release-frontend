'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  HStack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import {
  useUpdateBranch,
  useSendInvitation,
  useDeleteBranch,
  useLeafClusters,
} from '@mixtape/api/hooks/useBranches'
import { LeafClusterPanel } from './LeafClusterPanel'
import type { Branch } from '@mixtape/api/clients/livingBook/branchApi'

interface BranchPanelProps {
  branch: Branch
  lbId: string
  collaboratorCount: number
  currentUserId: string
  sponsor: { type: 'group' | 'member'; slug: string }
  onClose: () => void
}

export function BranchPanel({
  branch,
  lbId,
  collaboratorCount,
  currentUserId,
  sponsor,
  onClose,
}: BranchPanelProps) {
  const [leafPanelOpen, setLeafPanelOpen] = useState(false)
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const bg = useColorModeValue('white', 'gray.800')

  const [promptText, setPromptText] = useState(branch.prompt_text ?? '')
  const [dueDate, setDueDate] = useState(branch.due_date ?? '')
  const [sendConfirm, setSendConfirm] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateBranch = useUpdateBranch(lbId, branch.id)
  const sendInvitation = useSendInvitation(lbId, branch.id)
  const deleteBranch = useDeleteBranch(lbId)
  const { data: leafClusters = [] } = useLeafClusters(lbId, branch.id)

  // Debounced save on prompt/date change
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      updateBranch.mutate({
        prompt_text: promptText || null,
        due_date: dueDate || null,
      })
    }, 800)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [promptText, dueDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if (!sendConfirm) { setSendConfirm(true); return }
    sendInvitation.mutate(undefined, { onSuccess: onClose })
  }

  const handleDelete = () => {
    if (leafClusters.length > 0) return
    deleteBranch.mutate(branch.id, { onSuccess: onClose })
  }

  return (
    <Box
      w="320px"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      bg={bg}
      p={4}
      shadow="md"
    >
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between">
          <Text fontSize="sm" fontWeight="semibold">Branch</Text>
          <Button size="xs" variant="ghost" onClick={onClose}>✕</Button>
        </HStack>

        <Box>
          <Text fontSize="xs" color="gray.500" mb={1}>Writing prompt (optional)</Text>
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="What would you like collaborators to write about here?"
            size="sm"
            rows={3}
            resize="vertical"
          />
        </Box>

        <Box>
          <Text fontSize="xs" color="gray.500" mb={1}>Due date (optional)</Text>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ fontSize: '0.875rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #CBD5E0', width: '100%' }}
          />
        </Box>

        <Button
          size="sm"
          colorPalette="teal"
          disabled={!promptText.trim() || sendInvitation.isPending}
          onClick={handleSend}
        >
          {sendConfirm
            ? `Confirm — send to ${collaboratorCount} collaborator${collaboratorCount !== 1 ? 's' : ''}?`
            : 'Send Invitation'}
        </Button>
        {sendConfirm && (
          <Button size="xs" variant="ghost" onClick={() => setSendConfirm(false)}>
            Cancel
          </Button>
        )}

        <Button size="sm" variant="outline" onClick={() => setLeafPanelOpen(true)}>
          {leafClusters.length > 0
            ? `View ${leafClusters.length} response${leafClusters.length !== 1 ? 's' : ''}`
            : 'Attach a piece'}
        </Button>

        <Text
          fontSize="xs"
          color={leafClusters.length > 0 ? 'gray.400' : 'red.400'}
          cursor={leafClusters.length > 0 ? 'not-allowed' : 'pointer'}
          onClick={leafClusters.length === 0 ? handleDelete : undefined}
          mt={1}
        >
          {leafClusters.length > 0
            ? `Cannot delete — ${leafClusters.length} leaf cluster(s) attached`
            : 'Delete branch'}
        </Text>
      </VStack>

      {leafPanelOpen && (
        <Box position="absolute" top={0} left="calc(100% + 8px)" zIndex={10}>
          <LeafClusterPanel
            lbId={lbId}
            branchId={branch.id}
            currentUserId={currentUserId}
            sponsor={sponsor}
            onClose={() => setLeafPanelOpen(false)}
            onNavigateToPiece={() => {}}
          />
        </Box>
      )}
    </Box>
  )
}
