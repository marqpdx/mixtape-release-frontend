// src/components/threadworks/ForumListGrid.tsx

import { SimpleGrid } from "@chakra-ui/react"
import ForumCard from "./ForumCard"
import { Forum } from "./interfaces"
import { useRouter } from "next/navigation"

interface ForumListGridProps {
  forums: Forum[]
    onForumSelect?: (slug: string) => void
}

export default function ForumListGrid({ forums, onForumSelect }: ForumListGridProps) {
  const router = useRouter()
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
      {forums.map((forum) => (
        <ForumCard
          key={forum.id}
          forum={forum}
          onClick={(slug) => onForumSelect ? onForumSelect(slug) : router.push(`/threadworks/${slug}`)}
        />

      ))}
    </SimpleGrid>
  )
}
