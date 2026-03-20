#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "$ROOT_DIR/../.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"

DO_CLEAN=0
BUILD_MODE="release"
DEVICE_ID=""

while (($# > 0)); do
  case "$1" in
    --clean)
      DO_CLEAN=1
      shift
      ;;
    --debug)
      BUILD_MODE="debug"
      shift
      ;;
    --device)
      if (($# < 2)); then
        echo "Missing value for --device" >&2
        exit 1
      fi
      DEVICE_ID="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: bash android_release_install.sh [--clean] [--debug] [--device DEVICE_ID]" >&2
      exit 1
      ;;
  esac
done

if [[ "$BUILD_MODE" == "debug" ]]; then
  APK_PATH="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
  GRADLE_TASK="assembleDebug"
  export NODE_ENV="development"
else
  APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
  GRADLE_TASK="assembleRelease"
  export NODE_ENV="production"
fi

if [[ ! -d "$SDK_DIR" ]]; then
  echo "Android SDK not found at $SDK_DIR" >&2
  echo "Set ANDROID_HOME or ANDROID_SDK_ROOT before running this script." >&2
  exit 1
fi

export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"

if [[ ! -d "$ROOT_DIR/node_modules/@react-native-clipboard/clipboard" ]]; then
  echo "@react-native-clipboard/clipboard is missing from apps/mobile/node_modules. Running yarn install from monorepo root..."
  (cd "$MONOREPO_ROOT" && yarn install)
fi

if (( DO_CLEAN )); then
  echo "Running Expo Android prebuild clean..."
  (cd "$ROOT_DIR" && npx expo prebuild --clean --platform android)
fi

if [[ ! -d "$ANDROID_DIR" ]]; then
  echo "Android directory not found at $ANDROID_DIR" >&2
  exit 1
fi

cat > "$ANDROID_DIR/local.properties" <<EOF
sdk.dir=$SDK_DIR
EOF

if [[ -z "$DEVICE_ID" ]]; then
  DEVICE_ID="$(adb devices | awk 'NR>1 && $2=="device" && $1 !~ /^emulator-/ { print $1; exit }')"
fi

if [[ -z "$DEVICE_ID" ]]; then
  echo "No physical Android device found. Connect a device or pass --device DEVICE_ID." >&2
  exit 1
fi

echo "Building release APK for device $DEVICE_ID..."
echo "Using build mode: $BUILD_MODE"
(cd "$ANDROID_DIR" && ./gradlew "$GRADLE_TASK")

if [[ ! -f "$APK_PATH" ]]; then
  echo "APK not found at $APK_PATH" >&2
  exit 1
fi

echo "Installing APK to $DEVICE_ID..."
adb -s "$DEVICE_ID" install -r "$APK_PATH"

echo "Done."
