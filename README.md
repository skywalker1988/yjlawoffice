# 윤정 법률사무소 지식 관리 플랫폼

법률 문서 관리, 지식 그래프, 세계사 타임라인, MS Word 스타일 에디터를 통합한 웹 플랫폼입니다.

## 기술 스택

### 프론트엔드
- **빌드**: Vite 6 + React 19
- **에디터**: TipTap v3 (ProseMirror 기반) + 커스텀 확장
- **스타일링**: Tailwind CSS v4 + 인라인 스타일
- **라우팅**: React Router v7
- **아이콘**: Lucide React
- **파일 처리**: docx (Word 생성), mammoth (Word 파싱), jsPDF + html2canvas (PDF)
- **지도**: React Leaflet
- **기타**: marked (마크다운), file-saver

### 백엔드
- **서버**: Express 5
- **데이터베이스**: SQLite (better-sqlite3) + Drizzle ORM
- **검색**: FTS5 전문 검색 (한국어 unicode61 토크나이저)
- **파일 업로드**: Multer (메모리 스토리지, 50MB 제한)
- **PDF 파싱**: pdf-parse

## 폴더 구조

```
yjlaw/
├── CLAUDE.md                    # AI 코딩 가이드 (프로젝트 규칙)
├── README.md                    # 이 파일
├── ARCHITECTURE.md              # 아키텍처 문서
│
├── frontend/                    # 프론트엔드 (Vite + React)
│   ├── src/
│   │   ├── main.jsx             # React 진입점
│   │   ├── App.jsx              # 라우터 설정
│   │   ├── index.css            # Tailwind + 글로벌 CSS 변수
│   │   │
│   │   ├── components/          # 재사용 UI 컴포넌트
│   │   │   ├── Layout.jsx       # 공개 페이지 레이아웃 (헤더/네비/푸터)
│   │   │   ├── Stars.jsx        # 별점 표시 컴포넌트
│   │   │   └── ui/              # 기본 UI 프리미티브
│   │   │       ├── Badge.jsx, Button.jsx, Card.jsx
│   │   │       ├── Input.jsx, Select.jsx, Textarea.jsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useReveal.js     # 스크롤 애니메이션 훅
│   │   │
│   │   ├── utils/               # 공통 유틸리티
│   │   │   ├── api.js           # fetch 래퍼 (REST 클라이언트)
│   │   │   ├── constants.js     # 전역 상수 (상태 라벨, 카테고리, 지역 등)
│   │   │   ├── format.js        # 포맷팅 함수 (parseAuthor 등)
│   │   │   ├── document-types.js # 문서 유형별 라벨/색상
│   │   │   └── history-insights.js # 지식 그래프 큐레이션 데이터
│   │   │
│   │   └── pages/               # 페이지 컴포넌트
│   │       ├── HomePage.jsx     # 대시보드 + 실시간 검색
│   │       ├── VaultPage.jsx    # 문서 보관소 (리스트/카드 뷰)
│   │       ├── DocumentDetailPage.jsx  # 문서 상세 + 인라인 편집
│   │       ├── SearchPage.jsx   # FTS5 전문 검색
│   │       ├── GraphPage.jsx    # Canvas2D 지식 그래프
│   │       ├── TimelinePage.jsx # SVG 문서 타임라인
│   │       ├── HistoryPage.jsx  # 세계사 연표 + Leaflet 지도
│   │       │
│   │       ├── editor/          # MS Word 스타일 에디터
│   │       │   ├── EditorPage.jsx      # 에디터 메인 컴포넌트
│   │       │   └── modules/            # 에디터 하위 모듈
│   │       │       ├── constants.js    # 에디터 상수 (폰트, 여백, 용지 등)
│   │       │       ├── styles.js       # ProseMirror CSS
│   │       │       ├── extensions.js   # TipTap 커스텀 확장
│   │       │       ├── HomeTab.jsx     # 홈 리본 탭
│   │       │       ├── InsertTab.jsx   # 삽입 리본 탭
│   │       │       ├── OtherTabs.jsx   # 디자인/레이아웃/참조/검토/보기 탭
│   │       │       ├── Dialogs.jsx     # 대화상자 모음
│   │       │       ├── RibbonParts.jsx # 리본 UI 프리미티브
│   │       │       ├── FloatingToolbar.jsx  # 텍스트 선택 시 미니 도구
│   │       │       ├── BackstageView.jsx    # 파일 탭 (새로만들기/열기/저장)
│   │       │       ├── NavigationPane.jsx   # 문서 구조 탐색 창
│   │       │       ├── ContextMenu.jsx      # 우클릭 메뉴
│   │       │       ├── MetaDrawer.jsx       # 문서 속성 편집 서랍
│   │       │       ├── DocListSidebar.jsx   # 문서 탐색기 사이드바
│   │       │       ├── CommentPanel.jsx     # 댓글/검토 패널
│   │       │       ├── comment-mark.js      # 댓글 하이라이트 Mark
│   │       │       ├── comment-store.js     # 댓글 상태 관리
│   │       │       ├── FootnoteArea.jsx     # 각주 영역
│   │       │       ├── footnote-extension.js # 각주 TipTap 확장
│   │       │       └── fileUtils.js         # 파일 I/O (docx/pdf/html)
│   │       │
│   │       └── admin/           # 관리자 영역
│   │           ├── AdminLayout.jsx      # 관리자 사이드바 레이아웃
│   │           ├── AdminDashboard.jsx   # 관리자 대시보드
│   │           ├── AdminDocuments.jsx   # 문서 관리
│   │           ├── AdminTags.jsx        # 태그 관리
│   │           └── AdminHistory.jsx     # 세계사 이벤트 관리
│   │
│   ├── vite.config.js           # Vite 설정 (프록시: /api/sb → localhost:5000)
│   └── package.json
│
└── backend/                     # 백엔드 (Express + SQLite)
    ├── index.js                 # 서버 진입점 (포트 5000)
    ├── db/
    │   ├── index.js             # SQLite 초기화, FTS5 설정
    │   └── schema.js            # Drizzle ORM 스키마 (12 테이블)
    ├── lib/
    │   └── markdown-analyzer.js # 마크다운 자동 분석 (유형/키워드/태그 추출)
    ├── routes/
    │   ├── sb-documents.js      # 문서 CRUD + 파일 업로드
    │   ├── sb-tags.js           # 태그 CRUD
    │   ├── sb-categories.js     # 카테고리 CRUD
    │   ├── sb-collections.js    # 컬렉션 CRUD
    │   ├── sb-dashboard.js      # 대시보드 통계
    │   └── sb-history.js        # 세계사 이벤트 CRUD
    ├── seed-*.js                # 시드 데이터 스크립트
    └── package.json
```

