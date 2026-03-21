#!/bin/bash
set -e

cd "$(dirname "$0")"

# note 디렉토리 없으면 생성
mkdir -p note

# 컨테이너 시작 (이미 실행중이면 재시작)
if docker compose ps --status running 2>/dev/null | grep -q context-note; then
  echo "context-note already running, restarting..."
  docker compose restart
else
  docker compose up -d --build
fi

# 서버 준비 대기
echo "Waiting for server..."
until curl -s -o /dev/null http://localhost:8310; do
  sleep 1
done

echo "Context Note Wiki ready at http://localhost:8310"
open http://localhost:8310
