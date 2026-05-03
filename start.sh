#!/bin/bash
set -e

cd "$(dirname "$0")"

usage() {
  cat <<EOF
Usage: $0 <project_name> [--path <dir>] [--port <port>]

  <project_name>    Identifier (lowercase a-z, 0-9, _ -; must start with a letter or number)
  --path <dir>      Use existing directory as wiki root (no scaffolding).
                    Omit to auto-create ./projects/<name>/note with defaults.
  --port <port>     Force host port. Omit to reuse or auto-pick from 8080.
EOF
  exit 1
}

# ─── 1. Parse args ────────────────────────────────────────────────
PROJECT_NAME=""
CUSTOM_PATH=""
PORT=""

while [ $# -gt 0 ]; do
  case "$1" in
    --path) CUSTOM_PATH="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    -h|--help) usage ;;
    --*) echo "error: unknown flag $1" >&2; usage ;;
    *)
      if [ -z "$PROJECT_NAME" ]; then PROJECT_NAME="$1"
      else echo "error: unexpected arg '$1'" >&2; usage
      fi
      shift
      ;;
  esac
done

if [ -z "$PROJECT_NAME" ]; then
  read -rp "Project name: " PROJECT_NAME
fi
if [ -z "$PROJECT_NAME" ]; then
  echo "error: project name required" >&2; exit 1
fi
if ! [[ "$PROJECT_NAME" =~ ^[a-z0-9][a-z0-9_-]*$ ]]; then
  echo "error: invalid project name '$PROJECT_NAME' (lowercase a-z, 0-9, _ - only; must start with a letter or number — docker compose constraint)" >&2; exit 1
fi

# ─── 2. Registry ──────────────────────────────────────────────────
PROJECTS_DIR="./projects"
PORTS_FILE="${PROJECTS_DIR}/.ports"
mkdir -p "$PROJECTS_DIR"
touch "$PORTS_FILE"

# Registry format per line:  <name>=<port>:<abs_note_path>

# ─── 3. Resolve NOTE_PATH ─────────────────────────────────────────
if [ -n "$CUSTOM_PATH" ]; then
  if [ ! -d "$CUSTOM_PATH" ]; then
    echo "error: --path '$CUSTOM_PATH' is not a directory" >&2; exit 1
  fi
  NOTE_ABS="$(cd "$CUSTOM_PATH" && pwd)"
  echo "Using external wiki root: $NOTE_ABS"
else
  NOTE_REL="${PROJECTS_DIR}/${PROJECT_NAME}/note"
  if [ ! -d "$NOTE_REL" ]; then
    echo "Creating project: $PROJECT_NAME"
    mkdir -p "$NOTE_REL/docs" "$NOTE_REL/logs"

    cat > "$NOTE_REL/README.md" <<EOF
# ${PROJECT_NAME}

## Overview
Project wiki for **${PROJECT_NAME}**.

## Decision
- Initialized on $(date +%Y-%m-%d)
EOF

    cat > "$NOTE_REL/PRD.md" <<EOF
# ${PROJECT_NAME} — PRD

## Goals
- TBD

## Scope
- TBD

## Decision
- TBD
EOF

    touch "$NOTE_REL/docs/.gitkeep" "$NOTE_REL/logs/.gitkeep"
  fi
  NOTE_ABS="$(cd "$NOTE_REL" && pwd)"
fi

# ─── 4. Port selection ────────────────────────────────────────────
if [ -z "$PORT" ]; then
  PORT="$(grep "^${PROJECT_NAME}=" "$PORTS_FILE" | tail -n1 | cut -d'=' -f2 | cut -d':' -f1 || true)"
fi
if [ -z "$PORT" ]; then
  PORT=8080
  while grep -qE "=${PORT}:" "$PORTS_FILE" \
     || lsof -iTCP:"${PORT}" -sTCP:LISTEN -Pn >/dev/null 2>&1; do
    PORT=$((PORT + 1))
  done
fi

# Upsert registry entry
tmp="$(mktemp)"
grep -v "^${PROJECT_NAME}=" "$PORTS_FILE" > "$tmp" || true
echo "${PROJECT_NAME}=${PORT}:${NOTE_ABS}" >> "$tmp"
mv "$tmp" "$PORTS_FILE"

# ─── 5. Launch ────────────────────────────────────────────────────
export PROJECT_NAME PORT
export NOTE_PATH="$NOTE_ABS"
export COMPOSE_PROJECT_NAME="context-note-${PROJECT_NAME}"

echo "Starting [${PROJECT_NAME}]"
echo "  port : ${PORT}"
echo "  note : ${NOTE_PATH}"

docker compose up -d --build

echo "Waiting for server..."
until curl -s -o /dev/null "http://localhost:${PORT}"; do
  sleep 1
done

URL="http://localhost:${PORT}"
echo "Context Note Wiki [${PROJECT_NAME}] ready at ${URL}"
open "$URL" 2>/dev/null || true
