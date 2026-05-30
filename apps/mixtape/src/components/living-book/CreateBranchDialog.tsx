'use client'

import { useEffect, useState } from 'react'
import { Box, Button, Text, Textarea } from '@chakra-ui/react'
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@components/ui/dialog'
import { useCreateBranch, useUpdateBranch } from '@mixtape/api/hooks/useBranches'
import type { Branch } from '@mixtape/api/clients/livingBook/branchApi'

interface CreateBranchDialogProps {
  isOpen: boolean
  onClose: () => void
  lbId: string
  onInsertAnchor: (anchorId: string) => void
  onBranchCreated: (branch: Branch) => void
}

type Step = 'choose' | 'prompt'

export function CreateBranchDialog({
  isOpen,
  onClose,
  lbId,
  onInsertAnchor,
  onBranchCreated,
}: CreateBranchDialogProps) {
  const [step, setStep] = useState<Step>('choose')
  const [promptText, setPromptText] = useState('')
  const [createdBranch, setCreatedBranch] = useState<Branch | null>(null)

  const createBranch = useCreateBranch(lbId)
  const updateBranch = useUpdateBranch(lbId, createdBranch?.id ?? '')

  useEffect(() => {
    if (!isOpen) {
      setStep('choose')
      setPromptText('')
      setCreatedBranch(null)
    }
  }, [isOpen])

  const doCreate = (anchorId: string, onSuccess: (branch: Branch) => void) => {
    onInsertAnchor(anchorId)
    createBranch.mutate({ anchor_node_id: anchorId }, { onSuccess })
  }

  const handleBranch = () => {
    const anchorId = crypto.randomUUID()
    doCreate(anchorId, (branch) => {
      onBranchCreated(branch)
      onClose()
    })
  }

  const handleBranchAndPrompt = () => {
    const anchorId = crypto.randomUUID()
    doCreate(anchorId, (branch) => {
      onBranchCreated(branch)
      setCreatedBranch(branch)
      setStep('prompt')
    })
  }

  const handleSavePrompt = () => {
    if (!createdBranch) return
    updateBranch.mutate(
      { prompt_text: promptText.trim() || null, due_date: null },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => { if (!open) onClose() }}
      size="sm"
    >
      <DialogContent>
        <DialogCloseTrigger />

        {step === 'choose' ? (
          <>
            <DialogHeader>Add Branch</DialogHeader>
            <DialogBody>
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                A branch marks a point in your document where collaborators can contribute a response. You can add a writing prompt now, or leave it open.
              </Text>
            </DialogBody>
            <DialogFooter gap={2}>
              <Button
                flex="1"
                size="sm"
                variant="ghost"
                colorPalette="red"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                flex="1"
                size="sm"
                variant="outline"
                colorPalette="teal"
                onClick={handleBranch}
                loading={createBranch.isPending}
              >
                Branch
              </Button>
              <Button
                flex="1"
                size="sm"
                colorPalette="teal"
                onClick={handleBranchAndPrompt}
                loading={createBranch.isPending}
              >
                Branch & Prompt
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>Write a Prompt</DialogHeader>
            <DialogBody>
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} mb={3}>
                Give your collaborators something to respond to. You can edit this later from the Living Book desk.
              </Text>
              <Textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Write a prompt for your collaborators…"
                rows={5}
                fontSize="sm"
                resize="vertical"
                autoFocus
              />
            </DialogBody>
            <DialogFooter>
              <Box flex="1" />
              <Button
                size="sm"
                colorPalette="teal"
                onClick={handleSavePrompt}
                loading={updateBranch.isPending}
                disabled={!promptText.trim()}
              >
                Save Prompt & Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </DialogRoot>
  )
}
