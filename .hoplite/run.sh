#!/usr/bin/env bash
set -euo pipefail
# Production preview avoids the sandbox's failing HMR WebSocket handshake.
pnpm build
exec node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port "${PORT:-3000}"
