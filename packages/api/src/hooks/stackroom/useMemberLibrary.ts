// packages/api/src/hooks/stackroom/useMemberLibrary.ts

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import * as stackroomApi from "@mixtape/api/clients/stackroom/stackroomApi"

// Types inlined here because this package can't import from apps/mixtape.
// These mirror the exported types in LibraryPage.tsx.

type ShelfColor =
  | "green" | "teal" | "blue" | "purple"
  | "orange" | "red" | "yellow" | "gray"

interface LibraryItem {
  id: string
  title: string
  type: "post" | "article" | "dispatch" | "announcement" | "page" | "document"
  thumbnail?: string
  addedAt: string
  url?: string
  excerpt?: string
  tags?: string[]
  popular?: boolean
}

interface LibraryShelf {
  id: string
  title: string
  description: string
  icon: string
  color: ShelfColor
  itemCount: number
  lastUpdated: string
  items: LibraryItem[]
  visibility?: "public" | "members" | "unlisted" | "private"
}

type LibraryPlacement = Awaited<
  ReturnType<typeof stackroomApi.fetchLibraryPlacements>
>[number]

const SHELF_COLORS: ShelfColor[] = [
  "green",
  "teal",
  "blue",
  "purple",
  "orange",
  "red",
  "yellow",
  "gray",
]

const DEFAULT_SHELF_ICON = "📚"

/**
 * Fetch member's library shelves and map to LibraryShelf format.
 *
 * - Owner view: all shelves (including private)
 * - Public view: only public/unlisted shelves
 */
export function useMemberLibrary(
  username: string | undefined,
  userId: string | undefined,
  isOwner = false
) {
  const {
    data: libraries = [],
    isLoading: librariesLoading,
    error: librariesError,
  } = useQuery({
    queryKey: ["libraries", "member", username, isOwner],
    queryFn: () => {
      if (isOwner && userId) {
        return stackroomApi.fetchLibraries({
          scope: "writing",
          sponsor_type: "user",
          sponsor_id: userId,
        })
      }
      return stackroomApi.fetchPublicLibrariesByUsername(username!, "writing")
    },
    enabled: !!username && (isOwner ? !!userId : true),
    staleTime: 5 * 60 * 1000,
  })

  const libraryIds = useMemo(() => libraries.map((lib) => lib.id), [libraries])

  const {
    data: placementsByLibrary = {},
    isLoading: placementsLoading,
    error: placementsError,
  } = useQuery({
    queryKey: ["libraries", "placements", libraryIds],
    queryFn: async () => {
      const entries = await Promise.all(
        libraryIds.map(async (id) => {
          const placements = await stackroomApi.fetchLibraryPlacements(id)
          return [id, placements] as const
        })
      )
      return Object.fromEntries(entries) as Record<string, LibraryPlacement[]>
    },
    enabled: libraryIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const shelves: LibraryShelf[] = useMemo(() => {
    return libraries.map((library, index) => {
      const placements = placementsByLibrary[library.id] || []
      const published = placements.filter((p) => p.published_at)

      const items: LibraryItem[] = published.map((p) => ({
        id: p.id,
        title: p.display?.title || p.piece_title || "Untitled",
        type: (p.writing_kind || "document") as LibraryItem["type"],
        addedAt: p.published_at || p.created_at,
        url: `/member/${username}/writing/${p.piece_slug}`,
        excerpt: p.display?.excerpt || undefined,
      }))

      const lastUpdated = published.reduce<string | null>((latest, p) => {
        const ts = p.published_at || p.created_at
        if (!latest) return ts
        return new Date(ts) > new Date(latest) ? ts : latest
      }, null)

      return {
        id: library.id,
        title: library.title,
        description: library.summary || "",
        icon: DEFAULT_SHELF_ICON,
        color: SHELF_COLORS[index % SHELF_COLORS.length],
        itemCount: items.length,
        lastUpdated: lastUpdated || library.updated_at,
        items,
        visibility: library.visibility,
      }
    })
  }, [libraries, placementsByLibrary, username])

  return {
    shelves,
    isLoading: librariesLoading || (libraryIds.length > 0 && placementsLoading),
    error: librariesError || placementsError || null,
  }
}
