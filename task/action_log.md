# Action Log

`task/` 폴더의 작업 이력 맵. 각 task는 **branch · 작업 프롬프트 · 결과 보고서**를 매핑하여 관리한다.
신규 task 진행 시 이 파일에 한 줄 요약을 먼저 추가하고, 상세는 `task/`·`task/report/`의 개별 파일에 남긴다.

## 작성 규약

- task 단위: `branch명`, `prompt(또는 지시 문서)`, `결과 보고서`를 한 묶음으로 기록.
- 이 파일은 **맵(인덱스)** 역할만. 본문은 개별 파일에 둔다.
- 신규 PR은 `task/<pr-name>.md` (범위 고정), `task/report/<branch>_claude_result.md` (결과)를 짝지어 남긴다.
- 일자는 절대 날짜(YYYY-MM-DD) 사용.

---

## 이력

### Task1 — Inbox→Wiki 분석 및 최소 변경안 제안 (2026-04-26)

| 항목 | 위치 |
|------|------|
| Branch | `main` (분석 단계, 코드 변경 없음) |
| Prompt | `task/prompt.md` 상단 (LLM-WIKI Inbox→Wiki 분석 지시) |
| 결과 | `task/report/task1.md` |

요지: 기존 `note/` 평면 트리에 `inbox/wiki/sources/system` 4-zone 도입을 위한 최소 변경안 제안. 구현 보류, 구조 분석만.

---

### Task2 — Codex 교차 검증 (Go 조건부) (2026-04-26)

| 항목 | 위치 |
|------|------|
| Branch | `main` (검증 단계) |
| Prompt | Task1 결과를 Codex에 전달, 실행 가능성 검증 요청 |
| 결과 | `task/report/task1_result.md` |

요지: Task1 제안의 실현 가능성/리스크 검토. **Go 조건부** 판정 → PR1 실행 계획 수립으로 진행.

---

### Task3 — PR1 실행 계획 수립 (2026-04-26)

| 항목 | 위치 |
|------|------|
| Branch | `main` (계획 단계) |
| Prompt | `task/prompt.md` 본문 (Task3 지시) |
| 결과 | `task/report/task3.md`, 회귀 체크리스트 `task/report/task3_checklist.md` |

요지: PR1 범위(Step 1~7)를 “Zone 골격 + 호환 레이어”로 한정. 물리 이동/LLM/diff apply 전부 제외. 사용자 승인 후 PR1 착수.

---

### PR1 — Zone Skeleton + Compatibility Layer (2026-04-26)

| 항목 | 위치 |
|------|------|
| Branch | `feature/pr1-zone-skeleton` |
| 범위 정의 | `task/pr1-zone-skeleton.md` |
| Prompt | `task/prompt.md` 하단 (PR1 착수 지시 + 커밋 단위 고정) |
| 구현 결과 | `task/report/pr1-zone-skeleton_claude_result.md` |
| 회귀 체크리스트 | `task/report/pr1-checklist.md` |
| Codex 리뷰 | No-Go (3 blocker) → 본 fix 후 Go |
| 수정 기록 | `task/report/pr1-fix.md` |
| Codex 지시 프롬프트 | `task/order/task2_codex_review.md` |
| Codex 결과 | `task/order/task2-claude-result.md` |

커밋 시퀀스:
1. `a696778` chore: add zone constants
2. `d0ccf84` feat: expose zone roots in tree api
3. `1a245ef` feat: add legacy wiki fallback mapping
4. `86f64e2` test: add manual regression checklist
5. `57131c2` docs: add pr1 implementation report
6. `fix: enforce zone validation on PUT and harden traversal`
7. `docs: add pr1 fix report and update task tracking`

상태: Codex 재리뷰 Go, merge 진행.

---

## 전체 PR 로드맵

상세는 `task/plan.md`. 현재 위치는 **PR1 완료(검증 대기)**.

| PR | 제목 | 상태 |
|----|------|------|
| PR1 | Zone 골격 + 호환 레이어 | ✅ 구현 + fix 완료, merge 진행 |
| PR2 | Inbox 빠른 생성 | ⏳ 대기 |
| PR2.5 | Legacy 마이그레이션 | ⏳ 대기 (PR2와 병렬 가능) |
| PR3 | Organize 제안 API (스텁) | ⏳ 대기 |
| PR4 | Diff 승인 UI + apply | ⏳ 대기 |
| PR5 | LLM 연결 | ⏳ 대기 |
| PR6 | Sources/System 운영 규칙 | ⏳ 대기 |

---
