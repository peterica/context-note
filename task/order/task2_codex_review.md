# Task2 — 설계 검증 (Codex 실행 프롬프트)

이 파일은 Codex 실행 트리거이다.  
이 파일을 기준으로 즉시 Task2를 수행한다.

---

## 실행 명령

Task2: 설계 검증 (Codex)를 실행해라.

---

## 목표

PR1 (Zone Skeleton)이 안정적으로 Merge 가능한 상태인지 판단한다.

---

## 입력

- PR1 변경 diff
- task/report/pr1-zone-skeleton_claude_result.md
- task/action_log.md
- task/task_plan.md (현재 상태 기준)

---

## 중요 조건

- task_plan.md의 현재 상태를 기준으로 판단한다.
- 현재 상태: PR1 구현 완료 → Codex REVIEW 대기
- 이 Task의 결과로 다음 단계 진행 가능 여부를 결정한다.

---

## 검증 항목

1. fallback(read) + validation(write) 충돌 여부
2. legacy root 파일 처리 정책 일관성
3. zone validation 누락된 API 존재 여부
4. traversal 방어 우회 가능성
5. API backward compatibility 유지 여부

---

## 추가 확인

- tree API가 UI를 깨지 않는가
- id 기반 참조가 유지되는가

---

## 출력 형식 (필수)

- Go / No-Go
- 주요 리스크 TOP 3
- 설계 모순 여부
- 반드시 수정해야 할 항목
- PR1 merge 가능 여부
- task_plan.md 상태를 다음 단계로 변경 가능한지 판단

---

## 실행 규칙

- 코드 수정 금지
- 구현 제안 최소화
- 검증 및 판단에 집중
- diff 기반으로 리뷰 수행

---

## 완료 조건

- 위 출력 형식을 모두 채운 결과를 생성하면 완료