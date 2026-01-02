# Mixtape Mobile

React Native mobile app using Expo with Custom Dev Client, sharing code with the web apps via monorepo packages.

## Architecture

This app imports shared code from:
- `@mixtape/core` - Types, utilities, configurations
- `@mixtape/api` - API clients and React Query hooks
- `@mixtape/auth` - Authentication logic

## Setup

### Install Dependencies
```bash
# From monorepo root
yarn install
```

### Development

**First time only - Build your custom dev client:**

For iOS (requires Mac):
```bash
cd apps/mobile
eas build --profile development --platform ios
```

For Android:
```bash
cd apps/mobile
eas build --profile development --platform android
```

Install the build on your device via TestFlight (iOS) or direct APK install (Android).

**Daily development:**
```bash
cd apps/mobile
yarn start
```

Then scan the QR code with your custom dev client app.

### API Base URLs (Local vs Staging/Prod)

Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_LIVEWIRE_URL` based on where you run:

- Android emulator: `http://10.0.2.2:8010` (host machine alias)
- iOS simulator: `http://localhost:8010`
- Physical device on LAN: `http://<your-host-ip>:8010` (server must bind `0.0.0.0`)
- Staging/Prod: `https://<your-domain>`

These are passed through `src/config/env.ts` so shared packages can read them.

### Production Builds

**Build for App Store/Play Store:**
```bash
# iOS
eas build --profile production --platform ios
eas submit --platform ios

# Android
eas build --profile production --platform android
eas submit --platform android

# Both
eas build --profile production --platform all
```

### OTA Updates

Push JavaScript updates without rebuilding:
```bash
eas update --branch production
```

## Project Configuration

- **Bundle ID (iOS)**: `com.mixtape.mobile`
- **Package Name (Android)**: `com.mixtape.mobile`
- **Expo SDK**: v54
- **React Native**: 0.81.5

## Key Features

- ✅ Custom Dev Client (can add any native module)
- ✅ TypeScript with strict mode
- ✅ Shares code with web apps
- ✅ OTA updates enabled
- ✅ Both iOS and Android support
- ✅ EAS Build configured

## Useful Commands

```bash
# Start dev server
yarn start

# Run on iOS simulator (requires Mac)
yarn ios

# Run on Android emulator
yarn android

# Type check
npx tsc --noEmit

# Clear cache
npx expo start --clear
```

## Next Steps

1. Set up your Expo account: `npx expo login`
2. Create an EAS project: `eas init`
3. Build your first dev client: `eas build --profile development --platform [ios|android]`
4. Start developing!
