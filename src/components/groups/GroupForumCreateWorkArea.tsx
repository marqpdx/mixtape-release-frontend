import ForumCreate from "@components/threadworks/ForumCreate"

interface GroupForumCreateWorkAreaProps {
  group: any
  onSuccess?: () => void
}

export default function GroupForumCreateWorkArea({ group, onSuccess }: GroupForumCreateWorkAreaProps) {
  return (
    <ForumCreate
      sponsorType="group"
      sponsorId={group.id}
      sponsorName={group.name}
      onSuccess={onSuccess}
    />
  )
}