## 로컬 개발 환경 셋업

### 사전 요구사항
- Node.js 18+
- npm

### 설치 및 실행

```bash
# 1. 백엔드 설치 및 실행 (포트 5000)
cd backend
npm install
node index.js

# 2. 프론트엔드 설치 및 실행 (포트 5173)
cd frontend
npm install
npm run dev
```

프론트엔드 개발 서버가 `/api/sb/*` 요청을 백엔드(localhost:5000)로 프록시합니다.

### 시드 데이터 (선택)

```bash
cd backend
node seed-history.js          # 세계사 기본 이벤트
node seed-korean-history.js   # 한국사 이벤트
node seed-history-docs.js     # 세계사→문서 변환
node seed-tags-enrich.js      # 태그 보강
```

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `5000` | 백엔드 서버 포트 |

데이터베이스는 `backend/data/db/second-brain.db`에 자동 생성됩니다.

## 빌드

```bash
cd frontend
npm run build    # dist/ 폴더에 프로덕션 빌드 생성
```

## API 엔드포인트

모든 API는 `/api/sb/` 접두사. 응답 형식: `{ data, error, meta }`.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/sb/documents` | 문서 목록 (페이지네이션, 필터) |
| GET | `/api/sb/documents/search?q=` | FTS5 전문 검색 |
| GET | `/api/sb/documents/:id` | 문서 상세 |
| POST | `/api/sb/documents` | 문서 생성 |
| PATCH | `/api/sb/documents/:id` | 문서 수정 |
| DELETE | `/api/sb/documents/:id` | 문서 삭제 |
| POST | `/api/sb/documents/upload` | 파일 업로드 |
| POST | `/api/sb/documents/upload-markdown` | 마크다운 업로드 + 자동 분석 |
| GET/POST/PATCH/DELETE | `/api/sb/tags` | 태그 CRUD |
| GET/POST/PATCH/DELETE | `/api/sb/categories` | 카테고리 CRUD |
| GET/POST/PATCH/DELETE | `/api/sb/collections` | 컬렉션 CRUD |
| GET | `/api/sb/dashboard` | 대시보드 통계 |
| GET/POST/PATCH/DELETE | `/api/sb/history` | 세계사 이벤트 CRUD |
| GET | `/api/sb/history/stats` | 세계사 통계 |

## 라우트 구조

| 경로 | 페이지 |
|------|--------|
| `/` | 대시보드 |
| `/vault` | 문서 보관소 |
| `/vault/:id` | 문서 상세/편집 |
| `/search` | 전문 검색 |
| `/graph` | 지식 그래프 |
| `/timeline` | 문서 타임라인 |
| `/history` | 세계사 연표+지도 |
| `/editor` | Word 에디터 (독립 전체화면) |
| `/editor/:id` | 기존 문서 편집 |
| `/admin/*` | 관리자 영역 (비밀번호: 1234) |
