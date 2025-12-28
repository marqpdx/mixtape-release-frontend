# LanternMail Integration Guide

## Architecture Overview

```
Frontend Components
    ↓
useListMonk() Hook (state management)
    ↓
lanternmailApi (API client layer)
    ↓
axiosInstance → Django Backend
    ↓
Django Views → ListMonk API
```

**Key Principle:** Never call ListMonk directly from frontend. All calls proxy through Django for auth, permissions, and business logic.

---

## Quick Start

### 1. Import the Hook

```typescript
import { useListMonk } from "@/hooks/lanternmail/useLanternmail";

function MyComponent() {
  const { createGroupList, getGroupLists, loading } = useListMonk();

  // Use the functions...
}
```

### 2. Or Use API Directly (Advanced)

```typescript
import { lanternmailApi } from "@/lib/lanternmail/lanternmailApi";

// In server components or advanced scenarios
const lists = await lanternmailApi.getGroupLists(groupId);
```

---

## Available Operations

### Lists Management

#### Create a List
```typescript
const { createGroupList } = useListMonk();

const result = await createGroupList(
  groupId,
  groupTitle,
  "Newsletter",
  "Monthly updates",
  { type: 'private', optin: 'double' }
);

// result.message tells you if new or existing
// result.data contains the LanternmailList
```

#### Get Group Lists
```typescript
const { getGroupLists } = useListMonk();

const lists = await getGroupLists(groupId);
// Returns: LanternmailList[]
```

#### Get All User Lists
```typescript
const { getAllGroupLists } = useListMonk();

const allLists = await getAllGroupLists();
// Returns all lists for groups user belongs to
```

#### Get List Details (with stats)
```typescript
const { getListDetails } = useListMonk();

const details = await getListDetails(listId);
// Returns: ListStatsResponse with subscriber_count, campaign_count, etc.
```

---

### Subscribers Management

#### Get List Members
```typescript
const { getGroupMembers } = useListMonk();

const members = await getGroupMembers(groupId, listId);
// Returns: GroupLanternmailMember[]
// Each has subscription_status: 'subscribed' | 'pending' | 'unsubscribed' | 'never_invited'
```

#### Send Invitations
```typescript
const { sendInvitations } = useListMonk();

const result = await sendInvitations(listId, [
  "user1@example.com",
  "user2@example.com"
]);

// result.data.invited_count - how many succeeded
// result.data.emails - successful emails
// result.data.failed - any failures with error messages
```

---

## Type Definitions

All types are in `@/types/lanternmailTypes`:

- `LanternmailList` - Core list data
- `CreateListResponse` - Create result
- `ListStatsResponse` - Detailed stats
- `GroupLanternmailMember` - Member with subscription status
- `GroupSubscriberAggregated` - Aggregated subscriber data
- `SendInvitationsResponse` - Invitation results

---

## Error Handling

The hook automatically catches errors and throws with user-friendly messages:

```typescript
try {
  await createGroupList(...);
} catch (error) {
  // error.message contains user-friendly text
  toast({
    title: "Error",
    description: error.message,
    status: "error"
  });
}
```

---

## Loading State

```typescript
const { createGroupList, loading } = useListMonk();

return (
  <Button
    onClick={handleCreate}
    loading={loading}
  >
    Create List
  </Button>
);
```

---

## Django Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/lantern/groups/{group_id}/mailing-list` | Create list |
| GET | `/api/lantern/groups/{group_id}/mailing-lists` | Get group lists |
| GET | `/api/lantern/mailing-lists` | Get all user lists |
| GET | `/api/lantern/mailing-lists/{list_id}` | Get list details |
| PATCH | `/api/lantern/mailing-lists/{list_id}/toggle` | Toggle active |
| GET | `/api/lantern/groups/{group_id}/mailing-lists/{list_id}/members` | Get list members |
| GET | `/api/lantern/groups/{group_id}/mailing-lists/subscribers` | Get all subscribers |
| POST | `/api/lantern/mailing-lists/{list_id}/invitations` | Send invitations |

---

## Example Component

```typescript
import { useListMonk } from "@/hooks/lanternmail/useLanternmail";
import { useState } from "react";

export function CreateListExample({ group }) {
  const { createGroupList, loading } = useListMonk();
  const [listName, setListName] = useState("");

  const handleCreate = async () => {
    try {
      const result = await createGroupList(
        group.id,
        group.title,
        listName,
        `Mailing list for ${group.title}`
      );

      console.log("Created:", result.data.display_name);
    } catch (error) {
      console.error("Failed:", error.message);
    }
  };

  return (
    <div>
      <input
        value={listName}
        onChange={(e) => setListName(e.target.value)}
      />
      <button onClick={handleCreate} disabled={loading}>
        Create List
      </button>
    </div>
  );
}
```

---

## Testing

### Mock the API Layer
```typescript
import { vi } from 'vitest';
import * as lanternmailApi from '@/lib/lanternmail/lanternmailApi';

vi.spyOn(lanternmailApi.lanternmailApi, 'createGroupList')
  .mockResolvedValue({
    message: "Created",
    data: mockList
  });
```

### Mock the Hook
```typescript
vi.mock('@/hooks/lanternmail/useLanternmail', () => ({
  useListMonk: () => ({
    createGroupList: vi.fn(),
    loading: false,
  })
}));
```

---

## Migration Notes

If you have old code using direct `axiosInstance` calls:

**Before:**
```typescript
const res = await axiosInstance.get(`/api/lantern/groups/${groupId}/mailing-lists`);
const lists = res.data?.data || [];
```

**After:**
```typescript
const { getGroupLists } = useListMonk();
const lists = await getGroupLists(groupId);
```

---

## Future Enhancements

Potential additions to the API layer:

- Campaign management (create, send, schedule)
- Subscriber management (add, remove, update)
- List analytics (open rates, click rates)
- Template management
- Webhook handling

Add new functions to `lanternmailApi.ts` as Django endpoints become available.
