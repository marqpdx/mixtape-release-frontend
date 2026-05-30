'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  HStack,
  IconButton,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import { IconBook2, IconSeparatorVertical } from '@tabler/icons-react'
import { useColorModeValue } from '@components/ui/color-mode'
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useSendInvitation,
  useDeleteBranch,
  useLeafClusters,
} from '@mixtape/api/hooks/useBranches'
import type { Branch } from '@mixtape/api/clients/livingBook/branchApi'
import type { LivingBook } from '@mixtape/api/clients/livingBook/livingBookApi'

interface LbDeskProps {
  isOpen: boolean
  onClose: () => void
  width: string
  lbId: string
  livingBook: LivingBook | null
  collaboratorCount: number
  currentUserId: string
  sponsor: { type: 'group' | 'member'; slug: string }
  onInsertAnchor: (anchorId: string) => void
}

export function LbDesk({
  isOpen,
  onClose,
  width,
  lbId,
  livingBook,
  collaboratorCount,
  currentUserId,
  sponsor,
  onInsertAnchor,
}: LbDeskProps) {
  const bg = useColorModeValue('gray.50', 'gray.800')
  const border = useColorModeValue('gray.200', 'gray.600')

  const { data: branches = [] } = useBranches(lbId)
  const createBranch = useCreateBranch(lbId)

  const detachedBranches = branches.filter((b: Branch) => b.is_detached)
  const activeBranches = branches.filter((b: Branch) => !b.is_detached)

  const handleAddBranch = () => {
    const anchor_node_id = crypto.randomUUID()
    createBranch.mutate({ anchor_node_id }, {
      onSuccess: (branch: Branch) => {
        onInsertAnchor(branch.id)
      },
    })
  }

  if (!isOpen) {
    return (
      <Box
        w="0px"
        transition="width 0.3s ease"
        bg={bg}
        borderLeft="1px solid"
        borderColor={border}
        h="100%"
        overflow="hidden"
      />
    )
  }

  return (
    <Box
      w={width}
      transition="width 0.3s ease"
      bg={bg}
      borderLeft="1px solid"
      borderColor={border}
      h="100%"
      overflow="hidden"
      position="relative"
    >
      <VStack gap={4} align="stretch" p={4} h="100%" overflow="auto">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack gap={2}>
            <IconBook2 size={16} color="teal" />
            <Box>
              <Text fontSize="sm" fontWeight="bold" color="teal.700">
                Living Book
              </Text>
              {livingBook && (
                <Text fontSize="xs" color="gray.500" lineClamp={1}>
                  {livingBook.title}
                </Text>
              )}
            </Box>
          </HStack>
          <IconButton
            size="sm"
            variant="ghost"
            bg="red.50"
            border="1px solid"
            borderColor="red.200"
            borderRadius="full"
            onClick={onClose}
            title="Close LB Desk"
            _hover={{ bg: 'red.100' }}
          >
            <IconSeparatorVertical size={16} color="red" />
          </IconButton>
        </HStack>

        {/* Add Branch */}
        <Button
          size="sm"
          colorPalette="teal"
          variant="outline"
          onClick={handleAddBranch}
          loading={createBranch.isPending}
        >
          🌿 Add Branch
        </Button>

        {/* Active branches */}
        {activeBranches.length === 0 && (
          <Text fontSize="xs" color="gray.400" textAlign="center" py={4}>
            No branches yet. Add a branch to invite collaborators to write a response.
          </Text>
        )}

        {activeBranches.map((branch: Branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            lbId={lbId}
            collaboratorCount={collaboratorCount}
            currentUserId={currentUserId}
            sponsor={sponsor}
          />
        ))}

        {/* Detached branches */}
        {detachedBranches.length > 0 && (
          <Box
            bg="orange.50"
            border="1px solid"
            borderColor="orange.200"
            borderRadius="md"
            p={3}
          >
            <Text fontSize="xs" fontWeight="semibold" color="orange.700" mb={2}>
              ⚠ {detachedBranches.length} detached branch{detachedBranches.length !== 1 ? 'es' : ''}
            </Text>
            <Text fontSize="xs" color="orange.600" mb={2}>
              These branches lost their anchor in the document. Reattach by clicking Add Branch in the editor to create a new anchor, or delete them.
            </Text>
            {detachedBranches.map((branch: Branch) => (
              <DetachedBranchRow
                key={branch.id}
                branch={branch}
                lbId={lbId}
                onReattach={onInsertAnchor}
              />
            ))}
          </Box>
        )}
      </VStack>
    </Box>
  )
}

