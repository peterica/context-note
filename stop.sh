#!/bin/bash
set -e

cd "$(dirname "$0")"

PORTS_FILE="./projects/.ports"

usage() {
  echo "Usage: $0 <project_name> | --port <port> | --all"
  exit 1
}

# Parse "name=port:path" line → sets NAME / PORT / NOTE_ABS
parse_line() {
  local line="$1"
  NAME="${line%%=*}"
  local rest="${line#*=}"
  PORT="${rest%%:*}"
  NOTE_ABS="${rest#*:}"
}

stop_project() {
  local name="$1" port="$2" note_abs="$3"

  PROJECT_NAME="$name" \
  PORT="$port" \
  NOTE_PATH="$note_abs" \
  COMPOSE_PROJECT_NAME="context-note-${name}" \
    docker compose down || true

  echo "Stopped [${name}] (port ${port})"
}

[ $# -lt 1 ] && usage
[ -f "$PORTS_FILE" ] || { echo "no projects registered"; exit 0; }

case "$1" in
  --all)
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      parse_line "$line"
      stop_project "$NAME" "$PORT" "$NOTE_ABS"
    done < "$PORTS_FILE"
    ;;

  --port)
    [ -z "${2:-}" ] && usage
    target="$2"
    match="$(grep "=${target}:" "$PORTS_FILE" || true)"
    [ -z "$match" ] && { echo "error: no project on port ${target}"; exit 1; }
    parse_line "$match"
    stop_project "$NAME" "$PORT" "$NOTE_ABS"
    ;;

  *)
    name="$1"
    line="$(grep "^${name}=" "$PORTS_FILE" || true)"
    [ -z "$line" ] && { echo "error: unknown project '${name}'"; exit 1; }
    parse_line "$line"
    stop_project "$NAME" "$PORT" "$NOTE_ABS"
    ;;
esac
