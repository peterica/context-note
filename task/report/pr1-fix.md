# PR1 Fix — Codex No-Go 대응

- Branch: `feature/pr1-zone-skeleton`
- Trigger: Codex 리뷰 결과 No-Go (merge blocker 3건)
- Reference: `task/order/task2_codex_review.md`, `task/report/pr1-zone-skeleton_claude_result.md`

---

## 수정 파일 목록

1. `dev/src/lib/notePath.ts` — safePath path-separator 검증, ZoneViolationError 위치 정리
2. `dev/src/app/api/file/route.ts` — PUT 분기(기존/신규), GET·DELETE traversal 응답 정리
3. `dev/src/app/api/folder/route.ts` — DELETE traversal 응답 정리
4. `dev/src/components/Editor/LandingGuide.tsx` — 가이드 경로 fallback chain, New File 기본 zone

---

## Blocker별 수정 내용

### Blocker 1 — `PUT /api/file` zone 검증

**문제**: 기존 `PUT`이 `safePath`만 통과하면 임의 경로에 파일을 만들 수 있어, zone validation을 POST에만 강제한 의미가 무력화됨.

**수정** (`dev/src/app/api/file/route.ts:34-65`)
- 저장 직전에 `fs.stat`으로 대상 존재 여부 확인.
- **존재하는 경우**: `safePath` 결과 그대로 사용 → legacy 루트 파일/zone 내 파일의 저장 회귀 0.
- **미존재인 경우**: `assertWriteablePath`로 zone prefix 강제 (legacy 호환은 `assertWriteablePath` 내부 규칙 그대로). 위반 시 `ZoneViolationError` → `400`.
- 신규 생성 경로의 부모 디렉터리는 `mkdir({recursive:true})`로 생성.

**대표 흐름**
- `PUT path=_atlas-guide.md` (legacy 루트 파일, 존재) → 200, 호환 저장.
- `PUT path=inbox/new.md` (신규) → assertWriteablePath 통과, 200.
- `PUT path=evil/foo.md` (신규, zone 외) → 400 `Path must start with one of: inbox/, wiki/, sources/, system/`.

---

### Blocker 2 — `LandingGuide` root path 하드코딩

**문제**: `_atlas-guide.md`가 root에 있다는 가정과 `addFile('', 'untitled')`의 root 생성이 PR1의 zone 정책과 충돌. PR2.5에서 atlas-guide가 zone으로 이동하면 silent 404로 깨짐.

**수정** (`dev/src/components/Editor/LandingGuide.tsx:6-42`)
- 가이드 경로를 단일 상수 배열 `ATLAS_GUIDE_PATHS = ['system/atlas-guide.md', '_atlas-guide.md']`로 분리. 첫 hit 채택, 둘 다 없으면 Guide 버튼 클릭은 no-op.
- `system/atlas-guide.md` 우선 → PR2.5에서 system zone으로 이동되면 LandingGuide 추가 변경 없이 자동 정합. legacy 루트는 fallback.
- `New File` 기본 zone을 상수 `DEFAULT_NEW_FILE_ZONE = 'inbox'`로 고정. `addFile(DEFAULT_NEW_FILE_ZONE, 'untitled')` → POST는 assertWriteablePath 통과.
- 외부 UI(버튼, 레이아웃, 텍스트, 클래스)는 변경하지 않음. 핸들러 내부 동작만 zone-aware로 교체.

**대표 흐름**
- 마운트: `system/atlas-guide.md` 없음 → `_atlas-guide.md` 시도 → 200(빈 파일이라 sections 미렌더, guidePath만 보존).
- New File 클릭 → `inbox/untitled.md` POST → 200.
- Guide 클릭 → guidePath 있으면 selectFile, 없으면 no-op (UI 디자인 변동 없음).

---

### Blocker 3 — `safePath()` traversal 방어

**문제**: `resolved.startsWith(NOTE_ROOT)`는 문자열 prefix 검사라 형제 디렉터리 우회 가능. 예: `NOTE_ROOT=/notes/main`에 `../main_evil/x.md`를 주면 `/notes/main_evil/x.md`로 resolve되고 `'/notes/main'`으로 시작하므로 통과.

