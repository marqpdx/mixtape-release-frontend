"use client"

// LB-6: Promotion UI — "Make this a Living Book" flow

import { useState } from "react"
import {
  Box,
  Button,
  Text,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "@components/ui/dialog"
import { useColorModeValue } from "@components/ui/color-mode"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { promoteLivingBook } from "@mixtape/api/clients/livingBook/livingBookApi"

interface PromotionDialogProps {
  pieceId: string
  pieceTitle: string
  open: boolean
  onClose: () => void
}

export function PromotionDialog({
  pieceId,
  pieceTitle,
  open,
  onClose,
}: PromotionDialogProps) {
  const router = useRouter()
  const [title, setTitle] = useState(pieceTitle)
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)

  const mutedColor = useColorModeValue("gray.500", "gray.400")

  const promote = useMutation({ mutationFn: promoteLivingBook })

  const handleSubmit = () => {
    if (!title.trim()) {
      setError("Title is required.")
      return
    }
    setError(null)
    promote.mutate(
      { piece_id: pieceId, title: title.trim(), description: description.trim() },
      {
        onSuccess: (book) => {
          onClose()
          router.push(`/living-books/${book.id}/`)
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.error ||
            "Could not promote this piece. Make sure it has an active Dispatch."
          setError(msg)
        },
      }
    )
  }

  return (
    <DialogRoot open={open} onOpenChange={({ open: o }) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>Make this a Living Book</DialogHeader>
        <DialogCloseTrigger />
        <DialogBody>
          <VStack gap={4} align="stretch">
            <Text fontSize="sm" color={mutedColor}>
              A Living Book turns this piece into a trunk — other pieces can be
              organised into a navigable tree beneath it.
            </Text>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Book title
              </Text>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Living Book title"
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Description{" "}
                <Text as="span" fontWeight="normal" color={mutedColor}>
                  (optional)
                </Text>
              </Text>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of this Living Book"
                rows={3}
              />
            </Box>

            {error && (
              <Text fontSize="sm" color="red.500">
                {error}
              </Text>
            )}
          </VStack>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorPalette="blue"
            onClick={handleSubmit}
            loading={promote.isPending}
          >
            Create Living Book
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}
