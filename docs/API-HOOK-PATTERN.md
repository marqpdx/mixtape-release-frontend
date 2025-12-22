# API and Hook Architecture Pattern

## Overview

This document describes the site-wide pattern for separating API logic from React hooks in the Mixtape frontend application.

## Core Principles

### 1. Separation of Concerns

**API Layer** (`src/lib/**/api.ts` or `src/lib/**/*Api.ts`)
- Pure async functions
- Uses `axiosInstance` exclusively
- Zero React dependencies
- Handles HTTP requests/responses
- Error handling via try/catch and error interceptors
- TypeScript interfaces for request/response types

**Hook Layer** (`src/hooks/**/use*.ts`)
- React hooks (useState, useEffect, useCallback, etc.)
- React Query hooks (useQuery, useMutation)
- Business logic and state management
- Direct API calls (no wrapper functions)
- UI-specific error handling and loading states

### 2. No Wrapper Functions

❌ **Anti-pattern:**
```typescript
// src/hooks/useGroups.ts
import { fetchGroups as apiFetchGroups } from '@/lib/group/groupApi';

const fetchGroups = async (options = {}) => {
  return apiFetchGroups(options); // Unnecessary wrapper
};

export const useGroups = (options = {}) => {
  const { data } = useQuery({
    queryFn: () => fetchGroups(options),
  });
};
```

✅ **Correct pattern:**
```typescript
// src/hooks/useGroups.ts
import * as groupApi from '@/lib/group/groupApi';

export const useGroups = (options = {}) => {
  const { data } = useQuery({
    queryFn: () => groupApi.fetchGroups(options), // Direct call
  });
};
```

### 3. Namespace Imports

Always use namespace imports for API modules to keep code clean and maintain clear boundaries:

```typescript
import * as groupApi from '@/lib/group/groupApi';
import * as almanacApi from '@/lib/almanac/almanacApi';
import * as writingApi from '@/lib/writing/api';

// Usage:
groupApi.fetchGroups()
almanacApi.fetchGroupEvents(groupSlug)
writingApi.fetchDrafts(sponsorType, sponsorSlug)
```

## File Structure

```
src/
├── lib/                          # API Layer
│   ├── group/
│   │   └── groupApi.ts           # Group API functions
│   ├── almanac/
│   │   └── almanacApi.ts         # Event/calendar API functions
│   ├── writing/
│   │   └── api.ts                # Writing/publishing API functions
│   └── api/
│       └── utils.ts              # Shared API utilities
│
└── hooks/                        # Hook Layer
    ├── groups/
    │   └── useGroups.ts          # Group hooks
    ├── almanac/
    │   ├── useGroupEvents.ts     # Event management hooks
    │   ├── useEventRSVP.ts       # RSVP mutation hooks
    │   └── useEventAttendees.ts  # Attendee query hooks
    └── useWriting.ts             # Writing hooks
```

## Implementation Guidelines

### Creating an API Function

```typescript
// src/lib/domain/domainApi.ts

import { axiosInstance } from '@providers/auth-provider/axiosInstance';
import { unwrapListResponse } from '@/lib/api/utils';

export interface DomainObject {
  id: string;
  name: string;
  // ... other fields
}

export interface CreateDomainPayload {
  name: string;
  // ... other fields
}

/**
 * Fetch all domain objects
 */
export async function fetchDomainObjects(
  params?: { filter?: string }
): Promise<DomainObject[]> {
  const response = await axiosInstance.get('/api/domain/objects', { params });
  return unwrapListResponse<DomainObject>(response.data);
}

/**
 * Fetch single domain object
 */
export async function fetchDomainObject(id: string): Promise<DomainObject> {
  const response = await axiosInstance.get(`/api/domain/objects/${id}`);
  return response.data;
}

/**
 * Create domain object
 */
export async function createDomainObject(
  payload: CreateDomainPayload
): Promise<DomainObject> {
  const response = await axiosInstance.post('/api/domain/objects', payload);
  return response.data;
}

/**
 * Update domain object
 */
export async function updateDomainObject(
  id: string,
  payload: Partial<CreateDomainPayload>
): Promise<DomainObject> {
  const response = await axiosInstance.put(`/api/domain/objects/${id}`, payload);
  return response.data;
}

/**
 * Delete domain object
 */
export async function deleteDomainObject(id: string): Promise<void> {
  await axiosInstance.delete(`/api/domain/objects/${id}`);
}
```