**수정** (`dev/src/lib/notePath.ts:20-32`)
- 검증 기준을 path separator 경계로 변경: `resolved === NOTE_ROOT || resolved.startsWith(NOTE_ROOT + path.sep)`.
- 실패 시 `Error` 대신 `ZoneViolationError(status=400)` throw → 모든 write 핸들러에서 일관되게 400 반환.
- `ZoneViolationError` 클래스 선언을 `safePath` 위로 이동(가독성).
- `assertWriteablePath`에서 중복 wrap try/catch 제거(이제 safePath가 직접 ZoneViolationError 던짐).

**전파**
- `PUT/POST/DELETE /api/file`, `POST/DELETE /api/folder`, `PUT /api/rename` — 모두 `ZoneViolationError`를 catch해 400으로 응답.
- `GET /api/file`도 traversal에 한해 400 분기 추가(기존엔 무조건 404). 일반 read miss는 여전히 404.

---

## 재실행 테스트 결과

### 정적 검사
- `npm run lint` → 통과 (warnings 없음).
- `npx tsc --noEmit` → 1건 (`Toolbar.tsx:27` `toggleBulletList` not on `ChainedCommands`). PR1 이전부터 존재(`Initial commit`), 이번 PR과 무관 — DoD "사전 존재 오류 제외" 조건 부합.

### safePath 단위 케이스 (Node REPL, NOTE_ROOT=`/notes/main`)
| input | 기대 | 결과 |
|---|---|---|
| `inbox/foo.md` | PASS | PASS → `/notes/main/inbox/foo.md` |
| `''` (NOTE_ROOT 자체) | PASS | PASS → `/notes/main` |
| `../main_evil/x.md` | BLOCK | BLOCK ✓ (이전 prefix 검사 우회 케이스) |
| `../../etc/passwd` | BLOCK | BLOCK |
| `inbox/../../main_evil` | BLOCK | BLOCK |
| `inbox/../wiki/safe.md` | PASS | PASS → `/notes/main/wiki/safe.md` |
| `/abs/path` | BLOCK | BLOCK |

### 수동 회귀 (계획)
`task/report/pr1-checklist.md` §A·§B·§C·§D·§E·§F는 사용자 직접 검증 영역. 본 fix는 §A(legacy 저장), §B(신규 zone 강제), §F(traversal/zone 위반 400)에 직접 영향. 사용자 재검증 권장.

---

## 남은 리스크

1. **Atlas guide의 system zone 경로는 forward-looking 추정**.
   현재 `system/atlas-guide.md`는 존재하지 않고 PR2.5에서 도입 예정. 만약 PR2.5에서 다른 경로(`wiki/`나 다른 파일명)로 결정되면 `ATLAS_GUIDE_PATHS` 상수 1줄 수정 필요. fallback 체인이 이미 legacy 경로를 포함하므로 silent breakage는 발생하지 않음.

2. **`PUT` 분기의 TOCTOU**.
   `fs.stat` → `fs.writeFile` 사이에 외부 프로세스가 파일을 만들면 zone 검증 없이 write 가능. 단일 사용자 personal wiki 전제이고 race 시점에도 `safePath` 보호는 유지되므로 허용 가능 수준.

3. **`PUT` 신규 생성 경로의 EEXIST/EACCES 등 세부 응답 미세 분리 없음**.
   POST는 EEXIST → 409로 분리하지만 PUT 신규 분기는 단일 500/400만 반환. 클라이언트 흐름은 POST 후 PUT이라 실제 trigger 빈도는 낮음 — 별도 PR로 정밀화 가능.

4. **DELETE의 빈 부모 디렉터리 정리 정책**.
   `DELETE /api/file`이 zone 디렉터리(예: `inbox/`)까지 비면 삭제할 수 있음. 본 PR에서는 손대지 않음(기존 동작 유지). zone 디렉터리 보존 정책은 별도 결정 사안.

5. **Guide 버튼이 항상 표시되는 상태**.
   guidePath가 null일 때 클릭은 no-op. UI 디자인 변경 금지 조건상 disabled 표시는 추가하지 않음. 보다 친절한 표시는 후속 UI PR에서 처리 권장.

---

## 다음 단계 제안

- 사용자: `pr1-checklist.md` §A·§B·§F 재검증 → 통과 시 Codex 재리뷰 요청.
- Codex: 본 fix 차원에서 3 blocker 해소되었는지 재판단.
- 머지 결정 후 `task/task_plan.md` 상태 갱신.
