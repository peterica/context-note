#!/bin/bash
set -e

cd "$(dirname "$0")"

PORT="${PORT:-8080}"
WORKSPACE_ROOT="${WORKSPACE_ROOT:-/Users/seodong-eok/peterica}"

if [ ! -d "$WORKSPACE_ROOT" ]; then
  echo "error: WORKSPACE_ROOT '$WORKSPACE_ROOT' is not a directory" >&2
  exit 1
fi

WORKSPACE_ABS="$(cd "$WORKSPACE_ROOT" && pwd)"
export PORT
export WORKSPACE_ROOT="$WORKSPACE_ABS"

echo "Starting Context Note"
echo "  port      : $PORT"
echo "  workspace : $WORKSPACE_ROOT"

docker compose up -d --build

echo "Waiting for server..."
until curl -s -o /dev/null "http://localhost:${PORT}"; do
  sleep 1
done

URL="http://localhost:${PORT}"
echo "Context Note ready at ${URL}"
open "$URL" 2>/dev/null || true
