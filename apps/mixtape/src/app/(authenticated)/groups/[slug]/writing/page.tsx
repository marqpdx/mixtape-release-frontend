// apps/mixtape/src/app/(authenticated)/groups/[slug]/writing/page.tsx

'use client'

import { useParams } from 'next/navigation'
import { GroupWritingCatalog } from '@components/writing/GroupWritingCatalog'

export default function GroupWritingCatalogPage() {
  const params = useParams()
  const slug = params.slug as string

  return <GroupWritingCatalog groupSlug={slug} />
}
