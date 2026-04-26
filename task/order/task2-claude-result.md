PR1 Fix 결과를 재검증해라.

목표:
이전 No-Go에서 지적된 merge blocker가 모두 해결되었는지 확인한다.

입력:

* PR1 fix diff
* task/report/pr1-fix.md
* 이전 Codex 리뷰 결과

집중 검증:

1. PUT /api/file

* 기존 파일 vs 신규 생성 분기가 명확한가
* zone 밖 신규 생성이 완전히 차단되는가

2. traversal 방어

* path separator 기반 검사로 우회가 불가능한가
* 모든 write 경로에서 400으로 일관되게 처리되는가

3. LandingGuide

* root path 하드코딩이 제거되었는가
* fallback chain이 안전하게 동작하는가

4. 구조 일관성

* zone 정책과 실제 구현이 일치하는가
* legacy 호환이 의도대로 유지되는가

출력:

* Go / No-Go
* 남은 리스크 (있다면)
* 추가 수정 필요 여부
* PR1 merge 가능 여부
* task_plan.md 상태를 DONE으로 변경 가능한지 판단
