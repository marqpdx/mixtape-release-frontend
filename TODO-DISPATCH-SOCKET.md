# TODO: Update Dispatch Socket Integration

**Status**: 🚧 **BLOCKED** - Waiting for dispatch feature migration
**Date Created**: 2025-11-23
**Priority**: High (must do before dispatch goes live)

---

## Context

We consolidated the frontend socket architecture to use **ONE shared socket** for all real-time features (chat, dispatch/docs, future features).

**Changes made**:
- ✅ Moved `lib/chat/socket.ts` → `lib/socket.ts` (generic shared socket)
- ✅ Deleted `lib/dispatch/socket-shared.ts` (duplicate socket singleton)
- ✅ Updated all chat imports to use new path

**What still needs updating**: All dispatch/collaborative editing code.

---

## Files That Need Updates

The following dispatch files currently import from the **deleted** `lib/dispatch/socket-shared.ts`:

### 1. `/src/lib/dispatch/yjs/useTipTapYjsSocketProvider.ts`
**Change needed**:
```typescript
// OLD:
import { initializeSharedSocket, getSharedSocket } from "lib/dispatch/socket-shared";

// NEW:
import { initializeSocket, getSocket } from "lib/socket";
```

### 2. `/src/lib/dispatch/yjs/customSocketIoAdapter.ts`
**Change needed**: Update socket initialization calls

### 3. `/src/lib/dispatch/yjs/customTempSocketIOAdapter.ts`
**Change needed**: Update socket initialization calls

### 4. `/src/lib/dispatch/yjs/useTempSocketProvider.ts`
**Change needed**: Update socket initialization calls

### 5. Any other dispatch components/hooks
Search for:
```bash
grep -r "socket-shared" src/lib/dispatch/
grep -r "initializeSharedSocket\|getSharedSocket" src/
```

---

## Function Name Changes

| Old (Dispatch)           | New (Shared)        |
|-------------------------|---------------------|
| `initializeSharedSocket()` | `initializeSocket()` |
| `getSharedSocket()`       | `getSocket()`       |
| `closeSharedSocket()`     | `closeSocket()`     |

---

## Testing Checklist (After Update)

When you update dispatch code, verify:

- [ ] Dispatch connects to socket server successfully
- [ ] Y.js collaborative editing works
- [ ] Chat still works (no regression)
- [ ] Only ONE socket connection per client (check DevTools → Network → WS)
- [ ] Socket reconnection works for both chat and dispatch
- [ ] Logout properly closes shared socket

---

## Architecture After Update

```
lib/socket.ts (ONE shared singleton)
    ↓
useSocketSetup (app-level init - joins all rooms)
    ↓
├─ useGlobalSocketEvents (chat events)
├─ useDispatchSocketEvents (docs/Y.js events)
└─ [future features]
```

**Benefits**:
- ✅ One WebSocket connection instead of two
- ✅ Single auth token exchange
- ✅ Consistent reconnection behavior
- ✅ Lower resource usage
- ✅ Simpler state management

---

## Notes

- The backend (`server.ts`) already expects one connection per client
- Chat events and dispatch events use different event namespaces on the same socket
- No functional changes needed to dispatch logic, just import path updates

---

**Reminder**: Delete this file after dispatch socket updates are complete.
