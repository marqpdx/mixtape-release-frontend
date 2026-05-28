'use client'

import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  HStack,
  Input,
  Text,
  VStack,
  Badge,
} from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import { useWriting } from '@mixtape/api/hooks/useWriting'
import { useAttachLeafCluster } from '@mixtape/api/hooks/useBranches'

interface AttachLeafClusterDialogProps {
  lbId: string
  branchId: string
  /** Sponsor context needed to fetch the user's writing */
  sponsor: { type: 'group' | 'member'; slug: string }
  onClose: () => void
}

export function AttachLeafClusterDialog({
  lbId,
  branchId,
  sponsor,
  onClose,
}: AttachLeafClusterDialogProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const bg = useColorModeValue('white', 'gray.800')
  const rowBg = useColorModeValue('gray.50', 'gray.750')
  const selectedBg = useColorModeValue('teal.50', 'teal.900')

  const [query, setQuery] = useState('')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'text' | 'voice'>('text')

  const { drafts = [] } = useWriting(sponsor.type, sponsor.slug)
  const attach = useAttachLeafCluster(lbId, branchId)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return drafts.filter((d) =>
      !q || d.piece.title?.toLowerCase().includes(q)
    )
  }, [drafts, query])

  const handleConfirm = () => {
    if (!selectedSlug) return
    attach.mutate(
      { piece_slug: selectedSlug, media_type: mediaType },
      { onSuccess: onClose }
    )
  }

  return (
    <Box
      w="400px"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      bg={bg}
      p={4}
      shadow="md"
    >
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between">
          <Text fontSize="sm" fontWeight="semibold">Attach a piece</Text>
          <Button size="xs" variant="ghost" onClick={onClose}>✕</Button>
        </HStack>

        <Input
          size="sm"
          placeholder="Search your drafts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <Box maxH="240px" overflowY="auto">
          <VStack align="stretch" gap={1}>
            {filtered.length === 0 && (
              <Text fontSize="sm" color="gray.500">No drafts found.</Text>
            )}
            {filtered.map((d) => (
              <Box
                key={d.piece.id}
                bg={selectedSlug === d.piece.slug ? selectedBg : rowBg}
                borderRadius="md"
                px={3}
                py={2}
                cursor="pointer"
                borderWidth="1px"
                borderColor={selectedSlug === d.piece.slug ? 'teal.300' : 'transparent'}
                onClick={() => setSelectedSlug(d.piece.slug)}
              >
                <HStack justify="space-between">
                  <Text fontSize="sm" lineClamp={1}>
                    {d.piece.title || 'Untitled'}
                  </Text>
                  <Badge size="xs" colorPalette="gray" variant="subtle">
                    {d.piece.writing_kind}
                  </Badge>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        <Box>
          <Text fontSize="xs" color="gray.500" mb={1}>Media type</Text>
          <HStack gap={2}>
            {(['text', 'voice'] as const).map((t) => (
              <Button
                key={t}
                size="xs"
                variant={mediaType === t ? 'solid' : 'outline'}
                colorPalette={mediaType === t ? 'teal' : 'gray'}
                onClick={() => setMediaType(t)}
              >
                {t === 'text' ? '📝 Text' : '🎙 Voice'}
              </Button>
            ))}
          </HStack>
        </Box>

        <Button
          size="sm"
          colorPalette="teal"
          disabled={!selectedSlug || attach.isPending}
          onClick={handleConfirm}
        >
          Attach
        </Button>
      </VStack>
    </Box>
  )
}
