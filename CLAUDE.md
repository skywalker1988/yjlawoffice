# 프로젝트: 윤정 법률사무소 홈페이지

## 프로젝트 개요
윤정 법률사무소 공식 홈페이지. 사무소 소개, 변호사 프로필, 업무 분야, 상담 안내 등을 제공하며,
관리자용 문서 에디터 및 콘텐츠 관리 기능을 포함한 풀스택 웹 애플리케이션.
프론트엔드(Vite + React)와 백엔드(Express + SQLite)로 구성.

## 기술 스택

### 프론트엔드 (`frontend/`)
- **빌드**: Vite 6 + React 19
- **에디터**: TipTap v3 (ProseMirror 기반) + 커스텀 확장
- **스타일링**: Tailwind CSS v4 + 인라인 스타일
- **라우팅**: React Router v7
- **아이콘**: Lucide React + 유니코드/이모지
- **파일 처리**: docx (Word 생성), mammoth (Word 파싱), jsPDF + html2canvas (PDF)
- **기타**: marked (마크다운), react-leaflet (지도), file-saver

### 백엔드 (`backend/`)
- **서버**: Express 5
- **데이터베이스**: SQLite (better-sqlite3) + Drizzle ORM
- **검색**: FTS5 전문 검색 (한국어 unicode61 토크나이저)
- **파일 업로드**: Multer (메모리 스토리지, 50MB 제한)
- **PDF 파싱**: pdf-parse

## 디렉토리 구조
```
yjlaw/
├── CLAUDE.md
├── frontend/
│   ├── package.json
│   ├── vite.config.js          # dev proxy: /api/sb → localhost:5000
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx             # 라우터 (공개/에디터/관리자)
│   │   ├── index.css           # Tailwind + CSS 변수 (디자인 토큰)
│   │   ├── components/
│   │   │   ├── Layout.jsx      # 공개 페이지 레이아웃 (헤더/네비/푸터)
│   │   │   └── ui/             # 재사용 UI 컴포넌트 (Badge, Button, Card, Input, Select, Textarea)
│   │   ├── hooks/
│   │   │   └── useReveal.js    # 스크롤 애니메이션 훅
│   │   ├── pages/
│   │   │   ├── HomePage.jsx         # 대시보드 + 검색
│   │   │   ├── VaultPage.jsx        # 문서 보관소 (필터/페이지네이션/마크다운 업로드)
│   │   │   ├── DocumentDetailPage.jsx # 문서 상세 + Word 스타일 편집
│   │   │   ├── SearchPage.jsx       # FTS5 전문 검색
│   │   │   ├── GraphPage.jsx        # Canvas 지식 그래프
│   │   │   ├── TimelinePage.jsx     # SVG 타임라인
│   │   │   ├── HistoryPage.jsx      # 세계사 연표 + Leaflet 지도
│   │   │   ├── editor/
│   │   │   │   ├── EditorPage.jsx   # MS Word 스타일 에디터 (메인)
│   │   │   │   └── modules/         # 에디터 하위 모듈
│   │   │   │       ├── extensions.js       # TipTap 커스텀 확장 (FontSize, LineSpacing, Indent, ParagraphSpacing)
│   │   │   │       ├── constants.js        # 상수 (폰트, 크기, 여백, 용지, 색상, 특수문자)
│   │   │   │       ├── styles.js           # ProseMirror + Word UI CSS
│   │   │   │       ├── RibbonParts.jsx     # 리본 UI 프리미티브
│   │   │   │       ├── HomeTab.jsx         # 홈 탭 (클립보드, 글꼴, 단락, 스타일)
│   │   │   │       ├── InsertTab.jsx       # 삽입 탭 (표, 이미지, 링크, 특수문자)
│   │   │   │       ├── OtherTabs.jsx       # 디자인/레이아웃/참조/검토/보기 탭
│   │   │   │       ├── Dialogs.jsx         # 대화상자 (글꼴, 단락, 페이지설정, 링크, 표, 이미지, 찾기/바꾸기)
│   │   │   │       ├── FloatingToolbar.jsx # 텍스트 선택 시 미니 서식 도구
│   │   │   │       ├── BackstageView.jsx   # 파일 탭 (새로만들기, 열기, 저장, 내보내기)
│   │   │   │       ├── NavigationPane.jsx  # 문서 구조 탐색 창
│   │   │   │       ├── ContextMenu.jsx     # 우클릭 컨텍스트 메뉴
│   │   │   │       ├── CommentPanel.jsx    # 댓글/검토 패널
│   │   │   │       ├── comment-mark.js     # 댓글 하이라이트 Mark
│   │   │   │       ├── comment-store.js    # 댓글 상태 관리 (reducer)
│   │   │   │       ├── FootnoteArea.jsx    # 각주 영역
│   │   │   │       ├── footnote-extension.js # 각주 TipTap 확장
│   │   │   │       └── fileUtils.js        # 파일 I/O (docx/pdf/html 내보내기, docx 불러오기, 자동저장)
│   │   │   └── admin/
│   │   │       ├── AdminLayout.jsx   # 관리자 사이드바 레이아웃
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminDocuments.jsx
│   │   │       ├── AdminTags.jsx
│   │   │       └── AdminHistory.jsx
│   │   └── utils/
│   │       ├── api.js              # fetch 래퍼 (BASE: /api/sb)
│   │       ├── document-types.js   # 문서 유형 설정/라벨/색상
│   │       └── history-insights.js # 지식 그래프용 큐레이션 데이터
│   └── public/
│       └── favicon.svg
└── backend/
    ├── package.json
    ├── index.js                # Express 서버 진입점 (포트 5000)
    ├── db/
    │   ├── index.js            # SQLite 초기화, FTS5 설정, 검색 함수
    │   └── schema.js           # Drizzle ORM 스키마 (12 테이블)
    ├── lib/
    │   └── markdown-analyzer.js # 마크다운 자동 분석 (유형/키워드/태그 추출)
    ├── routes/
    │   ├── sb-documents.js     # 문서 CRUD + 파일 업로드 + 마크다운 분석
    │   ├── sb-tags.js          # 태그 관리
    │   ├── sb-categories.js    # 카테고리 관리
    │   ├── sb-collections.js   # 컬렉션 관리
    │   ├── sb-dashboard.js     # 대시보드 통계
    │   └── sb-history.js       # 세계사 이벤트 CRUD
    └── seed-*.js               # 시드 데이터 스크립트
```

