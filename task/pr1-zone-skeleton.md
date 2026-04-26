# PR1 — Zone Skeleton + Compatibility Layer

- Branch: `feature/pr1-zone-skeleton`
- Reference: `task/plan.md`, `task/report/task1.md`, `task/report/task1_result.md`, `task/report/task3.md`

## Goal

논리적 4-zone 구조(`inbox`, `wiki`, `sources`, `system`)를 코드/트리 API/쓰기 API에 도입하되, 기존 `note/` 직속 파일/폴더는 물리 이동 없이 `wiki` 아래에 가상 매핑되도록 호환 레이어를 둔다. 기존 편집/저장/이름변경/이동/삭제/검색/백링크 흐름의 회귀 0을 보증한다.

## In Scope

1. Zone 단일 진실 소스 (`dev/src/lib/zones.ts`).
2. `/api/tree`가 4-zone 루트를 고정 순서(`inbox → wiki → sources → system`)로 반환.
3. `WIKI_VIRTUAL_FALLBACK=true` 일 때 `note/` 직속 비-zone 항목을 `wiki` 가상 자식으로 노출하고, **legacy id를 보존**한다.
4. 쓰기 API(`POST /api/file`, `POST /api/folder`, `PUT /api/rename`)에 zone prefix 강제 + legacy 호환 검증 (`assertWriteablePath`).
5. 트래버설/zone 위반은 `400`과 명확한 메시지로 응답.
6. 클라이언트 트리 초기 펼침 상태를 `inbox`, `wiki`로 보정.
7. 회귀 체크리스트(`task/report/pr1-checklist.md`).

## Out of Scope

- 기존 `note/` 파일의 물리 이동 (PR2.5에서 처리).
- LLM organize 기능 (PR3~PR5).
- diff apply 기능 (PR4).
- inbox 원본 삭제/이동 정책 (PR4).
- UI 디자인 개편 (PR2 이후).
- 새 명령(예: New Inbox Note) 추가 (PR2).

## Files Changed

신규
- `dev/src/lib/zones.ts`
- `task/report/pr1-checklist.md`
- `task/report/pr1-zone-skeleton_claude_result.md` (DoD 결과)
- `task/plan.md` (전체 PR 로드맵 정리)
- `task/pr1-zone-skeleton.md` (본 문서)

수정
- `dev/src/lib/notePath.ts` — `assertWriteablePath`, `ZoneViolationError`
- `dev/src/app/api/tree/route.ts` — 4-zone 루트 + legacy 호환 매핑
- `dev/src/app/api/file/route.ts` — POST에 zone 검증
- `dev/src/app/api/folder/route.ts` — POST에 zone 검증
- `dev/src/app/api/rename/route.ts` — `to`에 zone 검증
- `dev/src/store/useStore.ts` — `expandedFolders` 초기값
- `.gitignore` — task/ 하위 PR 문서 트래킹 허용

## Commit Sequence

1. `chore: add zone constants` — `zones.ts` 단독.
2. `feat: expose zone roots in tree api` — `tree/route.ts` 4-zone + `useStore.ts` 초기값.
3. `feat: add legacy wiki fallback mapping` — tree legacy 수집 + `assertWriteablePath` + 쓰기 라우트 zone 검증.
4. `test: add manual regression checklist` — `pr1-checklist.md` + `.gitignore` 오버라이드.
5. `docs: add pr1 implementation report` — `plan.md`, `pr1-zone-skeleton.md`, `pr1-zone-skeleton_claude_result.md`.

## Definition of Done

- [x] 5개 커밋이 git 히스토리에 순서대로 기록됨
- [x] `zones.ts` 도입 + `assertWriteablePath` 동작
- [x] `/api/tree`가 4-zone 루트 형태로 반환되며 legacy 항목이 wiki 아래에 id 보존된 채 노출
- [x] 쓰기 라우트가 zone prefix 강제 + legacy 호환
- [x] traversal/zone 위반은 400 + 메시지
- [x] `npm run lint` 통과 / 타입 회귀 없음(사전 존재 오류 제외)
- [ ] `pr1-checklist.md` §A·§B·§C·§D·§E·§F 사용자 직접 검증
- [x] `note/` 물리 이동 미발생
- [x] UI 디자인 비변경
- [x] 결과 보고서 `pr1-zone-skeleton_claude_result.md` 작성

## Known Limitations

- Legacy 루트 파일(`_atlas-guide.md`)의 스냅샷 산출물이 zone 외 경로로 떨어져 차단됨. PR2.5 머지 후 자연 해소.
- zone 위반 메시지의 UI 토스트 표면화 부재. 별도 작은 PR로 분리.

## Next

- PR2 (Inbox 빠른 생성) 또는 PR2.5 (legacy 마이그레이션) 중 우선순위 결정.
- Codex 리뷰는 `task/report/pr1-review.md`로 수령.
- 수정은 `task/report/pr1-fix.md`에 기록.
