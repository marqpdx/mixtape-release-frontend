#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "→ syncing help source files..."
node scripts/sync-help.js

echo "→ generating help manifest..."
yarn generate:help

echo "✓ done"
