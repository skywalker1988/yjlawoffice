# 테스트 커버리지 분석 보고서

## 현황

이 프로젝트는 현재 **테스트가 전혀 없습니다.** 테스트 프레임워크가 설치되어 있지 않고, 테스트 파일도 존재하지 않습니다.

- 백엔드 `package.json`: `"test": "echo \"Error: no test specified\" && exit 1"`
- 프론트엔드 `package.json`: 테스트 스크립트 없음

---

## 테스트 도입 우선순위

### Tier 1: 가장 시급 (높은 ROI)

#### 1. `backend/lib/markdown-analyzer.js` — 마크다운 자동 분석기
- **함수 11개**, 395줄, 순수 함수로 구성 → 테스트 용이성 최상
- **핵심 테스트 대상:**
  - `classifyDocumentType()`: 7개 문서 유형 분류 (법률 패턴 정규식, 가중치 점수 시스템)
  - `extractKeywords()`: 한국어 형태소 추출 + 불용어 필터링 + 빈도 기반 순위
  - `extractDate()`: 3가지 날짜 형식 파싱 (ISO, 한국어, DD-MM-YYYY)
  - `parseFrontmatter()`: YAML 프론트매터 파싱 (배열, 인용값 처리)
  - `generateSummary()`: 마크다운 제거 후 요약 생성
- **위험도**: 분류 오류 시 전체 문서 워크플로우에 영향
- **추천 테스트**: 각 문서 유형별 샘플 마크다운으로 분류 정확도 검증

#### 2. `backend/db/index.js` — FTS5 검색 및 쿼리 새니타이징
- **핵심 테스트 대상:**
  - `sanitizeFTSQuery()`: FTS5 인젝션 방지용 특수문자 제거 — **보안 관련**
  - `searchFTSWithSnippet()`: HTML 스니펫 생성 — **XSS 가능성 점검**
- **위험도**: 검색 인젝션 또는 XSS 취약점 가능

#### 3. `frontend/src/pages/editor/modules/comment-store.js` — 댓글 상태 관리
- **함수 14개**, 315줄, 순수 리듀서 → 테스트 용이성 최상
- **핵심 테스트 대상:**
  - `commentReducer()`: 15가지 액션 타입 (ADD/EDIT/DELETE/RESOLVE 등)
  - `getAllThreads()`, `getUnresolvedThreads()`, `getResolvedThreads()`: 필터링/정렬
  - `getNextComment()`, `getPrevComment()`: 순환 탐색 로직
  - `formatCommentDate()`: 날짜 포맷 ("오늘" 특수 케이스 포함)
- **참고**: `nextAuthorColor()`는 전역 상태(colorIndex)를 가져 테스트 순서 의존성 있음 → 리팩토링 권장

#### 4. `frontend/src/utils/api.js` — API 래퍼
- **함수 6개**, 32줄, fetch 래핑 → 테스트 용이성 우수
- **핵심 테스트 대상:**
  - 성공/실패 응답 처리, 네트워크 오류, JSON 파싱 오류
  - 각 HTTP 메서드(GET/POST/PATCH/PUT/DELETE) 동작 검증

---

### Tier 2: 중요

#### 5. `backend/routes/sb-documents.js` — 문서 CRUD + 업로드 (통합 테스트)
- **엔드포인트 8개**, 612줄, 가장 복잡한 라우트
- **핵심 테스트 대상:**
  - `POST /upload-markdown`: 다단계 워크플로우 (태그 생성 + 문서 생성 + 연결)
  - `POST /upload`: PDF/MD/TXT/HTML 파일 파싱 및 저장
  - `GET /`: 페이지네이션 + 필터 조합
  - `DELETE /`: 2단계 삭제 (archived → 영구삭제)
- **위험도**: 태그 동시 생성 시 레이스 컨디션, 부분 업로드 시 고아 파일
- **테스트 방식**: Supertest + SQLite in-memory DB

#### 6. `frontend/src/pages/editor/modules/fileUtils.js` — 파일 I/O 유틸
- **함수 9개**, 265줄
- **순수 함수 테스트 (우선):**
  - `isMarkdown()`: 마크다운 감지 정규식
  - `htmlToMarkdown()`: HTML→마크다운 변환
  - `parseInlineFormatting()`: 트리 워킹 + 텍스트 노드 처리
- **모킹 필요 함수:**
  - `exportDocx/Pdf`: 동적 임포트 + 라이브러리 모킹
  - `autoSaveToLocal/loadAutoSave/clearAutoSave`: localStorage 모킹

