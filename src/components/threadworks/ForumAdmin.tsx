// src/components/threadworks/ForumAdmin.tsx

import { useEffect, useState } from "react"
import { axiosInstance } from "@providers/auth-provider/axiosInstance"
import { Forum } from "./interfaces"
import ForumListGrid from "./ForumListGrid"

interface ForumAdminProps {
  groupId?: string | null  // Optional - null/undefined = all forums
  onForumSelect?: (slug: string) => void
}

export default function ForumAdmin({ groupId, onForumSelect }: ForumAdminProps) {
  const [forums, setForums] = useState<Forum[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Build query based on whether we want all forums or group-specific
    const endpoint = groupId
      ? `/api/threadworks?group_id=${groupId}`  // Specific group
      : `/api/threadworks`                      // All forums

    axiosInstance.get(endpoint)
      .then(res => setForums(res.data.results))
      .finally(() => setLoading(false))
  }, [groupId])

  if (loading) return <>Loading forums…</>

  return <ForumListGrid forums={forums} onForumSelect={onForumSelect} />
}