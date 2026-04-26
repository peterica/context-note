# Context Note — Inbox → Wiki MVP PR Plan

전체 PR 로드맵. 각 PR은 독립 머지 가능한 단위로 분해되어 있다.

- 출발점: 현 `context-note`는 단일 평면 `note/` 트리에 Markdown을 저장하는 웹 위키.
- 목표: LLM-WIKI 방식의 “Inbox → Wiki 자동 정리” 기능을 작은 PR들로 추가하되, 기존 편집/저장 흐름의 회귀를 0으로 유지한다.
- 제약: MVP 범위 한정, 자동 정리는 diff 승인 방식 강제, 물리 마이그레이션과 LLM 호출은 분리된 PR에 격리.

---

## PR 로드맵

| PR | 제목 | 핵심 결과물 | 의존 |
|----|------|-------------|------|
| PR1 | Zone 골격 + 호환 레이어 | `inbox/wiki/sources/system` 4-zone 도입, 트리 API/쓰기 API에 zone 강제, legacy 가상 매핑 | — |
| PR2 | Inbox 빠른 생성 | CommandPalette `New Inbox Note`, `inbox/{yyyy-mm-dd-HHmm}.md`, frontmatter `status: inbox` | PR1 |
| PR2.5 | Legacy 마이그레이션 | `note/*` → `note/wiki/*` 1회 이동(dry-run·롤백 포함), `WIKI_VIRTUAL_FALLBACK=false` | PR1 |
| PR3 | Organize 제안 API (스텁) | `POST /api/organize` — 결정론적 더미 플랜(`{action, target, diff}`) 반환, LLM 미연결 | PR1 |
| PR4 | Diff 승인 UI + apply | `OrganizePanel`, `POST /api/organize/apply`(원본 보존), 인덱스 후처리 | PR3 |
| PR5 | LLM 연결 | organize 라우트 내부 LLM 호출, system prompt는 `system/`에서 로드 | PR4 |
| PR6 | Sources/System 운영 규칙 | sources 읽기 위주, system 잠금 표시, 권한 정책 | PR1 |

PR2와 PR2.5는 병렬 가능. PR3~PR5는 직렬.

---

## 공통 원칙

- 각 PR은 한 가지 목적만 가진다.
- 커밋은 git diff 추적 가능한 작은 단위로 나눈다 (`chore:`, `feat:`, `fix:`, `test:`, `docs:` 접두사).
- 서버 검증은 항상 단일 진실 소스(`zones.ts`, `notePath.ts`)를 통과한다.
- 쓰기 경로는 zone 검증을 강제, 읽기 경로는 호환 허용(legacy 보존).
- diff 승인 흐름은 PR4 이후에만 활성화하며, apply는 원본 보존을 기본 정책으로 한다.

## 회귀 방지 정책

- 기존 파일 id는 PR1 호환 모드에서 prefix 없이 보존한다 → wikilink/backlink/recent files 회귀 0.
- 물리 마이그레이션은 PR2.5에서 분리 처리하며, dry-run + 롤백 스크립트를 동반한다.
- UI 디자인은 PR1~PR2.5 동안 동결한다.

## 산출물 위치

- PR 범위 정의: `task/<pr-name>.md` (예: `task/pr1-zone-skeleton.md`)
- 구현 결과: `task/report/<branch>_claude_result.md`
- Codex 리뷰: `task/report/<pr-name>-review.md`
- 수정 결과: `task/report/<pr-name>-fix.md`
- 회귀 체크리스트: `task/report/<pr-name>-checklist.md`
