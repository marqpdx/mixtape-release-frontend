// src/components/threadworks/ForumDetail.tsx
// Delegates to the unified ForumFeed (Discussion + FeedPost combined view).

import { Forum } from '@mixtape/core/types/threadworksTypes'
import ForumFeed from './ForumFeed'

interface ForumDetailProps {
  forum: Forum
  groupSlug?: string
  setActiveSection: (section: string, params?: Record<string, string>) => void
  onDiscussionCreated?: () => void
}

export default function ForumDetail({
  forum,
  groupSlug,
  setActiveSection,
}: ForumDetailProps) {
  return (
    <ForumFeed
      forum={forum}
      groupSlug={groupSlug}
      setActiveSection={setActiveSection}
    />
  )
}
