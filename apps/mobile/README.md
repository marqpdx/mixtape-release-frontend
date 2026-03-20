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

### Android Local Build Paths

There are three Android commands that serve different purposes:

1. Regenerate native Android after config/native-module changes:
```bash
cd apps/mobile
npx expo prebuild --clean --platform android
```

Use this when native config changes have accumulated or when you add/remove native modules. It recreates `android/`, so any generated native state is reset.

2. Install a local dev build directly to a connected device:
```bash
cd apps/mobile
npx expo run:android --device
```

Use this for normal interactive development on a USB-connected Android device. This is a development build, so it is best for iterating with Metro and native debugging.

3. Build and install a portable local APK for QA:
```bash
cd apps/mobile
bash android_release_install.sh
```

Optional flags:
```bash
# Recreate android/ first
bash android_release_install.sh --clean

# Build/install a debug APK instead of release
bash android_release_install.sh --debug

# Target a specific physical device
bash android_release_install.sh --device <DEVICE_ID>
```

This script:
- restores `ANDROID_HOME` / `ANDROID_SDK_ROOT`
- recreates `android/local.properties`
- optionally runs Android prebuild clean
- builds a local APK
- installs it with `adb`

Use this when you want a more portable on-device APK for QA instead of a Metro-dependent dev build.

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