// ── Branch card (inline editing inside the desk) ─────────────────────────────

interface BranchCardProps {
  branch: Branch
  lbId: string
  collaboratorCount: number
  currentUserId: string
  sponsor: { type: 'group' | 'member'; slug: string }
}

function BranchCard({ branch, lbId, collaboratorCount }: BranchCardProps) {
  const cardBg = useColorModeValue('white', 'gray.700')
  const border = useColorModeValue('gray.200', 'gray.600')

  const [promptText, setPromptText] = useState(branch.prompt_text ?? '')
  const [sendConfirm, setSendConfirm] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateBranch = useUpdateBranch(lbId, branch.id)
  const sendInvitation = useSendInvitation(lbId, branch.id)
  const deleteBranch = useDeleteBranch(lbId)
  const { data: leafClusters = [] } = useLeafClusters(lbId, branch.id)

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      updateBranch.mutate({ prompt_text: promptText || null, due_date: null })
    }, 800)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [promptText]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if (!sendConfirm) { setSendConfirm(true); return }
    sendInvitation.mutate(undefined, { onSuccess: () => setSendConfirm(false) })
  }

  const handleDelete = () => {
    if (leafClusters.length === 0) deleteBranch.mutate(branch.id)
  }

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={border}
      borderRadius="md"
      p={3}
    >
      <VStack align="stretch" gap={2}>
        <Text fontSize="xs" color="gray.500">
          Branch · {branch.invitation_sent ? '✉ Sent' : 'Draft'}
          {leafClusters.length > 0 ? ` · ${leafClusters.length} response${leafClusters.length !== 1 ? 's' : ''}` : ''}
        </Text>

        <Textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Writing prompt for collaborators…"
          size="xs"
          rows={3}
          resize="vertical"
          fontSize="sm"
        />

        <Button
          size="xs"
          colorPalette="teal"
          disabled={!promptText.trim() || sendInvitation.isPending || !!branch.invitation_sent}
          onClick={handleSend}
        >
          {branch.invitation_sent
            ? '✉ Invitation sent'
            : sendConfirm
              ? `Confirm — send to ${collaboratorCount} collaborator${collaboratorCount !== 1 ? 's' : ''}?`
              : 'Send Invitation'}
        </Button>
        {sendConfirm && (
          <Button size="xs" variant="ghost" onClick={() => setSendConfirm(false)}>
            Cancel
          </Button>
        )}

        {leafClusters.length === 0 && (
          <Text
            fontSize="xs"
            color="red.300"
            cursor="pointer"
            onClick={handleDelete}
          >
            Delete branch
          </Text>
        )}
      </VStack>
    </Box>
  )
}

// ── Detached branch row ───────────────────────────────────────────────────────

interface DetachedBranchRowProps {
  branch: Branch
  lbId: string
  onReattach: (anchorId: string) => void
}

function DetachedBranchRow({ branch, lbId, onReattach }: DetachedBranchRowProps) {
  const deleteBranch = useDeleteBranch(lbId)
  const { data: leafClusters = [] } = useLeafClusters(lbId, branch.id)

  return (
    <HStack justify="space-between" fontSize="xs" py={1}>
      <Text color="orange.700" lineClamp={1} flex="1">
        {branch.prompt_text?.slice(0, 40) || 'No prompt'}
      </Text>
      <HStack gap={1}>
        <Button
          size="xs"
          colorPalette="orange"
          variant="outline"
          onClick={() => onReattach(branch.id)}
        >
          Reattach
        </Button>
        {leafClusters.length === 0 && (
          <Button
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={() => deleteBranch.mutate(branch.id)}
          >
            Delete
          </Button>
        )}
      </HStack>
    </HStack>
  )
}
