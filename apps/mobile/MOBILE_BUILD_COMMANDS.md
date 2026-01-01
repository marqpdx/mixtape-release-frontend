# Mixtape Mobile - Build & Development Commands

## Mobile Overview

### Architecture Summary

The Mixtape mobile app is built using **React Native with Expo**, deployed as a **custom development client** (not Expo Go). This architecture enables maximum code sharing with our web application while maintaining the flexibility to use custom native modules.

### Technology Stack

#### Core Technologies

**React Native (v0.81.5)**
- Cross-platform mobile framework that renders native iOS/Android UI components
- Uses JavaScript/TypeScript with React paradigm
- Shares ~90% of code between iOS and Android platforms
- Provides native performance and UX

**Expo SDK (v52.0.0)**
- Development framework built on top of React Native
- Provides pre-configured build tools, development client, and over-the-air updates
- Simplifies native module integration and configuration
- Includes extensive library of common native functionality (camera, location, sensors, etc.)

**Custom Development Client (NOT Expo Go)**
- We use `npx expo run:android` to build a custom native app container
- Allows us to use any native module or library (not limited to Expo's sandbox)
- Includes custom native dependencies like NetInfo, AsyncStorage
- Provides production-ready approach vs. Expo Go's development-only constraints

#### Monorepo Architecture

The mobile app lives in a **yarn workspaces monorepo** alongside our web applications, enabling extensive code sharing:

```
mixtape-release-frontend/
├── apps/
│   ├── mobile/              # React Native mobile app
│   ├── mixtape/             # Next.js web app
│   └── [other apps]
├── packages/
│   ├── core/                # @mixtape/core - Shared types, utilities, constants
│   ├── api/                 # @mixtape/api - API clients, socket services
│   └── auth/                # @mixtape/auth - Authentication logic
```

### Code Sharing Strategy

The mobile app imports and reuses significant portions of the web codebase:

**Shared Packages:**

1. **`@mixtape/core`** - Types & Constants
   - TypeScript interfaces (User, Group, Message, Conversation)
   - Socket event constants (SOCKET_EVENTS)
   - Business logic utilities
   - Validation schemas

2. **`@mixtape/api`** - API & Real-time Services
   - Socket.IO client connection management
   - HTTP API client functions (login, fetch conversations, etc.)
   - WebSocket event handlers
   - Service layer abstractions

3. **`@mixtape/auth`** - Authentication
   - Token management (JWT storage, refresh)
   - Authentication state handling
   - Session management

**What's Platform-Specific:**

- **UI Components** - Mobile uses React Native components (`View`, `Text`, `FlatList`) instead of HTML/CSS
- **Navigation** - Mobile uses `@react-navigation/native` vs. Next.js routing
- **Storage** - Mobile uses AsyncStorage vs. browser localStorage
- **Network Detection** - Mobile uses `@react-native-community/netinfo` vs. browser APIs

### Backend Integration

The mobile app connects to the same backend infrastructure as the web app:

**Django REST API (Port 8010)**
- User authentication (login, logout, token refresh)
- RESTful endpoints for conversations, messages, groups
- User profile and settings
- File uploads and media handling

**Livewire WebSocket Server (Port 5001)**
- Real-time messaging (Socket.IO)
- Typing indicators
- Presence/online status
- Live collaboration features
- Event-driven architecture matching web app exactly

**Event Format Compatibility:**
The mobile app uses the exact same socket event names and payload structures as the web app:
- `join_conversation` - Join a chat room
- `send_message` - Send a message
- `receive_message` - Receive messages from others
- `start_typing` / `stop_typing` - Typing indicators
- `user_typing` - Receive typing events

### Development Approach

**Hot Reloading & Fast Refresh**
- Changes to JavaScript/TypeScript code reload instantly
- No app rebuild required for most changes
- Preserves app state during reload

**Native Module Updates**
- Adding new native dependencies requires rebuilding: `npx expo run:android`
- One-time rebuild creates new custom dev client
- Subsequent JS-only changes use fast refresh

**Environment Configuration**
- Uses `.env` files (same pattern as Next.js web app)
- Environment variables prefixed with `EXPO_PUBLIC_` (vs. `NEXT_PUBLIC_` for web)
- Automatically maps mobile env vars to format expected by shared packages

### Network Configuration

**Android Emulator:**
- Uses special IP `10.0.2.2` to reach host machine's localhost
- Backend at `http://10.0.2.2:8010`
- Livewire at `http://10.0.2.2:5001`

**Physical Devices:**
- Uses computer's actual network IP (e.g., `http://10.0.0.48:8010`)
- Device and computer must be on same WiFi network
- Firewall must allow connections on ports 8010 and 5001

### Why This Architecture?

**Business Benefits:**

1. **Faster Development** - Share types, API logic, and business rules between web and mobile
2. **Consistency** - Same backend, same data models, same real-time events
3. **Lower Maintenance** - Fix bugs once, benefit both platforms
4. **Team Efficiency** - Web developers can contribute to mobile app

**Technical Benefits:**

1. **Type Safety** - TypeScript types shared across platforms
2. **Single Source of Truth** - API clients defined once, used everywhere
3. **Real-time Parity** - Web and mobile chat seamlessly via shared socket infrastructure
4. **Gradual Native Adoption** - Start with shared code, add platform-specific features as needed

**Trade-offs:**

1. **Build Complexity** - Monorepo requires careful dependency management
2. **Platform Limitations** - Some web libraries don't work on mobile (and vice versa)
3. **Bundle Size** - Need to tree-shake unused code carefully
4. **Learning Curve** - Team needs React Native knowledge in addition to React

### Production Deployment

**Build Process:**
- Uses Expo Application Services (EAS) for cloud builds
- Generates native binaries (APK/AAB for Android, IPA for iOS)
- Supports OTA (over-the-air) updates for JavaScript-only changes
- App Store / Google Play submission via EAS Submit

**Update Strategy:**
- **Native updates** - Require app store approval (includes native code changes)
- **OTA updates** - Instant deployment for JavaScript changes (no approval needed)
- Version locking prevents incompatible updates

### Security Considerations

**Authentication:**
- JWT tokens stored in secure AsyncStorage
- Tokens sent with every API request and WebSocket connection
- Automatic token refresh on expiration
- Logout clears all stored credentials

**Network:**
- HTTPS/WSS required in production
- Token-based WebSocket authentication (same as web)
- No sensitive data in environment variables shipped to client

### Current Features (MVP)

✅ **Implemented:**
- User authentication (login/logout)
- Real-time chat messaging
- Typing indicators
- Connection state management
- Mobile-specific networking (AppState, NetInfo)
- Message history display

🚧 **In Progress:**
- Conversation list screen
- Load message history from API
- Create new conversations
- Push notifications

## Quick Reference

### Starting Development

```bash
# Start Metro bundler with QR code for device scanning
npx expo start --clear

# Start and open on Android emulator
npx expo start --android

# Start and open on iOS simulator (macOS only)
npx expo start --ios
```

### Building Dev Client (Custom Native Code)

When you add new native dependencies or need to rebuild:

```bash
# Build for Android (creates installable APK/app)
npx expo run:android

# Build for iOS (macOS only, creates app for simulator)
npx expo run:ios

# Clean build (if you have issues)
cd android && ./gradlew clean && cd ..
npx expo run:android
```

### Installing Dependencies

```bash
# Install new package (Expo-compatible)
npx expo install <package-name>

# Example: Install native modules
npx expo install @react-native-community/netinfo @react-native-async-storage/async-storage

# Regular npm/yarn packages
yarn add <package-name>
```

### Device Testing

**Physical Device:**
1. Install "Expo Go" app OR build custom dev client
2. Run `npx expo start`
3. Scan QR code with:
   - iOS: Camera app
   - Android: Expo Go app or dev client

**Android Emulator:**
```bash
# List available emulators
~/Library/Android/sdk/emulator/emulator -list-avds

# Start specific emulator
~/Library/Android/sdk/emulator/emulator -avd <emulator-name> &

# Or just use
npx expo start --android
```

  This gives you the commands to:
  1. List available emulators
  2. Start a specific one in the background (`&`)
  3. Launch Expo

  Just replace `Pixel_5_API_34` with whatever your emulator is named.
  
---

### Troubleshooting

```bash
# Clear all caches
npx expo start --clear
rm -rf node_modules
yarn install
cd android && ./gradlew clean && cd ..

# Uninstall app from emulator
~/Library/Android/sdk/platform-tools/adb uninstall com.mixtape.mobile

# Uninstall from physical device
~/Library/Android/sdk/platform-tools/adb -d uninstall com.mixtape.mobile

# Check what's running on port 8081 (Metro)
lsof -ti:8081

# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# View device logs
npx expo start
# Then press 'j' to open debugger
```

### Environment Setup

The app uses these environment variables (see `.env`):

```bash
# Django API (backend)
EXPO_PUBLIC_API_URL=http://10.0.2.2:8010

# Livewire socket server (real-time)
EXPO_PUBLIC_LIVEWIRE_URL=http://10.0.2.2:5001
```

**Note:** `10.0.2.2` is the special IP for Android emulator to reach host's localhost.
For physical devices, use your computer's actual IP address (e.g., `http://192.168.1.100:8010`).

### Production Builds

```bash
# Build for Android (APK for testing)
eas build --platform android --profile preview

# Build for production (app store)
eas build --platform android --profile production

# Build for iOS (TestFlight/App Store)
eas build --platform ios --profile production
```

### Useful Expo Commands

```bash
# Check project health
npx expo-doctor

# Install suggested Expo packages
npx expo install --fix

# Upgrade Expo SDK
npx expo upgrade

# Login to Expo (for EAS builds)
npx expo login

# View project info
npx expo whoami
npx expo config
```

## Development Workflow

### Daily Development
1. Start backend: `cd ../mixtape-release-core && DJANGO_SETTINGS_MODULE=mixtape.settings.dev ../env/bin/python manage.py runserver 0.0.0.0:8010`
2. Start Livewire: `cd ../mixtape-release-livewire && yarn start` (should be on port 5001)
3. Start mobile: `npx expo start --android` or `npx expo start` (for device)
4. Make changes - Metro will hot reload automatically

### After Installing Native Modules
1. Stop Metro bundler
2. Rebuild: `npx expo run:android`
3. App will launch automatically
4. Future runs can use `npx expo start --android`

### Testing on Physical Device
1. Update `.env` with your computer's IP:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8010
   EXPO_PUBLIC_LIVEWIRE_URL=http://192.168.1.XXX:5001
   ```
2. Start dev server: `npx expo start`
3. Scan QR code with device
4. Ensure device is on same WiFi network

## Common Issues

**"ViewManager not found"**
- Means you added a native module but didn't rebuild
- Solution: `npx expo run:android`

**"Port 8081 already in use"**
- Old Metro bundler is still running
- Solution: `lsof -ti:8081 | xargs kill -9`

**"INSTALL_FAILED_UPDATE_INCOMPATIBLE"**
- App signature changed between builds
- Solution: `~/Library/Android/sdk/platform-tools/adb uninstall com.mixtape.mobile`

**"Unable to resolve module"**
- Dependency not installed
- Solution: `npx expo install <missing-module>` then `npx expo start --clear`

**Network errors on device**
- Device can't reach your computer
- Check: Same WiFi? IP correct in `.env`? Firewall blocking ports?

## Project Structure

```
apps/mobile/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Main screens (Login, Dashboard, Chat)
│   ├── navigation/       # Navigation config
│   ├── services/         # API & socket services
│   │   ├── socket/       # WebSocket connection
│   │   └── messaging/    # Chat messaging
│   ├── hooks/            # Custom React hooks
│   └── config/           # Environment config
├── android/              # Native Android code
├── .env                  # Environment variables
├── app.config.js         # Expo configuration
└── App.tsx               # Root component
```

## Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
