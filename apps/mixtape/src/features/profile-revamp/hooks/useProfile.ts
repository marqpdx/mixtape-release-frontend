'use client';
import { useQuery } from '@tanstack/react-query';
import { fetchMyProfile } from '../api/client';

export function useMyProfile() {
  return useQuery({
    queryKey: ['profile-revamp', 'me'],
    queryFn: fetchMyProfile,
    staleTime: 30_000,
  });
}