### Creating a Hook

```typescript
// src/hooks/domain/useDomainObjects.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as domainApi from '@/lib/domain/domainApi';
import { toaster } from '@/components/ui/toaster';

export function useDomainObjects(filter?: string) {
  return useQuery({
    queryKey: ['domainObjects', filter],
    queryFn: () => domainApi.fetchDomainObjects({ filter }),
  });
}

export function useDomainObject(id: string) {
  return useQuery({
    queryKey: ['domainObject', id],
    queryFn: () => domainApi.fetchDomainObject(id),
    enabled: !!id,
  });
}

export function useCreateDomainObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: domainApi.createDomainObject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domainObjects'] });
      toaster.create({
        title: 'Success',
        description: 'Domain object created',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      toaster.create({
        title: 'Error',
        description: error.message,
        type: 'error',
      });
    },
  });
}

export function useDeleteDomainObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: domainApi.deleteDomainObject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domainObjects'] });
      toaster.create({
        title: 'Success',
        description: 'Domain object deleted',
        type: 'success',
      });
    },
  });
}
```

## Common Patterns

### Group-Scoped Operations

When operations are scoped to a group, pass `groupSlug` as the first parameter:

```typescript
// API Layer
export async function fetchGroupEvents(
  groupSlug: string,
  params?: EventParams
): Promise<EventResponse[]> {
  const response = await axiosInstance.get(
    `/api/groups/${groupSlug}/events`,
    { params }
  );
  return unwrapListResponse<EventResponse>(response.data);
}

// Hook Layer
export function useGroupEvents(groupSlug: string) {
  return useQuery({
    queryKey: ['events', groupSlug],
    queryFn: () => almanacApi.fetchGroupEvents(groupSlug),
  });
}
```

### Handling Paginated Responses

Django REST Framework returns paginated responses. Use `unwrapListResponse`:

```typescript
import { unwrapListResponse } from '@/lib/api/utils';

export async function fetchItems(): Promise<Item[]> {
  const response = await axiosInstance.get('/api/items');
  return unwrapListResponse<Item>(response.data);
}
```

The utility handles both formats:
- `{ results: [...], count: 10, next: '...', previous: '...' }` → extracts `results`
- `[...]` → returns array as-is
- Everything else → returns empty array

### Error Handling

Errors are handled at two levels:

**API Layer**: Let axios interceptors handle error extraction
```typescript
// No try/catch needed - axiosInstance interceptors handle it
export async function fetchData(): Promise<Data> {
  const response = await axiosInstance.get('/api/data');
  return response.data;
}
```

**Hook Layer**: Handle UI concerns
```typescript
export function useData() {
  return useQuery({
    queryKey: ['data'],
    queryFn: () => domainApi.fetchData(),
    // React Query automatically handles error state
  });
}

// For mutations, show user feedback
export function useCreateData() {
  return useMutation({
    mutationFn: domainApi.createData,
    onError: (error: Error) => {
      toaster.create({
        title: 'Error',
        description: error.message,
        type: 'error',
      });
    },
  });
}
```

### React Query Integration

**Queries** (GET operations):
```typescript
export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => itemApi.fetchItems(),
  });
}
```

**Mutations** (POST/PUT/DELETE operations):
```typescript
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: itemApi.createItem,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
```

