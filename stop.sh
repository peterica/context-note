#!/bin/bash
set -e

cd "$(dirname "$0")"

docker compose down || true
echo "Context Note stopped."
