# PR1 Implementation Result — `feature/pr1-zone-skeleton`

- Branch: `feature/pr1-zone-skeleton`
- Worker: Claude
- Date: 2026-04-26
- Reference: `task/plan.md`, `task/pr1-zone-skeleton.md`, `task/report/task3.md`

This is the DoD report for PR1. Manual UI checklist sign-off is captured separately in `task/report/pr1-checklist.md`.

---

## 1. Outcome Summary

PR1 introduces the four-zone skeleton (`inbox`, `wiki`, `sources`, `system`) without moving any existing files. Legacy entries appear under `wiki` via a virtual mapping while preserving their original ids, so wikilinks, backlinks, recent files, and `selectedFileId` keep resolving. The write-side enforces the zone prefix on creation and rename targets; reads and saves on legacy paths remain compatible. Traversal and zone violations now return `400` with a clear hint.

## 2. Commit History (this branch over `main`)

```
86f64e2 test: add manual regression checklist
1a245ef feat: add legacy wiki fallback mapping
d0ccf84 feat: expose zone roots in tree api
a696778 chore: add zone constants
```

(`docs: add pr1 implementation report` — final commit, includes this file.)

## 3. Files Changed

신규
- `dev/src/lib/zones.ts`
- `task/plan.md` (rewritten as a structured PR roadmap)
- `task/pr1-zone-skeleton.md`
- `task/report/pr1-checklist.md`
- `task/report/pr1-zone-skeleton_claude_result.md` (this file)

수정
- `dev/src/lib/notePath.ts`
- `dev/src/app/api/tree/route.ts`
- `dev/src/app/api/file/route.ts`
- `dev/src/app/api/folder/route.ts`
- `dev/src/app/api/rename/route.ts`
- `dev/src/store/useStore.ts`
- `.gitignore` (override global `task` ignore for explicit PR docs only)

미변경 (의도)
- `dev/src/components/FileTree/*` — 다중 루트는 기존 컴포넌트가 자연 지원, 디자인 동결.
- `dev/src/components/CommandPalette/*` — 새 명령은 PR2 범위.
- `note/` 파일시스템 — 물리 이동 없음.

## 4. Verification Results

### 4.1 Static checks

- `npm run lint` → 통과.
- `npx tsc --noEmit` → PR1 변경분 클린. 기존 오류 1건(`dev/src/components/Editor/Toolbar.tsx:27` `toggleBulletList` — TipTap chained command 타입) 사전 존재, 본 PR 무관.

### 4.2 Tree API contract (`GET /api/tree`)

dev 서버 기동 후 `curl` 검증:

- 루트 4개 정확히, 순서 `inbox → wiki → sources → system`. ✓
- 빈 zone은 `children: []`. ✓
- Legacy 항목(`_atlas-guide.md`, `context-os/`, `examples/`, `getting-started/`, `rag-platform/`)이 `wiki` 자식으로 노출. ✓
- Legacy id는 prefix 없이 원본 그대로 유지. ✓

### 4.3 Write-side zone enforcement (curl)

| # | 시나리오 | 기대 | 실측 |
|---|---------|------|------|
| 1 | `POST /api/file {path:'foo.md'}` | 400 | 400 ✓ — `Path must start with one of: inbox/, wiki/, sources/, system/` |
| 2 | `POST /api/file {path:'wiki/__pr1_test.md'}` | 200 | 200 ✓ |
| 3 | `POST /api/folder {path:'badroot'}` | 400 | 400 ✓ |
| 4 | `POST /api/folder {path:'inbox/__pr1_test_dir'}` | 200 | 200 ✓ |
| 5 | `PUT /api/rename {to:'foo.md'}` | 400 | 400 ✓ |
| 6 | `PUT /api/rename {to:'wiki/...'}` | 200 | 200 ✓ |
| 7 | `POST /api/file {path:'../etc/passwd'}` (traversal) | 400, 차단 | 400 ✓, 파일 미생성 |
| 8 | `PUT /api/file {path:'_atlas-guide.md', content}` (legacy save) | 200 | 200 ✓ |

테스트 산출물(`wiki/__pr1_test_renamed.md`, `inbox/__pr1_test_dir`)은 모두 정리 완료. `note/` 변경 없음(첫 사용으로 생긴 빈 `inbox/` 디렉터리는 git 추적 대상 아님).

### 4.4 Manual UI checklist

`task/report/pr1-checklist.md` §C–§F 항목은 사용자 직접 검증 필요. 본 작업자는 코드 변경과 API 계약 검증까지 수행.

## 5. Known Limitations / Follow-ups

1. **Legacy root snapshot blocked** — `_atlas-guide.md` 같은 NOTE_ROOT 직속 legacy 파일을 스냅샷하면 산출물이 root에 떨어져 zone 검증에 막힘. legacy 폴더 내 파일은 정상. PR2.5 (legacy → wiki 마이그레이션) 후 자연 해소.
2. **No client toast for zone violation** — 서버는 400 + 메시지 반환하지만 클라이언트는 표면화 안 함. 별도 작은 PR로 분리.
3. **Empty zone directories materialize on first use** — 첫 사용 시 `note/<zone>/`이 자동 생성. 빈 dir은 git 추적 대상 아님.

## 6. DoD Checklist

- [x] 5개 커밋(이 PR) git 히스토리에 순서대로 기록
- [x] `zones.ts` 신규 + `assertWriteablePath` 도입
- [x] `/api/tree` 4-zone 루트 + legacy `wiki` 가상 노출 (id 보존)
- [x] `/api/file`, `/api/folder`, `/api/rename` 쓰기 경로 zone 강제 + legacy 호환
- [x] traversal/zone 위반 400 + 메시지
- [x] lint 통과 / 신규 타입 오류 없음
- [ ] §4.4 수동 회귀 항목 사용자 sign-off (브라우저 검증)
- [x] `note/` 물리 이동 미발생
- [x] UI 디자인 비변경
- [x] `pr1-zone-skeleton_claude_result.md` 작성

## 7. Next Actions

1. 사용자: `pr1-checklist.md`의 UI 항목 sign-off.
2. Codex 리뷰 → 결과는 `task/report/pr1-review.md`에 기록.
3. 수정사항 발생 시 `task/report/pr1-fix.md`에 기록.
4. 머지 가능 판정 후 PR2 또는 PR2.5 우선순위 결정.
