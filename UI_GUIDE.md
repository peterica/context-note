# UI_GUIDE.md

**Scope: File Tree + Structured Editor (TipTap 기반)**

---

## 1. 전체 레이아웃

```id="layout-v2"
┌──────────────┬────────────────────────────┐
│ 파일 트리     │   Structured Editor         │
│ (좌측, 240px) │   (중앙, Flexible)         │
└──────────────┴────────────────────────────┘
```

* 좌측: 고정 (240~280px)
* 중앙: 가변 (flex)
* 높이: 100vh
* 스크롤: 각 영역 독립

---

## 2. 좌측: 파일 트리 (Context Navigator)

### 2.1 역할

* 컨텍스트 구조 표현 (SSOT)
* 작업 단위 선택
* 주제 기반 탐색

---

### 2.2 UI 구조

```id="tree-ui"
/wiki
 ├── rag-platform
 │     ├── design.md
 │     ├── dev.md
 │     └── decision.md
 └── context-os
       └── overview.md
```

---

### 2.3 구성 요소

| 요소     | 설명      |
| ------ | ------- |
| Root   | `/wiki` |
| Folder | 주제 단위   |
| File   | 컨텍스트 단위 |

---

### 2.4 인터랙션

| 동작    | 결과                |
| ----- | ----------------- |
| 파일 클릭 | 에디터 로드            |
| 폴더 클릭 | expand / collapse |
| + 버튼  | 파일 생성             |
| 삭제 버튼 | 파일 삭제             |

---

### 2.5 상태 표현

* 선택된 파일: highlight (#2563eb)
* hover: 배경 강조
* 폴더: open / close icon

---

### 2.6 UX 원칙

> “파일 선택 = 컨텍스트 선택”

---

## 3. 중앙: Structured Editor (핵심)

---

## 3.1 역할

* 사고 구조 입력
* 컨텍스트 생성
* Markdown 자동 생성

---

## 3.2 UI 구성

```id="editor-ui"
[Toolbar]
--------------------
[Editor Content Area]
```

---

## 3.3 Toolbar 구성

| 버튼            | 기능             |
| ------------- | -------------- |
| Init Template | 기본 구조 생성       |
| + Section     | H2 추가          |
| List          | Bullet List 생성 |

---

### 3.3.1 Toolbar 예시

```id="toolbar"
[Init] [H2] [List]
```

---

## 3.4 Editor Content 구조

초기 상태:

```id="initial-content"
Problem
Design
Dev
Test
Decision
Next
```

실제 UI:

* 각 항목은 Section Block
* 제목 + 내용 영역

---

## 3.5 Section UI

```id="section-ui"
[Problem]
-----------------
(내용 입력 영역)

[Design]
-----------------
(내용 입력 영역)
```

---

### 특징

* Heading 자동 생성 (H2)
* 사용자는 텍스트만 입력
* Markdown 문법 노출 없음

---

## 3.6 입력 UX

| 행동     | 결과            |
| ------ | ------------- |
| 텍스트 입력 | Section 내부 작성 |
| Enter  | 줄 추가          |
| 버튼 클릭  | 구조 생성         |

---

## 3.7 구조 강제

* 최소 1개 Section 필요
* Decision Section 필수
* depth 3 이상 금지

---

## 4. 상태 흐름

```id="state-flow-v2"
파일 선택
  ↓
에디터 로드
  ↓
사용자 입력
  ↓
HTML/JSON 상태
  ↓
Markdown 변환
  ↓
저장
```

---

## 5. 데이터 처리

### 내부 상태

* TipTap JSON or HTML

### 저장

* Markdown 변환 후 저장

---

## 6. 스타일 가이드

---

### 6.1 색상

* Background: #0f172a (dark)
* Text: #e5e7eb
* Primary: #2563eb
* Border: #1f2937

---

### 6.2 폰트

* 기본: system-ui
* 코드: monospace

---

### 6.3 간격

* Sidebar padding: 8px
* Editor padding: 16px
* Section spacing: 24px

---

## 7. 컴포넌트 구조

```id="component"
App
 ├── Sidebar (FileTree)
 │     └── TreeNode
 └── Editor
       ├── Toolbar
       └── Content
```

---

## 8. UX 핵심 원칙

---

### 8.1 구조 우선

* 사용자는 “글”이 아니라 “구조”를 작성

---

### 8.2 Markdown 숨김

* 사용자에게 Markdown 노출 금지

---

### 8.3 컨텍스트 최소화

* 파일 단위로 컨텍스트 분리

---

### 8.4 빠른 진입

* 클릭 → 즉시 편집 가능

---

## 9. 금지 사항

* 자유 텍스트만 작성 ❌
* 구조 없는 문서 ❌
* 깊은 트리 구조 ❌

---

## 10. 한 줄 정의

> “파일 트리로 컨텍스트를 선택하고,
> 구조 기반 에디터로 사고를 작성한다”

---

## 11. POC 체크리스트

* [ ] 파일 트리 렌더링
* [ ] 파일 선택 시 로드
* [ ] Structured Editor 동작
* [ ] Template 생성 버튼
* [ ] Markdown 변환
* [ ] 저장

---

## 최종 정리

이 UI는 일반 노트 앱이 아니라:

> “컨텍스트를 선택하고 구조화하여 LLM에 전달하는 실행 인터페이스”
