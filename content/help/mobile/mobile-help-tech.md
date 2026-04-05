---
title: Mixtape Mobile — Technical Reference
subsystem: mobile
area: overview-tech
excerpt: Technical reference for Mixtape Mobile. Covers architecture, integration points, and development patterns for the mobile application.
routes:
  - /mobile
  - /mobile/*
workAreas: []
tags:
  - mobile
  - technical
---

# Mixtape Mobile — Technical Reference

---

## Stack

| Layer | Technology |
|-------|-----------|
| App framework | React Native + Expo Dev Client |
| Build pipeline | EAS Build |
| State management | Zustand |
| Data fetching | React Query (`@tanstack/react-query`) |
| Real-time | socket.io via shared `@mixtape/api/lib/socket` |
| Push notifications | `expo-notifications` + Expo push token API |
| Local storage | AsyncStorage (drafts, last-used identifier) |
| Feedback | MobileBeacon → `POST /api/feedback/` |

---

## Build lanes

Configured in `apps/mobile/eas.json`:

| Profile | Use | Distribution |
|---------|-----|-------------|
| `development` | Daily dev on device | `internal` |
| `development-simulator` | Simulator testing | `simulator` |
| `preview` | QA on device | `internal` |
| `production` | App store release | `store` |

**Known issue:** All four profiles currently have `EXPO_PUBLIC_APP_ENV: "production"` — dev and preview builds target the production API. Separate staging API URLs are needed for safe pre-release testing.

---

## Environment variables

| Variable | Maps to (shared package) | Purpose |
|----------|--------------------------|---------|
| `EXPO_PUBLIC_API_URL` | `NEXT_PUBLIC_ROOT_API_URL` | Django REST API base URL |
| `EXPO_PUBLIC_LIVEWIRE_URL` | `NEXT_PUBLIC_LIVEWIRE_URL` | socket.io server URL |
| `EXPO_PUBLIC_PUSH_TOKEN_REGISTRATION_PATH` | `NEXT_PUBLIC_PUSH_TOKEN_REGISTRATION_PATH` | Push token registration path |
| `EXPO_PUBLIC_ENABLE_PUSH_REGISTRATION` | `NEXT_PUBLIC_ENABLE_PUSH_REGISTRATION` | Feature flag: enable push token sync |
| `EXPO_PUBLIC_APP_ENV` | `NEXT_PUBLIC_APP_ENV` | Environment label (`development` / `production`) |

Mapping is performed in `src/config/env.ts` at app startup. The shared `@mixtape/api` packages read `NEXT_PUBLIC_*` variables.

---

## Authentication

Login calls `POST /api/auth/login/` via `@mixtape/api/clients/auth/api::login()`.

Auth state is stored in a Zustand store (`authStore.ts`) — **in-memory only**. There is no token persistence; users must log in on every cold start. The last-used identifier (email/username) is saved to AsyncStorage (`mixtape.mobile.lastIdentifier`) and pre-filled on the login screen.

---

## Push notification integration

### Registration endpoint

```
POST /api/push/register/
Authorization: Bearer <user JWT>
Content-Type: application/json

{
  "token": "<ExponentPushToken[...]>",
  "platform": "ios",           // or "android"
  "environment": "production"  // or "development"
}
```

Response:
```json
{ "status": "registered", "platform": "ios", "environment": "production" }
```

Or `"status": "updated"` if the token already existed. Idempotent — safe to call on every app launch.

The `useNotifications.ts` hook handles the full lifecycle:
1. On `isAuthenticated`, calls `notificationService.registerForPushNotificationsAsync()`
2. On permission granted and token received, calls `registerPushToken` from `pushApi.ts`
3. Deduplicates via `lastSyncedToken` in `notificationStore` (won't re-call backend if token unchanged)

### Push payload shape

```json
{
  "to": "<expo_push_token>",
  "title": "<conversation title or 'New message'>",
  "body": "<message text, truncated to 140 chars>",
  "data": {
    "conversationId": "<conversation-slug>",
    "title": "<conversation title>"
  },
  "channelId": "messages",
  "sound": "default"
}
```

### Android notification channel

Created in `notificationService.ts` with id `"messages"` at `IMPORTANCE_MAX`. This matches the `defaultChannel: "messages"` in `app.json` and `channelId: "messages"` in the push payload.

### Foreground suppression

`useUnreadCounts.ts` suppresses badge increments and local notifications when `chatStore.activeConversationId === incomingConversationSlug`. This prevents double-notification when the socket also delivers the message.

### Backend observability

Log events emitted by the Django push pipeline:

| Event | Meaning |
|-------|---------|
| `push_token_registered` | New token stored |
| `push_token_updated` | Existing token refreshed |
| `push_sent` | Expo push API call succeeded |
| `push_delivery_issue` | Non-fatal delivery problem |
| `push_token_stale` | `DeviceNotRegistered` received; token deactivated |
| `push_dispatch_failed` | Expo API call failed (will retry via Celery) |

---

## Socket infrastructure

`socketService.ts` wraps the shared `@mixtape/api/lib/socket` singleton. Key behaviors:

- Reconnects on `AppState` foreground transition
- `NetInfo` reconnect on network recovery is **commented out** pending native module rebuild
- Auth token from `@mixtape/auth/wsToken` is passed on connect

`messagingService.ts` wraps socket emit/on for the message protocol:

| Event emitted | Purpose |
|--------------|---------|
| `join_conversation` | Join a conversation room |
| `leave_conversation` | Leave a conversation room |
| `send_message` | Send a message |
| `start_typing` / `stop_typing` | Typing indicators |

| Event received | Purpose |
|---------------|---------|
| `receive_message` | Incoming message |
| `user_typing` | Typing indicator from another user |

---

## Manual test-send (push)

To trigger a test push from the Django shell without waiting for a real message:

```python
from users.models import PushToken
from activity.tasks import dispatch_push_notification_task

# Find an active token
token = PushToken.objects.filter(user__username="your-username", is_active=True).first()
print(token.token)

# Call Expo API directly
import requests
requests.post(
    "https://exp.host/--/api/v2/push/send",
    json=[{
        "to": token.token,
        "title": "Test notification",
        "body": "If you see this, push is working.",
        "data": {"conversationId": "test", "title": "Test"},
        "channelId": "messages",
        "sound": "default",
    }]
).json()
```

---

## Chat API

Used by the mobile app via `@mixtape/api/clients/chat/chatApi`:

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/chat/conversations/` | List user's conversations |
| POST | `/api/chat/conversations/` | Create conversation. Body: `{ participants: [username, ...], title? }` |
| GET | `/api/chat/conversations/{slug}/messages/` | Fetch message history. Query: `limit`, `offset` |

---

## Known gotchas

- **All EAS build profiles target production API**: Until `EXPO_PUBLIC_API_URL` is set per-profile in `eas.json`, every build (including development and preview) talks to the production Django server. Be careful running automated tests or seeding data.
- **Group context not wired in `createConversation`**: `NewGroupChatScreen.tsx` creates a conversation without passing the group slug to the API (TODO in code). Group conversations currently behave like personal ones at the API layer.
- **Double setTimeout after send**: `ConversationThreadPanel.tsx` fires a 500ms and 1800ms delayed refresh after sending a message. This is a timing workaround and may miss messages on slow connections.
- **Auth not persisted**: Zustand auth store is in-memory only. Any cold restart requires re-login. No token refresh flow exists.
