#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "$ROOT_DIR/../.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"

DO_CLEAN=0
DEVICE_ID=""

while (($# > 0)); do
  case "$1" in
    --clean)
      DO_CLEAN=1
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
      echo "Usage: bash android_dev_install.sh [--clean] [--device DEVICE_ID]" >&2
      exit 1
      ;;
  esac
done

if [[ ! -d "$SDK_DIR" ]]; then
  echo "Android SDK not found at $SDK_DIR" >&2
  echo "Set ANDROID_HOME or ANDROID_SDK_ROOT before running this script." >&2
  exit 1
fi

export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"
export NODE_ENV="development"

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

if [[ -n "$DEVICE_ID" ]]; then
  echo "Running Expo Android dev install for device $DEVICE_ID..."
  (cd "$ROOT_DIR" && npx expo run:android --device "$DEVICE_ID")
else
  echo "Running Expo Android dev install..."
  (cd "$ROOT_DIR" && npx expo run:android --device)
fi
