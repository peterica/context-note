# Context Note Wiki

실행 가능한 컨텍스트 상태를 관리하는 구조 기반 위키 시스템.

LLM 대화의 가비지 컨텍스트 누적 문제를 해결하기 위해, 파일 트리 구조로 컨텍스트를 분리하고 Structured Editor로 사용자 입력 부담을 최소화합니다.

## 시작하기 (Docker)

```bash
docker compose up -d
```

http://localhost:8310 으로 접속합니다.

문서는 `note/` 폴더에 실제 `.md` 파일로 저장됩니다.

```
context-note/note/
├── rag-platform/
│   ├── design.md
│   ├── dev.md
│   └── decision.md
└── context-os/
    └── overview.md
```

### Docker 구성

| 항목 | 값 |
|------|-----|
| 포트 | `8310` → 컨테이너 `3000` |
| 볼륨 | `./note` → `/data/note` |
| 이미지 | Node 22 Alpine + Next.js standalone |

```bash
docker compose up -d      # 시작
docker compose down        # 중지
docker compose up -d --build  # 코드 변경 후 재빌드
docker logs context-note   # 로그 확인
```

### 로컬 개발 (Docker 없이)

```bash
cd dev
npm install
npm run dev
```

http://localhost:3000 으로 접속. `note/` 폴더를 직접 읽고 씁니다.

## 핵심 개념

- **파일 트리 = 컨텍스트 구조**: 좌측 사이드바에서 주제별 파일을 관리
- **Structured Editor**: TipTap 기반 WYSIWYG 에디터, Markdown 직접 입력 없이 구조화된 문서 작성
- **Template Injection**: 새 파일 생성 시 Problem/Design/Dev/Test/Decision/Next 섹션 자동 삽입
- **구조 강제**: 최소 1개 Section, Decision 섹션 필수, depth 3단계 이하
- **파일시스템 저장**: 에디터 내용은 `note/` 하위에 실제 `.md` 파일로 저장 (1초 debounce 자동 저장)

## 기능

### 파일 트리 (좌측 사이드바)

- 폴더/파일 계층 구조 표시
- 파일 클릭으로 에디터 로드
- 폴더/파일 생성 및 삭제 (hover 시 버튼 노출)
- 스냅샷 생성 (파일 hover 시 `S` 버튼 → `filename_v1.md` 복제)

### Structured Editor (중앙)

- TipTap 기반 WYSIWYG 편집
- Toolbar: Init Template / +Section(H2) / List
- 하단 구조 검증 상태바 (Section 유무, Decision 필수 체크)
- 파일 선택 시 자동 포커스

### 데이터 저장

- API Route를 통한 파일시스템 직접 I/O
- `note/` 폴더가 SSOT (Single Source of Truth)
- Docker 볼륨 마운트로 호스트와 동기화

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js (App Router, TypeScript) |
| Editor | TipTap (StarterKit) |
| State | Zustand |
| HTML→MD | Turndown |
| Styling | Tailwind CSS (다크 테마) |
| Runtime | Docker (Node 22 Alpine) |

## 프로젝트 구조

```
context-note/
├── docker-compose.yml      # Docker 실행 설정 (포트 8310)
├── note/                   # 문서 저장소 (볼륨 마운트)
│   ├── rag-platform/
│   │   └── *.md
│   └── context-os/
│       └── *.md
└── dev/                    # Next.js 소스 코드
    ├── Dockerfile
    └── src/
        ├── app/
        │   ├── page.tsx
        │   ├── globals.css
        │   └── api/            # 파일시스템 API
        │       ├── tree/route.ts   # GET: 트리 조회
        │       ├── file/route.ts   # CRUD: 파일 읽기/쓰기/생성/삭제
        │       └── folder/route.ts # 폴더 생성/삭제
        ├── components/
        │   ├── FileTree/
        │   └── Editor/
        ├── store/
        │   └── useStore.ts
        ├── lib/
        │   └── notePath.ts    # NOTE_ROOT 경로 + path traversal 방지
        └── types/
            └── index.ts
```

## 스타일 가이드

| 속성 | 값 |
|------|-----|
| Background | `#0f172a` |
| Text | `#e5e7eb` |
| Primary | `#2563eb` |
| Border | `#1f2937` |
| Font | system-ui |
