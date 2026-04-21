"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Box,
  Container,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useColorModeValue } from "@components/ui/color-mode"
import { axiosInstance } from "@mixtape/api/lib/axiosInstance"

interface MarkerIndexEntry {
  id: string
  raw_name: string
  label: string
  body: string
  char_offset: number
  piece: {
    id: string
    slug: string
    title: string
  }
}

export default function MarkerIndexPage() {
  const params = useParams()
  const username = params?.username as string
  const rawName = params?.rawName as string

  const mutedColor = useColorModeValue("gray.500", "gray.400")
  const cardBg = useColorModeValue("white", "gray.800")
  const cardBorder = useColorModeValue("gray.200", "gray.700")
  const tagBg = useColorModeValue("gray.100", "gray.700")

  const [entries, setEntries] = useState<MarkerIndexEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!rawName) return
    axiosInstance
      .get(`/api/atelier/markers/?raw_name=${encodeURIComponent(rawName)}`)
      .then((res) => setEntries(res.data as MarkerIndexEntry[]))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [rawName])

  // Group by piece
  const byPiece = entries.reduce<Record<string, { piece: MarkerIndexEntry["piece"]; markers: MarkerIndexEntry[] }>>(
    (acc, entry) => {
      const key = entry.piece.id
      if (!acc[key]) acc[key] = { piece: entry.piece, markers: [] }
      acc[key].markers.push(entry)
      return acc
    },
    {}
  )

  return (
    <Container maxW="3xl" py={10}>
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between" align="baseline">
          <Heading size="lg">
            <Box as="span" fontFamily="mono" fontSize="2xl" mr={2}>
              /{rawName}
            </Box>
          </Heading>
          <Link href={`/member/${username}/writing`}>
            <Text fontSize="sm" color="blue.500">← Writing</Text>
          </Link>
        </HStack>

        {loading && (
          <Box py={10} textAlign="center">
            <Spinner />
          </Box>
        )}

        {!loading && entries.length === 0 && (
          <Box py={10} textAlign="center">
            <Text color={mutedColor}>No affirmed /{rawName} markers yet.</Text>
          </Box>
        )}

        {!loading && Object.values(byPiece).map(({ piece, markers }) => (
          <Box
            key={piece.id}
            borderWidth="1px"
            borderColor={cardBorder}
            borderRadius="md"
            bg={cardBg}
            p={5}
          >
            <Text fontWeight="semibold" mb={3}>{piece.title}</Text>
            <VStack align="stretch" gap={3}>
              {markers.map((marker) => (
                <Link
                  key={marker.id}
                  href={`/member/${username}/writing/${piece.slug}#marker-${marker.id}`}
                >
                  <Box
                    borderLeftWidth="3px"
                    borderLeftColor="blue.300"
                    pl={3}
                    py={1}
                    _hover={{ borderLeftColor: "blue.500" }}
                    transition="border-color 0.15s"
                  >
                    <HStack gap={2} mb={marker.body ? 1 : 0}>
                      <Box
                        px={1.5} py={0.5}
                        bg={tagBg}
                        borderRadius="sm"
                        fontSize="xs"
                        fontFamily="mono"
                        color={mutedColor}
                        flexShrink={0}
                      >
                        /{marker.raw_name}
                      </Box>
                      <Text fontSize="sm" fontWeight="medium" color="blue.500">
                        {marker.label}
                      </Text>
                    </HStack>
                    {marker.body && (
                      <Text fontSize="sm" color={mutedColor} pl={6} lineClamp={2}>
                        {marker.body}
                      </Text>
                    )}
                  </Box>
                </Link>
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Container>
  )
}
