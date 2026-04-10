// src/hooks/useGroupPermissions.ts

// React hooks for group permissions management

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  groupPermsApi,
  GroupPermissionProfile,
  MemberPermissions,
} from "@mixtape/api/clients/group/groupPermsApi";
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

export function usePermissionProfiles(groupSlug: string) {
  return useQuery({
    queryKey: ["permissions", "profiles", groupSlug],
    queryFn: () => groupPermsApi.getPermissionProfiles(groupSlug),
    staleTime: 1000 * 30,
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

export function useGrantHelper(groupSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      groupPermsApi.grantHelper(groupSlug, userId),
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
        title: "Helper granted",
        type: "success",
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to grant helper",
        description: error.response?.data?.error || error.message,
        type: "error",
      });
    },
  });
}

export function useRevokeHelper(groupSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      groupPermsApi.revokeHelper(groupSlug, userId),
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
        title: "Helper revoked",
        type: "success",
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to revoke helper",
        description: error.response?.data?.error || error.message,
        type: "error",
      });
    },
  });
}

export function useAssignPermissionProfile(groupSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, profileId }: { userId: string; profileId: string | null }) =>
      groupPermsApi.assignPermissionProfile(groupSlug, userId, profileId),
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

      queryClient.invalidateQueries({
        queryKey: ["permissions", "profiles", groupSlug],
      });

      toaster.create({
        title: "Permission profile updated",
        type: "success",
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to update permission profile",
        description: error.response?.data?.error || error.message,
        type: "error",
      });
    },
  });
}

export function useCreatePermissionProfile(groupSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; description?: string; decorators?: string[] }) =>
      groupPermsApi.createPermissionProfile(groupSlug, payload),
    onSuccess: (createdProfile) => {
      queryClient.setQueryData<GroupPermissionProfile[]>(
        ["permissions", "profiles", groupSlug],
        (old) => (old ? [...old, createdProfile] : [createdProfile])
      );

      toaster.create({
        title: "Permission profile created",
        type: "success",
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to create permission profile",
        description: error.response?.data?.error || error.message,
        type: "error",
      });
    },
  });
}

export function useUpdatePermissionProfile(groupSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profileId,
      payload,
    }: {
      profileId: string;
      payload: { name: string; description?: string; decorators?: string[] };
    }) => groupPermsApi.updatePermissionProfile(groupSlug, profileId, payload),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData<GroupPermissionProfile[]>(
        ["permissions", "profiles", groupSlug],
        (old) => {
          if (!old) return [updatedProfile];
          return old.map((profile) =>
            profile.id === updatedProfile.id ? updatedProfile : profile
          );
        }
      );

      queryClient.invalidateQueries({
        queryKey: ["permissions", "members", groupSlug],
      });

      toaster.create({
        title: "Permission profile updated",
        type: "success",
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to update permission profile",
        description: error.response?.data?.error || error.message,
        type: "error",
      });
    },
  });
}

export function useClonePermissionProfile(groupSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId }: { profileId: string }) =>
      groupPermsApi.clonePermissionProfile(groupSlug, profileId),
    onSuccess: (createdProfile) => {
      queryClient.setQueryData<GroupPermissionProfile[]>(
        ["permissions", "profiles", groupSlug],
        (old) => (old ? [...old, createdProfile] : [createdProfile])
      );

      toaster.create({
        title: "Permission profile cloned",
        type: "success",
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to clone permission profile",
        description: error.response?.data?.error || error.message,
        type: "error",
      });
    },
  });
}

export function useSetDefaultPermissionProfile(groupSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId }: { profileId: string }) =>
      groupPermsApi.setDefaultPermissionProfile(groupSlug, profileId),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData<GroupPermissionProfile[]>(
        ["permissions", "profiles", groupSlug],
        (old) => {
          if (!old) return [updatedProfile];
          return old.map((profile) => ({
            ...profile,
            is_default: profile.id === updatedProfile.id,
          }));
        }
      );

      toaster.create({
        title: "Default permission profile updated",
        type: "success",
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to update default permission profile",
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
    enabled: !!groupSlug,
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
