## Problem

프론트엔드 상태 관리 라이브러리를 선택해야 한다. Redux, Zustand, Jotai 중 프로젝트 규모와 팀 역량에 맞는 도구가 필요하다.

## Design

평가 기준:
- 보일러플레이트 양
- 번들 사이즈
- 학습 곡선
- TypeScript 지원
- DevTools 지원

## Test

| 기준 | Redux Toolkit | Zustand | Jotai |
|------|:---:|:---:|:---:|
| 보일러플레이트 | 중간 | 최소 | 최소 |
| 번들 사이즈 | 11KB | 1.2KB | 2.4KB |
| 학습 곡선 | 높음 | 낮음 | 중간 |
| TypeScript | 우수 | 우수 | 우수 |
| DevTools | 우수 | 보통 | 보통 |

## Decision

- Zustand을 선택한다
  - 근거: 소규모 프로젝트에서 보일러플레이트 최소화가 핵심, 번들 사이즈 영향 최소
  - 트레이드오프: 대규모 상태에서 Redux 대비 구조화 부족 → 현재 규모에서는 문제 없음
- 전역 상태는 1개 store로 관리하되, slice 패턴으로 분리한다

## Next

- store 파일 구조 설계 (useStore.ts → slice별 분리)
- 비동기 상태는 React Query와 조합하여 처리
