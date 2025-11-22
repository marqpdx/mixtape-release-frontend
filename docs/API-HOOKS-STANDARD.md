# Frontend API & Hooks Standard

**Reference Implementation:**
- `src/lib/group/groupApi.ts` - Pure fetch API layer
- `src/hooks/useGroups.ts` - React Query hooks layer

## Architecture Principle: Hybrid Two-Layer Pattern

```
┌─────────────────────────────────────────┐
│  Components                             │
│  └─ Call hooks (useGroups, useGroup)   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Hooks Layer (src/hooks/)               │
│  └─ React Query wrappers                │
│  └─ Cache management                    │
│  └─ Optimistic updates                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  API Layer (src/lib/[resource]/)        │
│  └─ Pure fetch functions                │
│  └─ No React dependencies               │
│  └─ Auth token injection                │
└─────────────────────────────────────────┘
                  ↓
         Backend API (/api/*)
```

**Why this pattern?**
- **Separation**: API calls work independently of React Query
- **Testability**: Pure functions are easier to test
- **Swappable**: Can replace React Query later without touching API layer
- **Reusable**: API functions can be called from anywhere (hooks, utilities, middleware)

---

## Part 1: API Layer (`src/lib/[resource]/[resource]Api.ts`)

### File Structure Template

```typescript
// src/lib/[resource]/[resource]Api.ts

import { [Types] } from '@/types/[resource]Types';
import { getAccessToken } from '@/lib/auth/tokenStorage';

const API_BASE = process.env.NEXT_PUBLIC_ROOT_API_URL;

// ============================================================================
// HELPER FUNCTIONS (private)
// ============================================================================

/**
 * Get headers with auth token
 */
function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Handle API response and errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API request failed: ${response.status}`;

    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.detail || errorData.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// ============================================================================
// OPTIONS INTERFACES
// ============================================================================

