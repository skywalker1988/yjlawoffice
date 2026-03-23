# 아키텍처 문서

## 전체 아키텍처 개요

```
┌─────────────────────────────────────────────────────┐
│                   프론트엔드 (Vite + React)           │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ 공개 페이지│  │ 에디터    │  │ 관리자 영역      │  │
│  │ (Layout) │  │(전체화면) │  │ (AdminLayout)    │  │
│  └────┬─────┘  └────┬─────┘  └───────┬──────────┘  │
│       │             │                │              │
│       └─────────────┴────────────────┘              │
│                     │                               │
│              utils/api.js (fetch 래퍼)               │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP (개발: Vite 프록시)
┌─────────────────────┴───────────────────────────────┐
│                   백엔드 (Express 5)                 │
│                                                     │
│  ┌────────────────────────────────────────────┐     │
│  │ routes/ (REST API)                         │     │
│  │  sb-documents, sb-tags, sb-categories,     │     │
│  │  sb-collections, sb-dashboard, sb-history  │     │
│  └────────────────────┬───────────────────────┘     │
│                       │                             │
│  ┌────────────────────┴───────────────────────┐     │
│  │ db/ (Drizzle ORM + better-sqlite3)         │     │
│  │  - 12개 테이블                               │     │
│  │  - FTS5 전문 검색 (unicode61 토크나이저)       │     │
│  └────────────────────────────────────────────┘     │
│                                                     │
│  ┌────────────────────────────────────────────┐     │
│  │ lib/markdown-analyzer.js                   │     │
│  │  - 마크다운 업로드 시 자동 분류/키워드 추출      │     │
│  └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
                      │
              ┌───────┴───────┐
              │ SQLite 파일    │
              │ (second-brain │
              │  .db)         │
              └───────────────┘
```

## 주요 데이터 흐름

### 1. 문서 조회 흐름
```
사용자 → VaultPage → api.get("/documents?...") → Express router
  → Drizzle ORM (documents + JOIN tags) → SQLite → 응답 { data, error, meta }
```

### 2. 전문 검색 흐름
```
사용자 입력 → 디바운스(500ms) → api.get("/documents/search?q=...")
  → searchFTSWithSnippet() → FTS5 가상 테이블 MATCH → 스니펫 + 하이라이트 반환
```

### 3. 마크다운 업로드 흐름
```
파일 드롭 → api.upload() → Multer(메모리) → markdown-analyzer.js
  ┌─ YAML frontmatter 파싱
  ├─ 문서 유형 자동 분류 (키워드 기반)
  ├─ 키워드/태그 추출
  └─ 요약 생성
  → documents 테이블 INSERT + 태그 자동 생성/연결 → 결과 반환
```

### 4. 에디터 자동저장 흐름
```
타이핑 → TipTap onUpdate → 디바운스(2초) → api.patch("/documents/:id")
  → documents 테이블 UPDATE (contentMarkdown)
  + localStorage 백업 (키: "word-editor-autosave")
```

### 5. 지식 그래프 데이터 흐름
```
페이지 로드 → api.get("/documents?limit=500") → 전체 문서 로드
  → 메타데이터 파싱 (JSON) → 엣지 계산 (국가+시간, 태그, 키워드 일치)
  → 물리 시뮬레이션 (척력, 스프링, 그룹 인력)
  → Canvas2D 렌더링 (requestAnimationFrame)
```

## 핵심 설계 결정 사항

### SQLite 선택 (vs PostgreSQL/MongoDB)
- **이유**: 단일 사용자/소규모 팀 용도. 별도 DB 서버 설치 불필요. 파일 하나로 백업/이동 가능.
- **트레이드오프**: 동시 쓰기 성능 제한. WAL 모드로 읽기 성능 최적화.

### FTS5 전문 검색 (vs Elasticsearch)
- **이유**: SQLite 내장 기능으로 추가 인프라 불필요. unicode61 토크나이저로 한국어 지원.
- **트레이드오프**: 형태소 분석 미지원 (음절 단위 매칭). 대규모 데이터에서 성능 한계.

### TipTap (vs Slate, Quill, Draft.js)
- **이유**: ProseMirror 기반으로 확장성 우수. 커스텀 Mark/Node 정의 용이. React 통합 안정적.
- **트레이드오프**: 번들 크기가 큼. 학습 곡선 존재.

### 인라인 스타일 + Tailwind 혼합 (vs CSS Modules)
- **이유**: 에디터 UI는 동적 스타일이 많아 인라인이 편리. 공개 페이지는 Tailwind로 일관성 유지.
- **트레이드오프**: 에디터 컴포넌트의 스타일 관리가 파편화될 수 있음.

### 단일 파일 컴포넌트 (DocumentDetailPage 등)
- **이유**: 문서 상세 페이지는 읽기 뷰 + 편집 뷰가 밀접하게 결합. 분리 시 상태 공유 복잡도 증가.
- **트레이드오프**: 파일 크기가 큼 (~2000줄). 향후 읽기/편집 모드를 완전 분리하면 개선 가능.

### API 응답 형식 `{ data, error, meta }`
- **이유**: 프론트엔드에서 일관된 에러 처리. `meta`로 페이지네이션 정보 전달.
- **패턴**: 성공 시 `{ data: {...}, error: null, meta: {...} }`, 실패 시 `{ data: null, error: "message", meta: null }`

## 외부 서비스 연동

| 서비스 | 용도 | 연동 방식 |
|--------|------|----------|
| Leaflet + OpenStreetMap | 세계사 지도 시각화 | CDN 타일 서버 (무료) |
| Google Fonts | Noto Sans/Serif KR 로딩 | CSS @import |
| Cloudflare CDN | Leaflet 아이콘 리소스 | 정적 URL |

로컬 SQLite 외에 외부 데이터베이스나 인증 서비스는 사용하지 않습니다.

## 새 기능 추가 가이드

### 새 문서 유형 추가
1. `frontend/src/utils/document-types.js` — `TYPE_CONFIG`에 `{ label, color }` 추가
2. `frontend/src/pages/editor/modules/constants.js` — `DOC_TYPES`에 `{ value, label }` 추가
3. 필요 시 `TYPE_NUMBERS`에 번호 매핑 추가

### 새 API 엔드포인트 추가
1. `backend/routes/` 에 라우트 파일 생성 또는 기존 파일에 핸들러 추가
2. `backend/index.js` 에 `app.use()` 등록
3. 응답 형식: `{ data, error, meta }` 준수
4. 프론트엔드에서는 `utils/api.js` 래퍼로 호출

### 새 페이지 추가
1. `frontend/src/pages/` 에 컴포넌트 파일 생성
2. `frontend/src/App.jsx` 에 라우트 추가
3. 공개 페이지: `<Layout>` 내부에 배치
4. 관리자 페이지: `/admin/*` 경로로 `<AdminLayout>` 내부에 배치

### 에디터 확장 추가
1. `frontend/src/pages/editor/modules/extensions.js` — TipTap 확장 정의
2. `EditorPage.jsx` 의 `useEditor` extensions 배열에 등록
3. 리본 UI: 해당 탭 모듈(HomeTab, InsertTab 등)에 버튼 추가
4. 상수: `modules/constants.js` 에 관련 설정 추가

### 데이터베이스 테이블 추가
1. `backend/db/schema.js` — Drizzle 스키마 정의
2. `backend/db/index.js` — `initTables()`에 CREATE TABLE SQL 추가
3. 필요 시 FTS5 동기화 트리거 추가