#### 7. 기타 백엔드 CRUD 라우트 (통합 테스트)
- `sb-tags.js`, `sb-categories.js`, `sb-collections.js`, `sb-history.js`
- 기본 CRUD 동작, 유니크 제약 조건, 삭제 시 cascade 검증

---

### Tier 3: 보완

#### 8. `frontend/src/pages/editor/modules/extensions.js` — TipTap 확장
- 922줄, 15개 이상 확장
- `applyToSelectedParagraphs()` 헬퍼 함수만 단위 테스트 가능
- 나머지는 TipTap 에디터 인스턴스 필요 → 통합 테스트

#### 9. `frontend/src/utils/document-types.js` — 문서 유형 유틸
- 소규모, 순수 함수 → 빠른 테스트 작성 가능
- `getTypeLabel()`, `getTypeColor()`: 알려진/미지 유형 처리

#### 10. `frontend/src/hooks/useReveal.js` — 스크롤 애니메이션 훅
- IntersectionObserver 모킹 필요 → 비용 대비 효과 낮음

---

## 발견된 주요 문제점

### 보안
1. **FTS5 인젝션**: `sanitizeFTSQuery()`가 모든 악의적 입력을 차단하는지 검증 필요
2. **XSS**: `searchFTSWithSnippet()`의 HTML 스니펫이 이스케이프되는지 확인 필요
3. **파일 업로드**: 50MB 제한 외 파일 타입 검증, 경로 트래버설 방지 확인 필요

### 데이터 무결성
4. **태그 동시 생성 레이스 컨디션**: `upload-markdown`에서 여러 태그를 순차 생성할 때 UNIQUE 위반 처리가 try-catch로만 되어 있음
5. **트랜잭션 부재**: 다단계 DB 작업(문서 생성 + 태그 연결 + 카테고리 연결)이 트랜잭션으로 묶이지 않음
6. **FTS 트리거 동기화**: DELETE/UPDATE/INSERT 트리거가 실패할 경우 검색 인덱스 불일치 가능

### 입력 검증
7. **날짜 검증 부실**: `sb-history.js`에서 day 1-31만 검사, 월별 일수 미검증
8. **스키마 검증 부재**: metadata가 JSON 문자열로 저장되지만 스키마 검증 없음
9. **중복 로직**: `stripMarkdown()`이 `sb-documents.js`와 `markdown-analyzer.js`에 각각 존재

---

## 추천 테스트 스택

### 백엔드
| 도구 | 용도 |
|------|------|
| **Vitest** | 테스트 러너 (ESM 지원, 빠른 속도) |
| **Supertest** | HTTP 엔드포인트 통합 테스트 |
| **SQLite in-memory** | 테스트용 격리 DB |
| **mock-fs** | 파일 시스템 모킹 |

### 프론트엔드
| 도구 | 용도 |
|------|------|
| **Vitest** | 테스트 러너 (Vite 네이티브 통합) |
| **React Testing Library** | 컴포넌트/훅 테스트 |
| **MSW (Mock Service Worker)** | API 모킹 |
| **jsdom** | DOM 환경 시뮬레이션 |

---

## 제안하는 초기 테스트 파일 구조

```
backend/
├── __tests__/
│   ├── markdown-analyzer.test.js    # Tier 1: 순수 함수 단위 테스트
│   ├── fts-query.test.js            # Tier 1: 검색 쿼리 새니타이징
│   ├── documents.integration.test.js # Tier 2: 문서 API 통합 테스트
│   ├── tags.integration.test.js     # Tier 2: 태그 CRUD
│   └── history.integration.test.js  # Tier 2: 세계사 이벤트 CRUD

frontend/
├── src/
│   ├── __tests__/
│   │   ├── api.test.js              # Tier 1: API 래퍼 단위 테스트
│   │   └── document-types.test.js   # Tier 3: 유틸 단위 테스트
│   └── pages/editor/modules/
│       └── __tests__/
│           ├── comment-store.test.js # Tier 1: 리듀서 단위 테스트
│           └── fileUtils.test.js    # Tier 2: 순수 함수 단위 테스트
```

---

## 다음 단계

1. Vitest 설치 및 설정 (백엔드 + 프론트엔드)
2. Tier 1 테스트 작성 (markdown-analyzer, sanitizeFTSQuery, comment-store, api)
3. CI 파이프라인에 테스트 단계 추가
4. Tier 2 통합 테스트 작성
5. 커버리지 리포트 설정 (목표: 핵심 비즈니스 로직 80%+)
