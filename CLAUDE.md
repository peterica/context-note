# CLAUDE.md — Context Note Wiki

## Project Overview

구조 기반 위키 시스템. 파일 트리로 컨텍스트를 분리하고, TipTap 에디터로 구조화된 문서를 작성한다.

## Folder Structure

```
context-note/
├── CLAUDE.md              # AI 에이전트 지침
├── dev/                   # Next.js 소스 코드
│   └── src/
│       ├── app/           # 페이지 및 API Routes
│       ├── components/    # FileTree, Editor, CommandPalette
│       ├── store/         # Zustand 상태 관리
│       ├── lib/           # 유틸리티
│       └── types/         # 타입 정의
├── note/                  # 문서 저장소 (볼륨 마운트)
└── docker-compose.yml     # Docker 실행 설정
```

## Tech Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Editor**: TipTap (StarterKit)
- **State**: Zustand
- **HTML→MD**: Turndown
- **Styling**: Tailwind CSS

## Running Commands

```bash
# Docker
docker compose up -d          # 시작 (http://localhost:8080)
docker compose down            # 중지

# 로컬 개발
cd dev && npm install && npm run dev   # http://localhost:3000
```

## Domain Rules

- 사용자에게 Markdown 문법을 직접 노출하지 말 것
- 모든 문서는 최소 1개 Section(H2) 포함
- Decision 섹션 필수
- depth 3단계 이하 유지
