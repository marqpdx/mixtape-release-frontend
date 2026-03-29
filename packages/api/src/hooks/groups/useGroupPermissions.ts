// src/hooks/useGroupPermissions.ts

// React hooks for group permissions management

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupPermsApi, MemberPermissions } from "@mixtape/api/clients/group/groupPermsApi";
import { toaster } from "@mixtape/core/lib/toaster";

/**
 * Hook to fetch available permissions for a group
 */
export function useAvailablePermissions(groupSlug: string) {
  return useQuery({
    queryKey: ["permissions", "available", groupSlug],
    queryFn: () => groupPermsApi.getAvailablePermissions(groupSlug),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (permissions don't change often)
  });
}

/**
 * Hook to fetch all member permissions for a group
 */
export function useMemberPermissions(groupSlug: string) {
  return useQuery({
    queryKey: ["permissions", "members", groupSlug],
    queryFn: () => groupPermsApi.getMemberPermissions(groupSlug),
    staleTime: 1000 * 30, // Cache for 30 seconds
  });
}

/**
 * Hook to grant a permission to a member
 */
export function useGrantPermission(groupSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, decorator }: { userId: string; decorator: string }) =>
      groupPermsApi.grantPermission(groupSlug, userId, decorator),
    onSuccess: (updatedMember) => {
      // Update the member permissions list in cache
      queryClient.setQueryData<MemberPermissions[]>(
        ["permissions", "members", groupSlug],
        (old) => {
          if (!old) return [updatedMember];
          return old.map((m) =>
            m.user_id === updatedMember.user_id ? updatedMember : m
          );
        }
      );

      toaster.create({
        title: "Permission granted",
        type: "success",
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to grant permission",
        description: error.response?.data?.error || error.message,
        type: "error",
      });
    },
  });
}

/**
 * Hook to revoke a permission from a member
 */
export function useRevokePermission(groupSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, decorator }: { userId: string; decorator: string }) =>
      groupPermsApi.revokePermission(groupSlug, userId, decorator),
    onSuccess: (updatedMember) => {
      // Update the member permissions list in cache
      queryClient.setQueryData<MemberPermissions[]>(
        ["permissions", "members", groupSlug],
        (old) => {
          if (!old) return [updatedMember];
          return old.map((m) =>
            m.user_id === updatedMember.user_id ? updatedMember : m
          );
        }
      );

      toaster.create({
        title: "Permission revoked",
        type: "success",
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to revoke permission",
        description: error.response?.data?.error || error.message,
        type: "error",
      });
    },
  });
}

/**
 * Hook to grant a role to a member
 */
export function useGrantRole(groupSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      groupPermsApi.grantRole(groupSlug, userId, role),
    onSuccess: (updatedMember) => {
      queryClient.setQueryData<MemberPermissions[]>(
        ["permissions", "members", groupSlug],
        (old) => {
          if (!old) return [updatedMember];
          return old.map((m) =>
            m.user_id === updatedMember.user_id ? updatedMember : m
          );
        }
      );

      toaster.create({
        title: "Role granted",
        type: "success",
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to grant role",
        description: error.response?.data?.error || error.message,
        type: "error",
      });
    },
  });
}

/**
 * Hook to revoke a role from a member
 */
export function useRevokeRole(groupSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      groupPermsApi.revokeRole(groupSlug, userId, role),
    onSuccess: (updatedMember) => {
      queryClient.setQueryData<MemberPermissions[]>(
        ["permissions", "members", groupSlug],
        (old) => {
          if (!old) return [updatedMember];
          return old.map((m) =>
            m.user_id === updatedMember.user_id ? updatedMember : m
          );
        }
      );

      toaster.create({
        title: "Role revoked",
        type: "success",
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to revoke role",
        description: error.response?.data?.error || error.message,
        type: "error",
      });
    },
  });
}

/**
 * Hook to get current user's permissions in a group
 * Used for frontend permission guards
 */
export function useMyPermissions(groupSlug: string) {
  return useQuery({
    queryKey: ["permissions", "my", groupSlug],
    queryFn: () => groupPermsApi.getMyPermissions(groupSlug),
    staleTime: 1000 * 60, // Cache for 1 minute
  });
}

/**
 * Helper hook to check if user has a specific permission
 */
export function useHasPermission(groupSlug: string, permission: string) {
  const { data: myPerms } = useMyPermissions(groupSlug);

  // Admins have all permissions
  if (myPerms?.is_admin) return true;

  // Check if user has the specific decorator
  return myPerms?.decorators?.includes(permission) || false;
}
