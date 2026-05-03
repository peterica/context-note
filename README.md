# Context Note

Structure-first wiki for managing actionable context.

LLM 대화에서 컨텍스트가 누적되면 핵심이 희석됩니다. Context Note는 파일 트리 구조로 컨텍스트를 분리하고, 구조화된 에디터로 **의사결정 중심 문서**를 작성합니다.

![Main](images/main.png)

## Quick Start

### Docker

```bash
docker compose up -d
```

http://localhost:8080 에서 접속합니다.

### Local Development

```bash
cd dev
npm install
npm run dev
```

http://localhost:3000 에서 접속합니다.

## Server Scripts

여러 프로젝트 위키를 각자의 포트로 관리할 때 `start.sh` / `stop.sh` 를 사용합니다.
포트는 자동으로 8080부터 할당되며 `projects/.ports` 에 등록됩니다.

### Start

```bash
# 1. 새 프로젝트 자동 생성 + 기동 (./projects/<name>/note 스캐폴딩)
./start.sh my-wiki

# 2. 기존 디렉토리를 위키 루트로 사용
./start.sh my-wiki --path /Users/seodong-eok/peterica/semi-project/peterica-edge-rag/task/ondevice-rag --port 8320

# 3. 포트 강제 지정
./start.sh my-wiki --port 8090
```
```bash
./start.sh contextflow \
--path /Users/seodong-eok/peterica/ContextFlow \
--port 8330
```
```bash
./start.sh my-wiki \
--path /Users/seodong-eok/peterica/semi-project/context-note \
--port 8320
```

> 프로젝트 이름은 소문자/숫자/`_`/`-` 만 허용됩니다 (docker compose 제약). 호스트 디렉토리 경로는 대소문자 무관.

실행 결과:

```
Starting [my-wiki]
  port : 8080
  note : /.../projects/my-wiki/note
Context Note Wiki [my-wiki] ready at http://localhost:8080
```

### Stop

```bash
# 이름으로 중지
./stop.sh my-wiki

# 포트로 중지
./stop.sh --port 8080

# 등록된 모든 프로젝트 중지
./stop.sh --all
```

## Screenshots

### Structured Editor

슬래시 메뉴(`/`)로 Heading, List, Code Block 등 블록을 빠르게 삽입합니다. Toolbar에서 Init Template 버튼으로 기본 섹션 구조를 자동 생성할 수 있습니다.

![Editor](images/Editor.png)

### Preview Mode

Editor / Preview 탭 전환으로 렌더링된 문서를 확인합니다. 파일 트리에서 문서 구조를 한눈에 파악할 수 있습니다.

![Preview](images/Preview.png)

## Key Concepts

- **File Tree = Context Structure**: 좌측 사이드바에서 주제별 파일을 계층 관리
- **Structured Editor**: TipTap WYSIWYG 에디터, Markdown을 직접 노출하지 않음
- **Template Injection**: 새 파일 생성 시 Problem / Design / Dev / Test / Decision / Next 섹션 자동 삽입
- **Decision Required**: 모든 문서에 Decision 섹션 필수
- **File System Storage**: `note/` 폴더에 실제 `.md` 파일로 저장, Docker 볼륨 마운트로 호스트와 동기화

## Features

### File Tree (Sidebar)

- 폴더/파일 계층 구조 표시
- 파일 클릭으로 에디터 로드
- 폴더/파일 생성 및 삭제
- 스냅샷 생성 (`S` 버튼 → `filename_v1.md` 복제)

### Structured Editor

- TipTap WYSIWYG 편집
- 슬래시 메뉴(`/`)로 블록 삽입
- Toolbar: Init Template / +Section(H2) / List
- 하단 구조 검증 상태바 (Section 유무, Decision 필수 체크)
- 1초 debounce 자동 저장

### Sample Notes

`note/` 폴더에 샘플 문서가 포함되어 있습니다:

```
note/
├── getting-started/
│   └── welcome.md              # 시작 가이드
└── examples/
    ├── api-auth-design.md      # API 인증 설계 예시
    └── state-management-comparison.md  # 상태 관리 비교 예시
```

## Tech Stack

| Area | Technology |
|------|-----------|
| Framework | Next.js (App Router, TypeScript) |
| Editor | TipTap (StarterKit) |
| State | Zustand |
| HTML→MD | Turndown |
| Styling | Tailwind CSS |
| Runtime | Docker (Node 22 Alpine) |

## Project Structure

```
context-note/
├── docker-compose.yml         # Docker 설정 (포트 8080)
├── note/                      # 문서 저장소 (볼륨 마운트)
└── dev/                       # Next.js 소스 코드
    ├── Dockerfile
    └── src/
        ├── app/
        │   ├── page.tsx
        │   └── api/           # 파일시스템 API
        │       ├── tree/      # GET: 트리 조회
        │       ├── file/      # CRUD: 파일 읽기/쓰기/생성/삭제
        │       ├── folder/    # 폴더 생성/삭제
        │       └── rename/    # 이름 변경
        ├── components/
        │   ├── FileTree/
        │   ├── Editor/
        │   └── CommandPalette/
        ├── store/
        ├── lib/
        └── types/
```

## License

MIT
