# Mobile Socket Infrastructure - Using Shared Libraries

## Overview

The mobile app now uses the shared socket infrastructure from the monorepo instead of duplicate implementations. This ensures consistent behavior between web and mobile apps.

## What Changed

### 1. Socket Service (`src/services/socket/socketService.ts`)

**Before:**
- Created its own Socket.io connection
- Managed its own authentication
- Custom event handling

**After:**
- Wraps `@mixtape/api/lib/socket` (shared infrastructure)
- Uses `@mixtape/auth/wsToken` for automatic authentication
- Adds mobile-specific features:
  - **AppState monitoring** - Reconnects when app comes to foreground
  - **NetInfo monitoring** - Reconnects when network is restored
  - Connection resilience for mobile networks

### 2. Messaging Service (`src/services/messaging/messagingService.ts`)

**Before:**
- Custom event names (`message:send`, `typing:start`, etc.)

**After:**
- Uses `SOCKET_EVENTS` from `@mixtape/core/types/socketTypes`
- Standard events: `NEW_MESSAGE`, `TYPING`, `JOIN_CHAT`
- Compatible with web app's Livewire backend

### 3. useSocket Hook (`src/hooks/useSocket.ts`)

**Before:**
- Required auth token from `useAuth` hook
- Manual token management

**After:**
- No token needed - authentication is automatic
- Uses WebSocket token system (`@mixtape/auth/wsToken`)
- Tracks connection state with real-time updates

## Shared Libraries Used

### From `@mixtape/api`
- `initializeSocket()` - Connect to Livewire server
- `getSocket()` - Get current socket instance
- `refreshSocketAuth()` - Refresh auth tokens
- `closeSocket()` - Disconnect

### From `@mixtape/auth`
- `getLivewireAccessToken()` - Fetch/cache WS tokens
- Automatic token refresh on expiration

### From `@mixtape/core`
- `SOCKET_EVENTS` - Standard event constants
  - `JOIN_CHAT: "join_chat"`
  - `NEW_MESSAGE: "message"`
  - `TYPING: "typing"`

## Usage

### Basic Chat Implementation

```typescript
import { useMessaging } from './hooks/useMessaging';

function ChatScreen({ conversationId }) {
  const {
    sendMessage,
    startTyping,
    stopTyping,
    onMessage,
    typingUsers,
    isConnected,
  } = useMessaging(conversationId);

  // Send a message
  const handleSend = (text) => {
    sendMessage(text);
    stopTyping();
  };

  // Listen for messages
  useEffect(() => {
    const cleanup = onMessage((message) => {
      // Handle new message
      setMessages(prev => [...prev, message]);
    });
    return cleanup;
  }, [onMessage]);

  return (/* UI */);
}
```

### Direct Socket Access

```typescript
import { socketService } from './services/socket/socketService';
import { SOCKET_EVENTS } from '@mixtape/core/types/socketTypes';

// Emit custom events
socketService.emit('my_custom_event', { data: 'value' });

// Listen for events
socketService.on('server_event', (data) => {
  console.log('Received:', data);
});

// Check connection
if (socketService.isConnected()) {
  // Do something
}
```

## Mobile-Specific Features

### Automatic Reconnection

The socket automatically reconnects when:
1. **App comes to foreground** - After being backgrounded
2. **Network is restored** - After losing connectivity
3. **Connection drops** - With exponential backoff (5 attempts)

### Background Behavior

- Connection may idle when app is backgrounded
- Push notifications handle messages when disconnected
- Reconnects immediately when app returns to foreground

## Environment Configuration

The shared socket connects to:
- **Development**: `http://127.0.0.1:5001` (Livewire dev server)
- **Production**: `https://chat.crossroads.place` (Livewire prod)

No configuration needed - it's handled in `@mixtape/api/lib/socket`.

## Authentication

Authentication is **completely automatic**:

1. Socket initialization calls `getLivewireAccessToken()`
2. Token is fetched from `/api/livewire/token`
3. Token is cached until near expiration
4. Token refreshes automatically on reconnection
5. Uses separate WebSocket token (scope=livewire), not REST API token

No need to:
- Pass tokens manually
- Store tokens in AsyncStorage
- Handle token refresh logic

## Available Events

### Standard Chat Events (from shared types)

| Event | Direction | Purpose |
|-------|-----------|---------|
| `JOIN_CHAT` | Emit | Join a conversation room |
| `NEW_MESSAGE` | Both | Send/receive messages |
| `TYPING` | Both | Typing indicators |

### Additional Events (backend-specific)

| Event | Direction | Purpose |
|-------|-----------|---------|
| `leave_chat` | Emit | Leave conversation room |
| `message:read` | Emit | Mark message as read |
| `conversation:read` | Emit | Mark conversation as read |
| `conversation:updated` | Listen | Conversation state changes |

## Testing

### Check Connection
```typescript
import { getSocket } from '@mixtape/api/lib/socket';

const socket = getSocket();
console.log('Connected:', socket?.connected);
console.log('Socket ID:', socket?.id);
```

### Monitor Events
```typescript
import { socketService } from './services/socket/socketService';

// Listen for all events (debugging)
const socket = socketService.getRawSocket();
if (socket) {
  socket.onAny((eventName, ...args) => {
    console.log('Event:', eventName, args);
  });
}
```

## Benefits of Shared Infrastructure

1. **Consistency** - Same behavior as web app
2. **Maintainability** - Single socket implementation to update
3. **Features** - Get all web improvements automatically
4. **Auth** - Secure WebSocket token system
5. **Reliability** - Battle-tested reconnection logic
6. **Type Safety** - Shared event constants prevent typos

## Migration Notes

If you have existing socket code:

1. Replace `socketService.connect(token)` with `socketService.connect()` (no token needed)
2. Update event names to use `SOCKET_EVENTS` constants
3. Remove any manual token management
4. Keep using existing hooks (`useSocket`, `useMessaging`) - they're already updated!

## Next Steps

To add more socket features:

1. Check `/packages/core/src/types/socketTypes.ts` for available events
2. Look at `/apps/mixtape/src/components/chat/ChatRealtimeWire.tsx` for web usage examples
3. Add new methods to `messagingService.ts` using shared events
4. Create custom hooks in `src/hooks/` for complex features