**Optimistic Updates**:
```typescript
export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => itemApi.updateItem(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['item', id] });
      const previous = queryClient.getQueryData(['item', id]);

      queryClient.setQueryData(['item', id], (old) => ({
        ...old,
        ...data,
      }));

      return { previous };
    },

    // Rollback on error
    onError: (err, { id }, context) => {
      queryClient.setQueryData(['item', id], context.previous);
    },

    // Always refetch
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['item', id] });
    },
  });
}
```

## Migration Checklist

When refactoring existing code to follow this pattern:

### 1. Create/Update API File

- [ ] Create `src/lib/domain/domainApi.ts` if it doesn't exist
- [ ] Add TypeScript interfaces for request/response types
- [ ] Implement API functions using `axiosInstance`
- [ ] Use `unwrapListResponse` for list endpoints
- [ ] Add JSDoc comments for clarity

### 2. Update Hook File

- [ ] Change import to namespace: `import * as domainApi from '@/lib/domain/domainApi'`
- [ ] Replace inline `axiosInstance` calls with API function calls
- [ ] Remove any wrapper functions that just delegate to API
- [ ] Update useCallback dependencies (e.g., `[baseUrl]` → `[domainSlug]`)
- [ ] Ensure React Query hooks invalidate correct query keys

### 3. Verify

- [ ] TypeScript compiles without errors
- [ ] All API calls use namespace imports
- [ ] No direct `axiosInstance` imports in hook files
- [ ] React Query cache invalidation works correctly
- [ ] Error handling provides good user feedback

## Reference Examples

### Completed Refactorings

1. **Groups**: `useGroups.ts` + `groupApi.ts`
   - Removed 6 wrapper functions
   - Namespace imports throughout
   - Clean separation of concerns

2. **Writing**: `useWriting.ts` + `writing/api.ts`
   - Moved 4 inline calls to API layer
   - Added `fetchPlacements`, `fetchDrafts`, `fetchPiece`, `deleteDraft`

3. **Events**: `useGroupEvents.ts` + `almanacApi.ts`
   - Moved 7 inline calls to API layer
   - Group-scoped operations pattern
   - Changed dependencies from `[baseUrl]` to `[groupSlug]`

4. **RSVP**: `useEventRSVP.ts` + `almanacApi.ts`
   - React Query mutations with optimistic updates
   - Cache invalidation on success
   - Rollback on error

## Benefits

1. **Testability**: API functions can be tested independently of React
2. **Reusability**: API functions can be used in hooks, components, or utilities
3. **Consistency**: All HTTP calls follow the same pattern
4. **Maintainability**: Changes to API structure only affect API layer
5. **Type Safety**: Clear TypeScript interfaces at API boundaries
6. **Debugging**: Clear separation makes it easier to trace issues
7. **Performance**: React Query handles caching, deduplication, background refetch

## Anti-Patterns to Avoid

### ❌ Wrapper Functions
```typescript
const fetchData = async () => {
  return apiModule.fetchData(); // Just delegates - remove this
};
```

### ❌ Direct axios in Hooks
```typescript
// In hook file
const response = await axiosInstance.get('/api/data'); // Move to API layer
```

### ❌ Named Imports for API
```typescript
import { fetchGroups, createGroup } from '@/lib/group/groupApi'; // Use namespace
```

### ❌ Mixed Responsibilities
```typescript
// API function that manages React state
export async function fetchAndSetGroups(setter) {
  const data = await axiosInstance.get('/api/groups');
  setter(data); // API shouldn't know about React
}
```

## Questions?

If you're unsure about where code should live:

- **Does it make HTTP requests?** → API Layer
- **Does it use React hooks?** → Hook Layer
- **Is it a pure utility function?** → `src/lib/api/utils.ts`
- **Does it manage UI state?** → Hook Layer
- **Does it transform data for display?** → Hook Layer or Component

When in doubt, follow the examples in `useGroups.ts` + `groupApi.ts`.
