# Mobile Chat MVP Roadmap

## ✅ Completed

1. **Authentication**
   - Real Django backend login
   - Token storage and refresh
   - WebSocket authentication

2. **Socket Infrastructure**
   - Shared socket.io connection with web app
   - Real-time messaging foundation
   - Connection state management
   - Mobile-specific features (AppState, NetInfo)

3. **Basic Chat UI**
   - Chat screen with message display
   - Message input with keyboard handling
   - Send button
   - Typing indicators structure
   - Connection status banner

## 🎯 MVP Features Needed

### Priority 1: Core Chat Flow

**1. Conversation List Screen**
   - [ ] Fetch conversations from `/api/chat/conversations/`
   - [ ] Display list with:
     - Conversation title/participants
     - Last message preview
     - Unread count badge
     - Timestamp
   - [ ] Tap to open chat
   - [ ] Pull to refresh
   - [ ] Empty state (no conversations)

**2. Fix Message Sending/Receiving**
   - [ ] Debug why messages aren't appearing
   - [ ] Verify socket event names match backend
   - [ ] Add optimistic UI updates (show message immediately)
   - [ ] Handle message delivery confirmation
   - [ ] Show message status (sending, sent, failed)

**3. Message History**
   - [ ] Load existing messages when opening conversation
   - [ ] API call to `/api/chat/conversations/{id}/messages/`
   - [ ] Pagination (load more on scroll up)
   - [ ] Show message sender (user vs others)
   - [ ] Message timestamps

### Priority 2: Enhanced Chat UX

**4. New Conversation**
   - [ ] "New Message" button
   - [ ] User search/selection
   - [ ] Create conversation via API
   - [ ] Navigate to new chat

**5. Message Features**
   - [ ] Message bubbles (different colors for sent/received)
   - [ ] Show sender name/avatar
   - [ ] Auto-scroll to bottom on new message
   - [ ] Timestamp grouping (Today, Yesterday, etc.)
   - [ ] Read receipts

**6. Real-time Features**
   - [ ] Live typing indicators (already wired up!)
   - [ ] Presence indicators (online/offline)
   - [ ] Unread count updates in conversation list

### Priority 3: Polish

**7. Error Handling**
   - [ ] Network error messages
   - [ ] Retry failed messages
   - [ ] Handle disconnection gracefully
   - [ ] Login session expiration

**8. Performance**
   - [ ] Message virtualization for long conversations
   - [ ] Image optimization
   - [ ] Cache conversations locally
   - [ ] Background sync

## 📋 Implementation Plan

### Phase 1: Get Messages Working (Current)
```
1. Debug message sending
   - Add console.logs to trace message flow
   - Check socket event names
   - Verify backend is receiving events

2. Load message history
   - Create API call
   - Display in ChatScreen
   - Handle empty state
```

### Phase 2: Conversation List
```
1. Create ConversationListScreen
   - Similar to DashboardScreen structure
   - Use FlatList for conversations
   - Add navigation to Chat

2. Wire up to navigation
   - Replace hardcoded conversation ID
   - Pass selected conversation

3. Real-time updates
   - Listen for new messages
   - Update last message preview
   - Increment unread counts
```

### Phase 3: New Conversations
```
1. Create NewConversationScreen
   - User search
   - Selection UI
   - Create button

2. API integration
   - POST /api/chat/conversations/
   - Navigate to new conversation
```

## 🛠 Technical Notes

### Socket Events (Already Configured)
```typescript
// From @mixtape/core/types/socketTypes
JOIN_CHAT: "join_chat"        // Join conversation room
NEW_MESSAGE: "message"         // Send/receive messages
TYPING: "typing"               // Typing indicators
```

### API Endpoints Available
```
GET    /api/chat/conversations/              # List conversations
POST   /api/chat/conversations/              # Create conversation
GET    /api/chat/conversations/{id}/messages/ # Get messages
POST   /api/chat/conversations/{id}/messages/ # Send message (optional, can use socket)
GET    /api/chat/conversations/unreads       # Get unread counts
```

### Current Architecture

**Screens:**
- `LoginScreen` - ✅ Working
- `DashboardScreen` - ✅ Working
- `ChatScreen` - ⚠️ Needs message debugging
- `ConversationListScreen` - ❌ Not created
- `NewConversationScreen` - ❌ Not created

**Services:**
- `socketService` - ✅ Connected to backend
- `messagingService` - ✅ Emitting events (need to verify receiving)

**Hooks:**
- `useSocket` - ✅ Working
- `useMessaging` - ✅ Working (need to debug message flow)

## 🔍 Next Immediate Steps

1. **Test with Real Conversation** (NOW)
   - Reload app with new conversation ID
   - Try sending message
   - Check logs for socket events
   - See if message appears

2. **Debug Message Flow** (if not working)
   - Add console.logs in messagingService
   - Check socket.io devtools
   - Verify backend is broadcasting
   - Check event payload structure

3. **Load Message History**
   - Create API client function
   - Call on ChatScreen mount
   - Display existing messages

4. **Build Conversation List**
   - New screen component
   - API integration
   - Navigation wiring

## 💡 Testing Strategy

**Test 1: Self-Chat**
- Send message on mobile
- Should see it appear immediately
- Backend echoes back to same user

**Test 2: Web + Mobile**
- Open conversation in browser
- Open same conversation in mobile
- Send from mobile → should appear in browser
- Send from browser → should appear in mobile

**Test 3: Multi-User**
- Two different users
- Each on mobile app
- Chat between them

## 📝 Questions to Answer

1. **Message Structure:** What fields does backend expect?
   ```typescript
   {
     conversationId: string;
     content: string;
     timestamp?: string;
     // others?
   }
   ```

2. **Event Names:** Are we using the right socket events?
   - Sending: `message` ✓
   - Receiving: `message` ✓
   - Or does backend use different names?

3. **Conversation Management:** How does backend handle:
   - Creating conversations
   - Adding participants
   - Leaving conversations
