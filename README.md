# Context Note

구조화된 Markdown 노트를 파일 트리 기준으로 관리하는 로컬 위키입니다.

LLM 대화, 설계 메모, 작업 기록처럼 문맥이 길어지는 내용을 `note/` 아래 파일과 폴더로 나눠 관리할 수 있습니다. 왼쪽에서는 트리를 탐색하고, 오른쪽에서는 바로 편집하거나 Preview로 렌더링 결과를 확인합니다.

![Main](images/main.png)

## 실행 방법

### 1. Docker로 실행

가장 간단한 실행 방법입니다.

```bash
./start.sh
```

또는 직접 실행해도 됩니다.

```bash
docker compose up -d --build
```

접속 주소:

- `http://localhost:8080`

중지:

```bash
./stop.sh
```

주의:

- `start.sh`는 마지막에 `open http://localhost:8080`를 호출합니다. macOS 기준입니다.

### 2. 로컬 개발 서버로 실행

프론트엔드 개발이나 UI 수정이 목적이면 이 방식이 편합니다.

```bash
cd dev
npm install
npm run dev
```

접속 주소:

- `http://localhost:3000`

로컬 개발 모드에서는 기본적으로 저장소 루트의 `note/` 디렉터리를 사용합니다.

## 기본 사용 흐름

1. 왼쪽 파일 트리에서 폴더를 펼치고 문서를 선택합니다.
2. 파일이 없으면 폴더 hover 상태에서 새 파일 또는 새 폴더를 만듭니다.
3. 편집 화면에서 바로 Markdown을 수정합니다.
4. 입력 후 약 1초 뒤 자동 저장됩니다.
5. 상단의 `Editor` / `Preview` 전환으로 원문과 렌더링 결과를 확인합니다.

## 주요 기능

### 파일 트리

- 폴더 펼치기/접기
- 파일 선택
- 파일/폴더 생성
- 이름 변경
- 삭제
- 드래그 앤 드롭 이동
- 파일 스냅샷 생성 (`*_v1.md`, `*_v2.md` 형식)
- 이름 필터 검색

### 에디터

- Markdown 직접 편집
- 자동 저장
- 툴바로 자주 쓰는 블록 삽입
- `/` 입력 시 슬래시 메뉴 표시
- Preview 렌더링
- 문서 하단 저장 상태 표시
- `[[wikilink]]` 렌더링 및 미리보기 클릭 이동
- Backlink 패널

### 빠른 열기

- `Cmd+K` 또는 `Ctrl+K`
- 최근 파일 목록 표시
- 파일명 퍼지 검색
- 키보드로 바로 이동

## 단축키

- `Cmd+K` / `Ctrl+K`: Quick Open
- `Cmd+B` / `Ctrl+B`: Bold
- `Cmd+I` / `Ctrl+I`: Italic
- `Cmd+Shift+H` / `Ctrl+Shift+H`: H2 heading
- `Tab`: 들여쓰기
- `/`: 슬래시 메뉴

## 저장 위치

문서는 데이터베이스가 아니라 실제 파일로 저장됩니다.

```text
note/
├── getting-started/
├── examples/
├── context-os/
└── rag-platform/
```

- Docker 실행 시: `./note`가 컨테이너의 `/data/note`에 마운트됩니다.
- 로컬 개발 시: 루트의 `note/`를 직접 사용합니다.
- API는 `NOTE_ROOT` 환경 변수를 우선 사용합니다.

## 프로젝트 구조

```text
context-note-docker/
├── docker-compose.yml
├── start.sh
├── stop.sh
├── note/                  # 실제 문서 저장소
├── images/                # README 이미지
└── dev/                   # Next.js 앱
    ├── src/app/
    │   ├── page.tsx
    │   └── api/
    │       ├── tree/
    │       ├── file/
    │       ├── folder/
    │       └── rename/
    ├── src/components/
    │   ├── FileTree/
    │   ├── Editor/
    │   └── CommandPalette/
    ├── src/store/
    └── src/lib/
```

## 개발 메모

자주 쓰는 명령:

```bash
cd dev
npm run lint
npm run build
```

현재 빌드는 환경에 따라 Google Fonts(`Geist`, `Geist Mono`) 네트워크 접근이 막히면 실패할 수 있습니다.

## 스크린샷

### Editor

![Editor](images/Editor.png)

### Preview

![Preview](images/Preview.png)