## 라우트 구조
```
/                   → HomePage (대시보드)
/vault              → VaultPage (문서 보관소)
/vault/:id          → DocumentDetailPage (문서 상세/편집)
/search             → SearchPage (전문 검색)
/graph              → GraphPage (지식 그래프)
/timeline           → TimelinePage (문서 타임라인)
/history            → HistoryPage (세계사 연표+지도)
/editor             → EditorPage (Word 에디터, 독립 전체화면)
/editor/:id         → EditorPage (기존 문서 편집)
/admin/*            → 관리자 영역 (백엔드 인증, .env 참조)
  /admin            → AdminDashboard
  /admin/documents  → AdminDocuments
  /admin/tags       → AdminTags
  /admin/history    → AdminHistory
  /admin/editor     → EditorPage
  /admin/editor/:id → EditorPage
```

## API 엔드포인트 (백엔드)
모든 API는 `/api/sb/` 접두사. 응답 형식: `{ data, error, meta }`.

- `GET /api/sb/documents` — 목록 (쿼리: page, limit, document_type, status, importance, q)
- `GET /api/sb/documents/search` — FTS5 검색 (쿼리: q, limit)
- `GET /api/sb/documents/:id` — 상세 (태그/카테고리/컬렉션/하이라이트/관계 포함)
- `POST /api/sb/documents` — 생성
- `PATCH /api/sb/documents/:id` — 수정
- `DELETE /api/sb/documents/:id` — 삭제 (1차: archived, 2차: 영구삭제)
- `POST /api/sb/documents/upload` — 파일 업로드 (PDF/MD/TXT/HTML)
- `POST /api/sb/documents/upload-markdown` — 마크다운 업로드 + 자동 분석/문서 생성
- `GET/POST/PATCH/DELETE /api/sb/tags`
- `GET/POST/PATCH/DELETE /api/sb/categories`
- `GET/POST/GET/:id/PATCH/DELETE /api/sb/collections`
- `GET /api/sb/dashboard` — 대시보드 통계
- `GET/POST/GET/:id/PATCH/DELETE /api/sb/history` — 세계사 이벤트
- `GET /api/sb/history/stats` — 세계사 통계

## Word 에디터 기능 (EditorPage)

### 리본 메뉴 (8개 탭)
- **파일**: 백스테이지 뷰 (새로만들기, 열기, 저장, 내보내기, 인쇄, 정보)
- **홈**: 클립보드, 글꼴(12종, 16단계 크기), 단락(목록, 정렬, 줄간격, 들여쓰기), 스타일 갤러리(10종)
- **삽입**: 표 격자 선택(8x10), 이미지(URL/파일), 링크, 특수문자(7개 카테고리)
- **디자인**: 문서 테마, 배경색, 워터마크
- **레이아웃**: 여백 프리셋(4종), 방향, 용지 크기(4종), 단 나누기(1~3단)
- **참조**: 목차 생성, 각주/미주
- **검토**: 댓글 삽입/보기, 변경 추적 토글
- **보기**: 눈금자, 탐색 창, 확대/축소(25~500%)

### 에디터 코어
- A4 용지 레이아웃 (회색 배경 위 흰 용지, 여백 마커, 눈금자)
- TipTap 커스텀 확장: FontSize, LineSpacing, Indent, ParagraphSpacing
- 플로팅 툴바 (텍스트 선택 시 서식 도구)
- 댓글 시스템 (텍스트 마킹, 스레드, 해결)
- 각주 시스템 (인라인 참조 + 하단 영역)
- 자동 저장 (localStorage + 서버)

### 단축키 (Word 호환)
Ctrl+B/I/U (굵게/기울임/밑줄), Ctrl+Z/Y (실행취소/다시실행),
Ctrl+S (저장), Ctrl+F/H (찾기/바꾸기), Ctrl+K (링크),
Ctrl+D (글꼴 대화상자), Ctrl+P (인쇄), Tab/Shift+Tab (들여쓰기)