export interface Fetch[Resource]Options {
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
  // ... resource-specific filters
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch all [resources]
 */
export async function fetch[Resources](
  options: Fetch[Resource]Options = {}
): Promise<[Resource][]> {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  const url = `${API_BASE}/api/[resources]${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include', // Critical: sends cookies
  });

  const data: [Resource]ListResponse = await handleResponse(response);
  return data.results || data as unknown as [Resource][];
}

/**
 * Fetch a single [resource] by ID/slug
 */
export async function fetch[Resource](id: string): Promise<[Resource]> {
  const url = `${API_BASE}/api/[resources]/${id}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  return handleResponse<[Resource]>(response);
}

/**
 * Create a new [resource]
 */
export async function create[Resource](
  data: [Resource]CreateData
): Promise<[Resource]> {
  const url = `${API_BASE}/api/[resources]`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<[Resource]>(response);
}

/**
 * Update a [resource]
 */
export async function update[Resource](
  id: string,
  updates: Partial<[Resource]>
): Promise<[Resource]> {
  const url = `${API_BASE}/api/[resources]/${id}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  return handleResponse<[Resource]>(response);
}

/**
 * Delete a [resource]
 */
export async function delete[Resource](id: string): Promise<void> {
  const url = `${API_BASE}/api/[resources]/${id}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete [resource]: ${response.status}`);
  }
}

// ============================================================================
// EXPORT API OBJECT (alternative pattern)
// ============================================================================

export const [resource]Api = {
  fetch[Resources],
  fetch[Resource],
  create[Resource],
  update[Resource],
  delete[Resource],
};
```

### Checklist for API Files

- [ ] Uses `getAuthHeaders()` for token injection
- [ ] Uses `handleResponse()` for consistent error handling
- [ ] All fetch calls include `credentials: 'include'`
- [ ] Options interfaces exported for reuse in hooks
- [ ] JSDoc comments on public functions
- [ ] Grouped by logical sections with comment dividers
- [ ] Both named exports AND object export
- [ ] No React dependencies (pure functions only)

---

## Part 2: Hooks Layer (`src/hooks/use[Resources].ts`)

### File Structure Template

```typescript
// src/hooks/use[Resources].ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import {
  fetch[Resources] as apiFetch[Resources],
  fetch[Resource] as apiFetch[Resource],
  create[Resource] as apiCreate[Resource],
  update[Resource] as apiUpdate[Resource],
  delete[Resource] as apiDelete[Resource],
  Fetch[Resource]Options as ApiFetch[Resource]Options,
} from '@/lib/[resource]/[resource]Api';
import { [Resource] } from '@/types/[resource]Types';

// ============================================================================
// RE-EXPORT API TYPES
// ============================================================================

export type Fetch[Resource]Options = ApiFetch[Resource]Options;

// ============================================================================
// QUERY KEY FACTORY (for cache consistency)
// ============================================================================

export const [resource]QueryKeys = {
  all: ['[resources]'] as const,
  lists: () => [[resource]QueryKeys.all, 'list'] as const,
  list: (options: Fetch[Resource]Options) =>
    [[resource]QueryKeys.lists(), options] as const,
  details: () => [[resource]QueryKeys.all, 'detail'] as const,
  detail: (id: string) => [[resource]QueryKeys.details(), id] as const,
};

// ============================================================================
// HOOK RETURN TYPE INTERFACES
// ============================================================================

export interface Use[Resources]Result {
  [resources]: [Resource][];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface Use[Resource]Result {
  [resource]: [Resource] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ============================================================================
// INTERNAL FETCH FUNCTIONS (delegate to API layer)
// ============================================================================

/**
 * Fetch all [resources]
 * Delegates to API layer
 */
const fetch[Resources] = async (
  options: Fetch[Resource]Options = {}
): Promise<[Resource][]> => {
  return apiFetch[Resources](options);
};

/**
 * Fetch single [resource]
 * Delegates to API layer
 */
const fetch[Resource] = async (id: string): Promise<[Resource]> => {
  return apiFetch[Resource](id);
};

// ============================================================================
// PUBLIC HOOKS
// ============================================================================

/**
 * Hook to fetch all [resources]
 */
export const use[Resources] = (
  options: Fetch[Resource]Options = {}
): Use[Resources]Result => {
  const {
    data: [resources] = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [resource]QueryKeys.list(options),
    queryFn: () => fetch[Resources](options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  return {
    [resources],
    isLoading,
    error: error as Error | null,
    refetch
  };
};

/**
 * Hook to fetch a single [resource]
 */
export const use[Resource] = (id: string | null): Use[Resource]Result => {
  const {
    data: [resource] = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [resource]QueryKeys.detail(id || ''),
    queryFn: () => fetch[Resource](id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    [resource],
    isLoading,
    error: error as Error | null,
    refetch
  };
};

/**
 * Hook for mutations (create, update, delete)
 * Provides optimistic updates and automatic cache invalidation
 */
export const use[Resource]Mutations = (id: string) => {
  const queryClient = useQueryClient();

  // Update mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<[Resource]>) => apiUpdate[Resource](id, updates),

    // Optimistic update
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [resource]QueryKeys.detail(id)
      });

      // Snapshot previous value
      const previous = queryClient.getQueryData<[Resource]>(
        [resource]QueryKeys.detail(id)
      );

      // Optimistically update cache
      if (previous) {
        queryClient.setQueryData<[Resource]>(
          [resource]QueryKeys.detail(id),
          { ...previous, ...updates }
        );
      }

      return { previous };
    },

    // On error, rollback
    onError: (err, updates, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [resource]QueryKeys.detail(id),
          context.previous
        );
      }
      console.error('Update failed:', err);
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [resource]QueryKeys.detail(id)
      });
      queryClient.invalidateQueries({
        queryKey: [resource]QueryKeys.lists()
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => apiDelete[Resource](id),

    onSuccess: () => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: [resource]QueryKeys.detail(id)
      });
      queryClient.invalidateQueries({
        queryKey: [resource]QueryKeys.lists()
      });
    },
  });

  return {
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isUpdating: updateMutation.status === 'pending',
    isDeleting: deleteMutation.status === 'pending',
    updateError: updateMutation.error as Error | null,
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Utility hook to invalidate queries
 */
export const useInvalidate[Resources] = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: [resource]QueryKeys.all }),
    invalidate[Resource]: (id: string) =>
      queryClient.invalidateQueries({ queryKey: [resource]QueryKeys.detail(id) }),
  };
};
```

### Checklist for Hooks Files

- [ ] Query key factory exported for cache consistency
- [ ] Re-exports types from API layer
- [ ] Internal functions delegate to API layer
- [ ] Hook return types defined as interfaces
- [ ] Optimistic updates in mutations
- [ ] Cache invalidation after mutations
- [ ] Appropriate staleTime values
- [ ] `enabled` flag for conditional queries
- [ ] Error handling and rollback on mutation failure
- [ ] Utility hooks for cache invalidation
- [ ] Business logic helpers if needed (e.g., filtered lists)

---

## Key Patterns & Best Practices

### 1. **Authentication**
```typescript
// ✅ ALWAYS use getAuthHeaders()
headers: getAuthHeaders()

// ✅ ALWAYS include credentials
credentials: 'include'
```

### 2. **Error Handling**
```typescript
// ✅ Consistent error handling in API layer
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Parse error, throw Error object
  }
  return response.json();
}

// ✅ Type errors in hooks
error: error as Error | null
```

### 3. **Query Keys**
```typescript
// ✅ Hierarchical keys for easy invalidation
export const resourceQueryKeys = {
  all: ['resources'] as const,          // ['resources']
  lists: () => [..., 'list'] as const,  // ['resources', 'list']
  list: (opts) => [..., opts],          // ['resources', 'list', {opts}]
  detail: (id) => [..., id],            // ['resources', 'detail', '123']
};
```

### 4. **Cache Invalidation**
```typescript
// ✅ Invalidate related queries after mutations
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: resourceQueryKeys.detail(id) });
  queryClient.invalidateQueries({ queryKey: resourceQueryKeys.lists() });
}
```

### 5. **TypeScript**
```typescript
// ✅ Export option interfaces from API layer
export interface FetchResourceOptions { ... }

// ✅ Re-export in hooks for convenience
export type FetchResourceOptions = ApiFetchResourceOptions;

// ✅ Type hook return values
export interface UseResourceResult {
  resource: Resource | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

---

## Migration Checklist

When migrating from axiosInstance to this pattern:

1. [ ] Create `src/lib/[resource]/[resource]Api.ts` with pure fetch functions
2. [ ] Create `src/hooks/use[Resources].ts` with React Query wrappers
3. [ ] Update components to use hooks instead of axiosInstance
4. [ ] Remove axiosInstance imports from migrated files
5. [ ] Test all CRUD operations
6. [ ] Verify auth tokens are being sent
7. [ ] Verify cookies are being sent (`credentials: 'include'`)

---

## Common Pitfalls to Avoid

❌ **DON'T put React Query in API layer**
```typescript
// BAD: API layer should not import React Query
import { useQuery } from '@tanstack/react-query';
export function fetchGroups() { ... }
```

❌ **DON'T skip credentials: 'include'**
```typescript
// BAD: Refresh token cookie won't be sent
fetch(url, { headers: getAuthHeaders() })

// GOOD:
fetch(url, {
  headers: getAuthHeaders(),
  credentials: 'include' // ✅
})
```

❌ **DON'T forget to invalidate cache**
```typescript
// BAD: List won't update after creating new item
onSuccess: () => {
  // Nothing - cache stale!
}

// GOOD:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: resourceQueryKeys.lists() });
}
```

❌ **DON'T use hardcoded query keys**
```typescript
// BAD: Inconsistent keys, hard to maintain
queryKey: ['groups', 'list']
queryKey: ['group', 'list'] // Typo!

// GOOD: Use factory
queryKey: groupsQueryKeys.list()
```

---

## Reference Examples

For complete, production-ready examples:
- **API Layer**: `src/lib/group/groupApi.ts`
- **Hooks Layer**: `src/hooks/useGroups.ts`
- **Auth Pattern**: `src/lib/auth/api.ts`

---

**Document Version:** 1.0
**Last Updated:** Phase 2 Groups Implementation
**Maintained By:** Emily (CTO Principle: Patterns & Reusability)
