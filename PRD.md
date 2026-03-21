# PRD.md

**Project: Context Note Wiki**
**Version: 2.0 (Structured Editor 기반)**

---

## 1. 개요

### 1.1 문제 정의

* LLM 대화는 길어질수록 가비지 컨텍스트가 누적됨
* 세션이 변경되면 컨텍스트가 단절됨
* 기존 노트는 “기록 중심”으로, 실행 가능한 상태를 유지하지 못함
* Markdown 직접 작성은 사용자 인지 부담이 큼

---

### 1.2 해결 목표

* 노트를 중심으로 사고를 구조화 (SSOT / MECE)
* 컨텍스트를 파일 단위로 분리 및 통제
* Structured Editor를 통해 사용자 입력 부담 최소화
* Atlas를 활용하여 노트 기반 LLM 분석 수행

---

### 1.3 한 줄 정의

> “실행 가능한 컨텍스트 상태를 관리하는 구조 기반 위키 시스템”

---

## 2. 핵심 컨셉

### 2.1 구조 정의

* 파일 트리 = 컨텍스트 구조
* 파일 = 컨텍스트 단위
* Editor = 구조 기반 입력 인터페이스
* Markdown = 내부 저장 포맷

---

### 2.2 역할 분리

| 영역        | 역할            |
| --------- | ------------- |
| Note Wiki | 컨텍스트 저장 및 구조화 |
| Atlas     | LLM 실행 및 분석   |
| User      | 구조 유지 및 의사결정  |

---

## 3. 사용자 시나리오

### 3.1 컨텍스트 생성

1. 주제 폴더 생성 (ex. rag-platform)
2. 하위 파일 생성 (design.md 등)
3. Template 기반 구조 자동 생성
4. 사용자 내용 입력

---

### 3.2 LLM 분석

1. 노트 열람
2. 특정 섹션 기준 질문
3. Atlas Side Chat으로 분석
4. 결과를 노트에 반영

---

### 3.3 상태 프리징

1. 중요한 시점에서 스냅샷 생성
2. 이후 작업은 스냅샷 기준 진행

---

## 4. 기능 요구사항 (MVP)

---

### 4.1 파일 트리 (좌측)

* 폴더/파일 구조 표시
* 파일 선택 시 에디터 로드
* 파일 생성 / 삭제

---

### 4.2 Structured Editor (중앙)

#### 정의

* WYSIWYG 기반 에디터 (TipTap)
* Markdown 직접 입력 금지

---

#### 기능

* 텍스트 입력 (문서 형태)
* Heading 자동 생성 (H2 기준)
* 리스트 입력
* Template 자동 삽입

---

#### Toolbar

* Init Template
* H2 (Section 생성)
* Bullet List

---

### 4.3 Template Injection

새 파일 생성 시 자동 삽입:

```
Problem
Design
Dev
Test
Decision
Next
```

(내부적으로 H2로 생성됨)

---

### 4.4 Markdown 변환

* Editor 내부 → HTML/JSON
* 저장 시 → Markdown 변환

목적:

* LLM 전달 최적화

---

### 4.5 스냅샷 (간단)

* 파일 복제 (v1, v2)
* 또는 Snapshot 섹션 생성

---

### 4.6 Atlas 연동 (간접)

* 별도 API 없음
* 페이지 자체를 Atlas에서 열어 Side Chat 활용

---

## 5. 비기능 요구사항

* 로컬 중심 저장
* 빠른 응답 속도
* 단순 구조 유지
* 확장 가능성 확보

---

## 6. 정보 구조 (IA)

```
/wiki
  ├── rag-platform/
  │     ├── design.md
  │     ├── dev.md
  │     ├── test.md
  │     └── decision.md
  │
  ├── oss-verification/
  │     ├── design.md
  │     └── decision.md
  │
  └── context-os/
        └── overview.md
```

---

## 7. UI 구조

```
[좌측] 파일 트리
[중앙] Structured Editor (TipTap)
```

(우측 LLM은 Atlas 사용)

---

## 8. Editor Strategy (핵심)

* 사용자는 Markdown을 직접 작성하지 않는다
* 구조(Heading)는 시스템이 생성한다
* 사용자는 “내용만 입력”한다

---

## 9. Content Constraint

* 모든 문서는 최소 1개 이상의 Section 포함
* Decision 섹션은 필수
* depth는 3단계 이하 유지
* 구조 없는 자유 텍스트 금지

---

## 10. 데이터 모델

```json
{
  "path": "rag-platform/design.md",
  "content": "## Problem\n...\n## Design\n..."
}
```

---

## 11. 기술 스택 (POC)

* Framework: Next.js
* Editor: TipTap
* 상태 관리: useState / Zustand
* 변환: Turndown (HTML → Markdown)
* 저장: JSON or local file

---

## 12. 범위 제외

* 실시간 협업 ❌
* 권한 관리 ❌
* 검색 ❌
* 자동 요약 ❌
* RAG 연동 ❌

---

## 13. 성공 기준 (POC)

* 파일 트리 기반 컨텍스트 구조 유지 가능
* Structured Editor로 입력 부담 감소
* Markdown 자동 생성 및 LLM 활용 가능
* 세션 변경 시에도 컨텍스트 재현 가능

---

## 14. 향후 확장

* 블록 단위 컨텍스트 선택
* RAG 플랫폼 연동
* TTL 기반 노트 관리
* 자동 스냅샷 생성
* 컨텍스트 주입 자동화

---

## 15. 핵심 원칙

1. 구조 > 내용
2. 컨텍스트 최소화
3. Decision 필수
4. Markdown은 내부 처리
5. LLM은 실행 엔진

---

## 최종 한 줄 정리

> “이 시스템은 문서를 쓰는 위키가 아니라,
> 컨텍스트를 설계하고 실행하는 구조 기반 사고 플랫폼이다.”