### 파일 I/O
- .docx 내보내기/불러오기
- .pdf 내보내기 (jsPDF + html2canvas)
- .html 내보내기
- 자동 저장 (localStorage 키: "word-editor-autosave")

## 데이터베이스 스키마 (SQLite)
12개 테이블: documents, tags, document_tags, categories, document_categories,
collections, document_collections, document_relations, highlights,
history_events, documents_fts (FTS5 가상 테이블) + FTS 동기화 트리거

## 개발 실행
```bash
# 백엔드 (포트 5000)
cd backend && npm install && node index.js

# 프론트엔드 (포트 5173, /api/sb·/uploads·/data → 5000 프록시)
cd frontend && npm install && npm run dev
```

## 코딩 규칙
- JavaScript (JSX) — TypeScript 미사용
- 함수형 컴포넌트 + React hooks
- 주석은 한국어로 작성
- API 응답은 항상 `{ data, error, meta }` 형식
- 프론트엔드 API 호출은 `utils/api.js` 래퍼 사용 권장
- 에디터 관련 로직은 `pages/editor/modules/` 내 모듈로 분리
- 기본 글꼴: 맑은 고딕 11pt

# 코드 작성 원칙

## 가독성 & 유지보수성 우선
- 모든 코드는 경력 3년차 주니어 개발자가 읽고 수정할 수 있어야 한다.
- "영리한(clever)" 코드보다 "명백한(obvious)" 코드를 작성한다.
- 하나의 함수는 하나의 일만 한다. 함수 길이는 30줄 이내를 목표로 한다.

## 네이밍
- 변수명, 함수명, 컴포넌트명은 역할이 즉시 드러나는 서술적 이름을 사용한다.
  - Bad: `d`, `tmp`, `handleIt`, `processData`
  - Good: `userLoginDate`, `filteredCaseList`, `handleFormSubmit`
- 한 프로젝트 안에서 네이밍 컨벤션을 통일한다 (camelCase / PascalCase 등).

## 파일 구조
- 하나의 파일에 하나의 관심사만 둔다.
- 파일 하나가 200줄을 넘으면 분리를 검토한다.
- 폴더 구조는 기능(feature) 단위로 정리한다.
  예시: /components, /hooks, /utils, /services, /types

## 주석 & 문서화
- 각 파일 상단에 해당 파일의 목적을 1-2줄로 설명하는 주석을 단다.
- 비즈니스 로직이 복잡한 부분에는 "왜(why)" 이렇게 했는지 주석을 단다.
- JSDoc 또는 TSDoc 형식으로 함수의 파라미터와 반환값을 문서화한다.
- 자명한 코드에는 주석을 달지 않는다.

## 패턴 일관성
- 동일한 문제에는 프로젝트 전체에서 동일한 패턴을 사용한다.
- 새로운 라이브러리나 패턴 도입 전에 기존 코드에서 이미 사용 중인
  방식이 있는지 확인한다.
- 상태관리, API 호출, 에러 처리 등의 패턴을 통일한다.

## 코드 변경 시 규칙
- 기존 코드를 수정할 때, 주변 코드의 스타일과 패턴을 따른다.
- 대규모 리팩토링은 기능 변경과 분리하여 별도 커밋으로 한다.
- 새 코드 작성 시 관련 기존 코드도 같은 수준으로 정리한다.

## 금지 사항
- 하드코딩된 매직넘버 사용 금지 → 상수(const)로 분리
- any 타입 남용 금지 (TypeScript 사용 시)
- console.log 디버깅 코드를 커밋에 포함하지 않는다
- 하나의 컴포넌트/함수에 3단계 이상 중첩(nesting) 금지

---

## 이미 만들어진 코드를 정리하고 싶다면

Claude Code에 이렇게 요청하세요:
```
현재 프로젝트의 코드를 리팩토링해줘. 목표는 다음과 같아:

1. 각 파일 상단에 파일의 목적을 설명하는 주석 추가
2. 복잡한 비즈니스 로직에 "왜 이렇게 했는지" 주석 추가
3. 의미 불명확한 변수명/함수명을 서술적 이름으로 변경
4. 200줄 넘는 파일은 논리적 단위로 분리
5. 반복되는 코드는 공통 유틸 함수로 추출
6. README.md에 프로젝트 구조와 각 폴더/파일의 역할 설명 추가

기능 변경은 하지 말고, 코드 구조와 가독성만 개선해.
기존에 동작하던 것이 리팩토링 후에도 동일하게 동작해야 해.
```

---

## 실무 팁

**개발자에게 넘기기 전 체크리스트도 요청할 수 있습니다:**
```
이 프로젝트를 외부 개발자에게 인수인계한다고 가정하고,
개발자 온보딩 문서를 만들어줘:
- 프로젝트 구조 설명
- 로컬 개발 환경 셋업 방법
- 주요 아키텍처 결정 사항과 그 이유
- 데이터 흐름 다이어그램
- 환경변수 설명
- 배포 프로세스
```
