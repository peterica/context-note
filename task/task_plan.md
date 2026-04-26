# Context Note — Task Plan (Execution Board)

실제 진행 상태를 추적하는 실행 보드.  
모든 작업은 여기서 상태를 갱신한 후 다음 단계로 이동한다.

---

## 상태 정의

- ⬜ TODO: 시작 전
- 🟡 IN PROGRESS: 현재 작업 중 (동시 작업 금지)
- 🔍 REVIEW: Codex 검증 대기
- 🔧 FIX: 수정 진행 중
- ✅ DONE: 완료 (merge 가능 상태)
- ⛔ BLOCKED: 외부 의존 또는 오류

---

## PR1 — Zone Skeleton

| Task | 담당 | 상태 | 비고 |
|------|------|------|------|
| Task1: 구조 분석 (Claude) | Claude | ✅ DONE | 완료 보고서 있음 |
| Task2: 설계 검증 (Codex) | Codex | ✅ DONE | No-Go 리뷰 완료, fix로 해소 |
| Task3: 실행 계획 (auto-works) | auto-works | ✅ DONE | 완료 |
| PR1 구현 | Claude | ✅ DONE | 완료 |
| PR1 리뷰 | Codex | ✅ DONE | 재리뷰 Go |
| PR1 수정 | Claude | ✅ DONE | task/report/pr1-fix.md |
| PR1 Merge 결정 | User | 🟡 IN PROGRESS | 사용자 판단 대기 |

---

## PR2 — Inbox Flow

| Task | 담당 | 상태 | 비고 |
|------|------|------|------|
| Task1: 기능 설계 | Claude | ⬜ TODO | PR1 이후 |
| Task2: 검증 | Codex | ⬜ TODO | |
| Task3: 실행 계획 | auto-works | ⬜ TODO | |
| 구현 | Claude | ⬜ TODO | |
| 리뷰 | Codex | ⬜ TODO | |
| 수정 | Claude | ⬜ TODO | |
| Merge | User | ⬜ TODO | |

---

## 작업 규칙

1. 동시에 두 개 이상의 IN PROGRESS 금지
2. 다음 단계로 넘어가기 전 상태 업데이트 필수
3. REVIEW 상태 없이 DONE 금지
4. PR1 완료 전 PR2 시작 금지
5. BLOCKED 발생 시 원인 반드시 기록

---

## 현재 상태 요약

- 현재 작업: PR1 Merge 결정 (User)
- 다음 작업: PR2 Task1 (PR1 merge 후)
- 진행 조건: 사용자의 PR1 merge 판단