# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Daily dev (requires custom dev client already installed on device)
yarn start

# iOS simulator
yarn ios

# Android emulator
yarn android

# Type check
npx tsc --noEmit

# Clear Metro cache
npx expo start --clear

# Rebuild native Android after config/native-module changes
npx expo prebuild --clean --platform android

# Install dev build to connected Android device via USB
npx expo run:android --device

# Build portable release APK for QA and install via adb
bash run_android_release_install.sh
# Optional flags: --clean (rebuild android/), --debug, --device <DEVICE_ID>

# EAS cloud builds
eas build --profile development --platform [ios|android]
eas build --profile production --platform [ios|android]
eas submit --platform [ios|android]
eas update --branch production   # OTA JS-only update
```

**First-time setup**: Must build a custom dev client via EAS before `yarn start` will work. Install the resulting build on device via TestFlight (iOS) or direct APK (Android).

## Environment

Set in `.env` or shell before starting Metro:
- `EXPO_PUBLIC_API_URL` — REST API base (default: `http://10.0.2.2:8010` for Android emulator)
- `EXPO_PUBLIC_LIVEWIRE_URL` — Socket.IO server (default: `http://10.0.2.2:5001`)

Use `http://localhost:8010` for iOS simulator, `http://<host-ip>:8010` for physical device on LAN. These are bridged in `src/config/env.ts` so shared monorepo packages can read them as `NEXT_PUBLIC_*`.

## Architecture

**Stack**: React Native 0.81.5 · Expo SDK 54 · TypeScript (strict) · Custom Dev Client

**Monorepo packages** (shared with web apps):
- `@mixtape/core` — types and utilities
- `@mixtape/api` — React Query hooks and API clients
- `@mixtape/auth` — authentication logic (wsToken, login)

### Source layout

```
src/
├── config/env.ts          # Maps EXPO_PUBLIC_* → NEXT_PUBLIC_* for shared packages
├── navigation/            # React Navigation (native-stack + bottom-tabs)
├── screens/               # 8 top-level screen components
├── components/            # UI components (messages, home, feedback)
├── hooks/                 # 7 custom hooks (useMessaging, useNotifications, etc.)
├── stores/                # Zustand stores (auth, chat, notification)
├── services/              # socket, messaging, notifications services
└── providers/             # QueryProvider (React Query config)
```

### Navigation (`src/navigation/AppNavigator.tsx`)

`createNativeStackNavigator<RootStackParamList>` with conditional root: `LoginScreen` when unauthenticated, otherwise the full stack (Landing → Messages → Groups → Chat → modals). A global `navigationRef` is used for deep-linking from push notification taps.

### State management

Three **Zustand** stores:
- `authStore` — `UserIdentity | null`, `isAuthenticated`
- `chatStore` — unread counts per conversation slug, conversation previews, active conversation (suppresses notifications while in-chat)
- `notificationStore` — push permission status, Expo push token, last-synced token

**React Query** (via `QueryProvider`) handles server state; configured with `retry: 1`, `refetchOnWindowFocus: false`.

### Real-time (Socket.IO)

`src/services/socket/socketService.ts` wraps `@mixtape/api/lib/socket` and adds mobile-specific app-state and network listeners. Livewire-style events: `send_message`, `receive_message`, `start_typing` / `stop_typing`, `join_conversation` / `leave_conversation`, `message:read`, `conversation:updated`.

`src/components/ChatStateManager.tsx` bridges socket events into Zustand store updates.

### Push notifications

`src/services/notifications/notificationService.ts` uses Expo Notifications. Handles permission requests, Expo push token registration (synced to backend via `@mixtape/api`), badge count, Android channel config, and notification suppression when the target conversation is active.

### Key component roles

- `ConversationListPanel` — lists conversations with unread badges
- `ConversationThreadPanel` — message thread with input and typing indicators
- `useMessaging()` — join/leave rooms, send messages, typing events
- `useNotifications()` — push registration and notification-to-navigation deep linking
- `useConversationMessages()` — paginated message fetching
