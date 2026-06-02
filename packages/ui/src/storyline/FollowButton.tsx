// components/crossroads/FollowButton.tsx

'use client';

import { Button } from '@chakra-ui/react';
import { IconUserPlus, IconUserCheck } from '@tabler/icons-react';
import { useFollowStatus, useFollowUser, useUnfollowUser } from '@mixtape/api/hooks/useFollow';

interface FollowButtonProps {
  userId: string;
}

export default function FollowButton({ userId }: FollowButtonProps) {
  const { data: status, isLoading } = useFollowStatus(userId);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const isFollowing = status?.is_following ?? false;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <Button size="sm" variant="outline" disabled>
        ...
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant={isFollowing ? 'outline' : 'solid'}
      colorPalette={isFollowing ? 'gray' : 'blue'}
      onClick={handleClick}
      loading={isPending}
    >
      {isFollowing ? (
        <>
          <IconUserCheck size={16} />
          Following
        </>
      ) : (
        <>
          <IconUserPlus size={16} />
          Follow
        </>
      )}
    </Button>
  );
}
