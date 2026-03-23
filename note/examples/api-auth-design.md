## Problem

사용자 인증 API를 설계해야 한다. 세션 기반과 토큰 기반 중 선택이 필요하며, 모바일 클라이언트도 지원해야 한다.

## Design

- 인증 흐름: Login → Token 발급 → 요청마다 Token 검증
- Access Token (15분) + Refresh Token (7일) 이중 구조
- Refresh Token은 서버 DB에 저장하여 강제 만료 가능

## Dev

- JWT 라이브러리: jose (Edge Runtime 호환)
- Refresh Token 저장: Redis (TTL 자동 만료)
- 미들웨어에서 Token 검증 → 만료 시 401 반환

## Test

- Access Token 만료 후 Refresh로 갱신 성공 확인
- Refresh Token 강제 만료 후 재로그인 요구 확인
- 잘못된 Token 형식에 대한 400 응답 확인

## Decision

- 세션 기반 대신 JWT 토큰 기반을 선택한다
  - 근거: 모바일 클라이언트에서 쿠키 관리 복잡, 서버 스케일링 용이
  - 트레이드오프: Token 탈취 시 만료까지 무효화 어려움 → Refresh Token DB 저장으로 완화
- Refresh Token rotation 적용 (사용 시 새 토큰 발급)

## Next

- 로그아웃 시 Refresh Token 무효화 API 구현
- Rate limiting 적용 (로그인 시도 제한)
