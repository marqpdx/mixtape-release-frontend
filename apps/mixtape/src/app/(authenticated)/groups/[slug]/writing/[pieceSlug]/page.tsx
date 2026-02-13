// apps/mixtape/src/app/(authenticated)groups/[slug]/writing/[pieceSlug]/page.tsx

'use client'

import { useParams } from 'next/navigation'
import { WritingPieceDetailView } from '@components/writing/WritingPieceDetailView'

export default function WritingPiecePage() {
  const params = useParams()
  const slug = params.slug as string
  const pieceSlug = params.pieceSlug as string

  return <WritingPieceDetailView groupSlug={slug} pieceSlug={pieceSlug} />
}