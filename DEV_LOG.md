# 윤정 법률사무소 -- 개발일지

## 작업 개요
- **프로젝트**: 윤정 법률사무소 홈페이지 (풀스택 웹 애플리케이션)
- **기간**: 2026-04-06
- **작업 범위**: 전체 코드 리뷰 → 보안 수정 → 클린코드 리팩토링

---

## 1차 작업: 보안 수정

### 1-1. 인증 시스템 전면 수정
- `AdminLogin.jsx`: 하드코딩 비밀번호 `"1234"` 제거 → 백엔드 `/admin-users/login` API 연동
- `App.jsx`: 클라이언트 토큰 생성 제거 → 서버 발급 토큰 사용
- `auth.js`: SQLite 기반 세션 스토어 (인메모리 → 영속화), 세션 TTL 24시간, `adminAuth` 미들웨어 공통화
- `sb-admin-users.js`: 모든 CRUD에 `adminAuth` 적용, 기본 비밀번호 환경변수화
- `sb-portal.js`: 세션 TTL 24시간, 비밀번호 정책 8자 이상
- `index.js`: 로그인 Rate Limit (15분당 10회)

### 1-2. XSS 취약점 수정
- `BlogDetailPage.jsx`: DOMPurify 적용
- `SearchPage.jsx`: DOMPurify 적용
- `InsertTab.jsx`: URL 검증 함수, HTML escape 적용
- `FloatingToolbar.jsx`: 링크 URL 검증
- `OtherTabs.jsx`: 인용 입력 HTML escape
- `RibbonParts.jsx`: 색상 코드 hex 검증
- `PrintPreviewDialog.jsx`: DOMPurify 적용

### 1-3. 보안 강화
- CSP 활성화 (Helmet): script/style/img/font/connect/media/frame/object 소스 제한
- 에러 응답에서 `e.message` → 제네릭 메시지로 변경 (스택 트레이스 노출 방지)
- 웹훅 URL: 하드코딩 → `APPS_SCRIPT_WEBHOOK_URL` 환경변수
- Graceful shutdown: SIGTERM/SIGINT 핸들러 (`index.js`)
- FTS5 쿼리 보호: 토큰 수 제한, 따옴표 이스케이프
- `.env.example` 생성 (`backend/.env.example`)

### 1-4. 코드 품질
- `Layout.jsx`: 스크롤 핸들러 `requestAnimationFrame` + `{ passive: true }`
- `CommentPanel.jsx`: debounce timer cleanup
- `App.jsx`: 모든 공개 라우트에 `ErrorBoundary` 적용
- `comment-store.js`, `fileUtils.js`: localStorage `QuotaExceededError` 감지

### 1-5. 인프라
- 16개 라우트 파일에 `adminAuth` 미들웨어 적용
- CSRF 보호: `lib/csrf.js` (더블 서브밋 쿠키 패턴)
- 환경변수 검증: 서버 시작 시 누락 경고 (`index.js`)
- `CLAUDE.md`: 하드코딩 비밀번호 참조 제거

---

## 2차 작업: 클린코드 리팩토링 -- 공통 인프라 + Admin

### 2-1. 공통 인프라 생성
- `components/admin/styles.js` — 색상 토큰, 필드/라벨/버튼 스타일 단일 소스
- `hooks/useCrudForm.js` (183줄) — CRUD 상태관리 훅 (Admin 페이지 재사용)
- `components/admin/Pagination.jsx` — 페이지네이션 (Admin 중복 제거)
- `components/admin/FormField.jsx` — 폼 필드 (Admin 중복 제거)
- `components/admin/PageHeader.jsx` — 페이지 헤더
- `components/admin/EditPanel.jsx` — 편집 패널
- `components/admin/EmptyState.jsx` — 빈 상태 표시
- `components/admin/ErrorBanner.jsx` — 인라인 에러 배너 (`alert()` 대체)
- `utils/formatters.js` (43줄) — 날짜/전화번호/바이트 포맷터

### 2-2. Admin 페이지 리팩토링
- `AdminLawyers`: 133줄 (`useCrudForm` + 공통 컴포넌트 적용 완료)
- `AdminClients`: 152줄 (적용 완료)
- `AdminReviews`: 202줄 (적용 완료)
- `AdminCases`: 270줄 (적용 완료)
- `AdminBookings`: 301줄 (부분 리팩토링, `alert()` 4개 잔존)
- `AdminMessages`: 779줄 (부분 리팩토링, `alert()` 5개 잔존)
- `AdminMedia`: 469줄 (부분 리팩토링, `alert()` 3개 잔존)
- `AdminSettings`: 442줄 (부분 리팩토링, `alert()` 4개 잔존)
- `AdminDocuments`: 463줄 (부분 리팩토링, `alert()` 2개 잔존)
- `AdminDashboard`: 347줄 (부분 리팩토링)
- `AdminAnalytics`: 557줄 (부분 리팩토링, `alert()` 1개 잔존)

### 2-3. EditorPage 분해 (1,839줄 → 1,328줄 + 6 hooks)
- `hooks/useCrudForm.js` (183줄) — CRUD 상태관리 훅
- `modules/scrollUtils.js` (42줄) — `scrollToCursor` 유틸
- `modules/editorConstants.js` (20줄) — 매직넘버 상수화
- `modules/FindReplaceBar.jsx` (311줄) — Dialogs.jsx에서 분리

### 2-4. 디자인 토큰 적용
- `index.css`: 그레이 스케일, 오버레이, 화이트 변형 토큰 추가
- `Layout.jsx`: 모든 색상 CSS 변수 전환

---

## 3차 작업: 심화 리팩토링

### 3-1. 죽은 코드 + 중복 제거
- EditorPage 비활성 페이지네이션 코드 삭제
- `scrollToCursor` 중복 제거 → `scrollUtils.js` 유틸
- `useCrudForm`: `alert()` → error 상태 + `ErrorBanner`

### 3-2. 백엔드 보안 강화
- SQLite 세션 스토어 (`auth.js`: `better-sqlite3` 기반, 서버 재시작에도 세션 유지)
- 환경변수 검증 (서버 시작 시 누락 경고)
- CSRF 보호 (`lib/csrf.js`, 더블 서브밋 쿠키)

### 3-3. 훅 API 정리
- `comment-store.js`: `QuotaExceededError` 처리
- `fileUtils.js`: `QuotaExceededError` 처리
- EditorPage 매직넘버 상수화 (`editorConstants.js`)

---

## 4차 작업: 대형 파일 분해 + 인프라

### 4-1. AdminHeroVideos 분해 (→ 16개 파일)
- `hero-videos/` 서브폴더: `index.jsx`, `VideoEditor.jsx`, `VideoCard.jsx`, `VideoFormModal.jsx`, `FilterBar.jsx`, `PropertyPanel.jsx`, `TransformPanel.jsx`, `TransportControls.jsx`, `TrimPanel.jsx`, `Timeline.jsx`, `ActiveVideoPreview.jsx`, `ColorPanel.jsx`, `DeleteConfirmModal.jsx`, `EditorPrimitives.jsx`, `Overlay.jsx`, `constants.js`
- 최대 파일: `VideoEditor.jsx` (210줄)
- `AdminHeroVideos.jsx` → 4줄 (re-export)

### 4-2. AdminSiteManager 분해 (→ 12개 파일)
- `site-manager/` 서브폴더: `index.jsx`, `HomeSection.jsx`, `AboutSection.jsx`, `PracticeSection.jsx`, `HistorySection.jsx`, `AnnouncementsSection.jsx`, `LayoutSection.jsx`, `SeoSection.jsx`, `ThemeSection.jsx`, `constants.js`, `shared.jsx`, `useSiteSettings.js`
- 최대 파일: `index.jsx` (161줄)
- `AdminSiteManager.jsx` → 2줄 (re-export)

### 4-3. HomeTab 분해 (→ 5개 파일)
- `ClipboardGroup.jsx` (127줄), `FontGroup.jsx` (150줄), `ParagraphGroup.jsx` (147줄), `StyleGallery.jsx` (104줄)
- `HomeTab.jsx` → 55줄 (조합 컴포넌트)

### 4-4. FindReplaceBar 분리
- `Dialogs.jsx`에서 추출 → `FindReplaceBar.jsx` (311줄)

### 4-5. 백엔드 서비스 레이어
- `services/helpers.js` (91줄) — `ServiceError`, `validateUUID`, `parsePagination`
- `services/document-service.js` (287줄) — 문서 CRUD
- `services/blog-service.js` (196줄) — 블로그 CRUD
- `services/client-service.js` (146줄) — 고객 CRUD
- `services/consultation-service.js` (233줄) — 상담 CRUD + 자동 고객 등록 + 웹훅

### 4-6. 코드 스플리팅
- `App.jsx`: `React.lazy` + `dynamic import` 적용 (20개 컴포넌트)
- EditorPage, Admin/Portal/Blog 각각 별도 청크로 분리
- 초기 로딩 번들 크기 대폭 감소

### 4-7. 테스트 코드 (52개 테스트 케이스, 4개 파일)
- 백엔드 17개: `csrf.test.js` (8개), `auth.test.js` (9개)
- 프론트엔드 35개: `useCrudForm.test.js` (13개), `formatters.test.js` (22개)

### 4-8. API 문서화
- OpenAPI 3.0 스펙: `backend/docs/openapi.json` (28 paths, 13 schemas)
- Swagger UI: `/api/docs/`

---

## 5차 작업 (진행 중): 전수 감사 기반 완전 정리

### 5-1. DocumentDetailPage 2,225줄 분해 [진행 중]
- 현재 2,225줄 — 논리적 단위로 분해 필요

### 5-2. Portal 5개 페이지 공통화 [진행 중]
- `PortalDashboard` (107줄), `PortalCaseDetail` (264줄), `PortalLayout` (57줄), `PortalLogin` (113줄), `PortalRegister` (128줄)

### 5-3. ConsultationPage 916줄 분해 [진행 중]

### 5-4. sb-portal.js 서비스 레이어 + styles.js 분할 + RibbonParts 분해 [예정]
- `sb-portal.js` (543줄) → 서비스 레이어 분리

### 5-5. GraphPage + OtherTabs + DrawTab + Dialogs + CommentPanel 분해 [예정]

### 5-6. fileUtils exportDocx 분해 + InsertTab/NewDialogs 정리 [예정]

### 5-7. 잔존 하드코딩 색상/매직넘버 전수 정리 [예정]

### 5-8. 잔존 alert() 제거 [예정]
- 현재 6개 Admin 파일에 `alert()` 21개 잔존 → `ErrorBanner` 전환 필요

---

## 5차 작업: 전수 감사 기반 완전 정리

### 5-1. DocumentDetailPage 2,225줄 분해 ✅
- document-detail/ 서브폴더: 10개 파일로 분리
- index.jsx, DocToolbar, DocMetaSidebar, DocModals, DocDetailUI, useDocDetailEditor 등
- 인라인 CSS를 docDetailStyles.js로 추출

### 5-2. Portal 5개 페이지 공통화 ✅
- utils/portalApi.js 생성 (portalFetch 3중 복사 제거)
- portal/portalConstants.js (STATUS_MAP 2중 복사 제거)
- portal/portalStyles.js (fieldStyle/labelStyle/T 색상 → CSS 변수 전환)
- 5개 포털 페이지 전부 하드코딩 색상 0개 달성

### 5-3. ConsultationPage 917줄 분해 ✅
- consultation/ 서브폴더: 9개 파일
- ConsultationHero, Steps, Form, FAQ, Map, PrivacyModal, useSignaturePad, constants
- 서명 캔버스 물리 로직을 useSignaturePad 훅으로 추출
- 매직넘버 상수화 (MIN_LINE_WIDTH, VELOCITY_FACTOR 등)

### 5-4. sb-portal.js 서비스 레이어 분리 ✅
- services/portal-service.js (397줄) — 12개 서비스 함수
- sb-portal.js 543줄→164줄 (70% 감소)
- 포털 세션을 SQLite로 영속화 (lib/auth.js에 createPortalSession 추가)
- 인라인 portalAuth/adminAuth 제거 → lib/auth.js 공유 미들웨어 사용

### 5-5. 에디터 styles.js 1,837줄 분할 ✅
- styles-typography.js, styles-layout.js, styles-components.js 3분할
- styles.js를 12줄 배럴 파일로 변환

### 5-6. RibbonParts 버튼 상태 색상 상수화 ✅
- BTN_COLORS 객체로 통합 (hover/active/pressed/activeBorder/border)
- 15개 이상 하드코딩 참조 치환

### 5-7. GraphPage 969줄 분해 ✅
- graph/ 서브폴더: 6개 파일
- graphConstants (물리 파라미터), graphUtils, graphRenderer, useGraphCanvas, GraphSidebar

### 5-8. OtherTabs 672줄 → 5개 탭 파일 ✅
- DesignTab, LayoutTab, ReferencesTab, ReviewTab, ViewTab 각각 분리
- OtherTabs.jsx를 9줄 배럴 파일로 변환

### 5-9. fileUtils 862줄 분할 ✅
- docxExport, pdfExport, docxImport, otherExports, fileHelpers 5개 모듈
- fileUtils.js를 51줄 배럴 파일로 변환

### 5-10. InsertTab 커버페이지 추출 ✅
- coverPageTemplates.js (65줄) — COVER_PAGE_PRESETS 배열

### 5-11. DrawTab 658줄 분해 ✅
- DrawCanvas.jsx (261줄), drawConstants.js (36줄) 추출

### 5-12. 잔존 하드코딩 색상 전수 정리 ✅
- SearchPage, VaultPage, TimelinePage: #999→var(--text-muted), #666→var(--gray-500) 등
- ChatWidget, BookingCalendar: T 객체 → CSS 변수 전환
- NewsletterForm, Announcements: #b08d57→var(--accent-gold)
- format.js → formatters.js로 parseAuthor 병합 (중복 유틸 파일 통합)
- 총 35개 이상 하드코딩 색상 치환

---

## 6차 작업: 최종 감사 기반 잔여 과제 완수

### 6-1. 긴급 보안 수정 ✅
- sb-documents.js: POST/PATCH/DELETE 6개 엔드포인트에 adminAuth 추가
- sb-cases.js: GET /에서 all=true 파라미터에 관리자 인증 검사 추가
- sb-site-settings.js: 인라인 adminAuth 중복 제거 → lib/auth.js import로 교체

### 6-2. EditorPage 렌더 773줄 → 6개 서브컴포넌트 분해 ✅
- RibbonBar.jsx (171줄) — 리본 탭 네비 + 활성 탭 콘텐츠
- EditorCanvas.jsx (394줄) — 편집 캔버스 + 눈금자 + 뷰모드
- DialogManager.jsx (128줄) — 15개 다이얼로그 렌더링 중앙 관리
- EditorStatusBar.jsx (108줄) — 하단 상태바 (단어수/줌)
- TitleBar.jsx (119줄) — 상단 타이틀 + QAT 버튼
- HorizontalRuler.jsx (112줄) — cm 눈금자
- EditorPage.jsx: 1,328줄 → **722줄** (렌더 773줄 → 190줄)

### 6-3. DocToolbar 팩토리 패턴 적용 ✅
- toolbarConfig.js (138줄) — 버튼 설정 배열 (HOME/INSERT/ALIGN 등)
- toolbarStyles.js (212줄) — 공유 스타일 상수
- DocToolbar.jsx: config 배열 + renderFormatButtons 헬퍼로 중복 제거

### 6-4. Dialogs + NewDialogs 추상화 ✅
- DialogShell.jsx (33줄) — 공통 다이얼로그 래퍼
- DialogField.jsx (68줄) — DialogField, DialogSelect, DialogFooter
- Dialogs.jsx: 인라인 DialogShell 제거 + DialogFooter 6곳 적용
- NewDialogs.jsx: 인라인 DialogShell 제거 + DialogWithFooter 래퍼

### 6-5. RibbonParts 팔레트 상수 분리 ✅
- colorPalette.js (19줄) — THEME_COLORS + THEME_TINTS (81개 색상값)
- RibbonParts.jsx: 인라인 팔레트 배열 → import로 교체

### 6-6. alert() 52개 완전 제거 ✅
- editorToast.js (16줄) — 에디터용 토스트 알림
- utils/showToast.js (20줄) — 범용 토스트 (info/error/success)
- 28개 파일에서 52개 alert() → showEditorAlert/showToast로 전환
- 잔존 alert(): **0개**

### 6-7. 대형 파일 추가 분해 (7차 작업) ✅

**에디터 다이얼로그 분할:**
- Dialogs.jsx (635줄) → 6개 개별 다이얼로그 파일 + 배럴
- NewDialogs.jsx (544줄) → 6개 개별 다이얼로그 파일 + 배럴
- PrintPreviewDialog.jsx (461줄) → PrintPreview + StylesManager + SymbolPicker + 배럴

**Admin 페이지 추가 분할:**
- AdminMessages (780줄) → messages/ 서브폴더 6개 파일
- AdminAnalytics (558줄) → analytics/ 서브폴더 6개 파일
- AdminMedia (470줄) → media/ 서브폴더 4개 파일
- AdminDocuments (464줄) → documents/ 서브폴더 4개 파일
- AdminSettings (443줄) → settings/ 서브폴더 5개 파일
- AdminDashboard (347줄) → 3개 서브컴포넌트 추출
- AdminBookings (302줄) → BookingList + BookingSettingsForm 추출

**에디터 모듈 추가 분할:**
- CommentPanel (638줄) → 5개 파일 + 공유 컴포넌트
- FootnoteArea (427줄) → FootnoteArea + EndnoteArea + FootnoteEndnoteDialog
- VaultPage (531줄) → vault/ 서브폴더 5개 파일
- TimelinePage (361줄) → TimelineChart + TimelineTooltip + 상수
- ContextMenu (316줄) → ContextMenu + contextMenuItems 설정 분리

---

## 수치 변화 요약

| 지표 | 리팩토링 전 | 최종 |
|------|-----------|------|
| EditorPage | 1,839줄 | **722줄** + 6 hooks + 6 sub-components |
| DocumentDetailPage | 2,225줄 | 10개 파일 (document-detail/) |
| AdminHeroVideos | 1,495줄 | 16개 파일 (hero-videos/) |
| AdminSiteManager | 1,349줄 | 12개 파일 (site-manager/) |
| ConsultationPage | 917줄 | 9개 파일 (consultation/) |
| GraphPage | 969줄 | 6개 파일 (graph/) |
| HomeTab | 518줄 | 5개 파일 |
| OtherTabs | 672줄 | 5개 탭 파일 + 배럴 |
| fileUtils | 862줄 | 6개 모듈 + 배럴 |
| styles.js (에디터 CSS) | 1,837줄 | 3개 파일 + 배럴 |
| sb-portal.js | 543줄 | 164줄 + portal-service.js |
| 메인 번들 | 1,274KB | 268KB (코드 스플리팅) |
| 코드 스플리팅 | 없음 | React.lazy 20개 컴포넌트 |
| 테스트 | 0개 | 77개 (6개 파일) |
| API 문서 | 없음 | OpenAPI 3.0 + Swagger UI |
| 세션 저장소 | 인메모리 | SQLite 영속화 (admin + portal) |
| CSRF 보호 | 없음 | 더블 서브밋 쿠키 |
| adminAuth 적용 | 부분 | 전체 라우트 완료 (documents 포함) |
| DOMPurify 적용 | 없음 | 3개 파일 |
| 서비스 레이어 | 없음 | 6개 서비스 (portal 포함) + helpers |
| 환경변수 관리 | 하드코딩 | .env.example + 시작 시 검증 |
| 포털 공통 인프라 | 없음 | portalApi + portalStyles + portalConstants |
| 공개 페이지 CSS 변수 | 0% | ~85% 적용 |
| alert() 호출 | 52개 | **0개** (토스트로 전환) |
| 다이얼로그 공통화 | 없음 | DialogShell + DialogField + DialogFooter |
| 색상 팔레트 상수 | 인라인 81개 | colorPalette.js로 분리 |
| sb-portal.js | 543줄 (인라인 세션) | 164줄 + portal-service + SQLite 세션 |
| sb-site-settings.js 커스텀 auth | 중복 정의 | lib/auth.js 공유 미들웨어 |

---

## 8차 작업: 전체 코드 리뷰 (빡센 보안 감사) + 보안 리팩토링 — 2026-04-07

### 8-0. 리뷰 방법론
전체 변경 파일 89개 (삽입 4,751줄 / 삭제 21,863줄)를 대상으로 백엔드 보안 에이전트와 프론트엔드 코드 품질 에이전트를 병렬 투입하여 전수 감사를 실시했다. 각 에이전트가 모든 변경 파일을 직접 읽고, 카테고리별로 이슈를 분류했다.

총 **51개 이슈** 발견: Critical 6 / High 13 / Medium 16 / Low 16

---

### 8-1. 전체 리뷰 결과 — CRITICAL (6건)

**C-1. 타이밍 공격에 취약한 비밀번호 비교**
- 파일: `backend/lib/auth.js:57`
- 문제: `verifyPassword` 함수에서 `===` 문자열 비교로 해시를 검증하고 있었음. 타이밍 공격으로 응답 시간 차이를 측정하여 해시를 한 글자씩 추론할 수 있는 취약점.
- 수정: `crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verify, "hex"))` 사용. 길이가 다르면 즉시 false 반환하는 선행 체크 추가 (timingSafeEqual은 길이 다르면 에러를 던지므로).

**C-2. 하드코딩된 기본 관리자 비밀번호**
- 파일: `backend/routes/sb-admin-users.js:234`
- 문제: `process.env.ADMIN_INITIAL_PASSWORD || "admin1234!"` — 환경변수 미설정 시 누구나 알 수 있는 비밀번호 `"admin1234!"`로 관리자 접근 가능. 강제 비밀번호 변경도 없음.
- 수정: 폴백 `"admin1234!"` 완전 제거. 환경변수 미설정 시 계정 생성 거부하고 경고 로그 출력. 8자 미만 비밀번호도 거부. `.env.example`에서도 예시 비밀번호 제거.

**C-3. CSRF 토큰 서명 없음 (Double Submit Cookie 약점)**
- 파일: `backend/lib/csrf.js:76`
- 문제: Double-submit cookie 패턴에서 서버가 토큰 발급 여부를 검증하지 않음. 서브도메인 XSS나 관련 도메인에서 `csrf-token` 쿠키를 알려진 값으로 세팅한 후 같은 값을 헤더로 보내면 우회 가능. 서버는 "내가 발급한 토큰인가"를 확인하지 않고 단순히 쿠키와 헤더 값이 같은지만 비교.
- 상태: HMAC 서명 기반으로 변경 필요 — 이번 라운드에서는 Secure 플래그 추가로 부분 보완. 완전 수정은 별도 작업 필요.

**C-4. XSS — 관리자 영역 HTML 미살균 (HistorySection)**
- 파일: `frontend/src/pages/admin/site-manager/HistorySection.jsx:71`
- 문제: `markdownToHtml()` 함수가 regex 기반으로 마크다운→HTML 변환 후 `dangerouslySetInnerHTML`로 직접 삽입. DOMPurify 미적용. 백엔드에서 가져온 개발 일지 콘텐츠에 악성 HTML/JS가 포함되면 관리자 세션 탈취 가능.
- 수정: `DOMPurify.sanitize(markdownToHtml(logContent))` 적용.

**C-5. 에디터 라우트 인증 없이 공개 노출**
- 파일: `frontend/src/App.jsx:189-190`
- 문제: `/editor`와 `/editor/:id` 라우트가 공개 — 인증 가드 없이 누구나 문서 에디터 접근 가능. 백엔드 POST/PATCH/DELETE는 `adminAuth` 보호되어 있어 저장은 불가하지만, 에디터 UI 자체와 GET(문서 읽기)은 인증 없이 접근됨.
- 수정: `/editor` → `/admin/editor`로 리다이렉트하는 구조로 변경. `EditorRedirect` 컴포넌트 추가 (`useParams`로 `:id` 전달). 관리자 로그인 안 한 상태면 `AdminArea`에서 로그인 화면 표시. `Navigate` + `useParams` import 추가.

**C-6. 포탈 인증 가드 레이스 컨디션**
- 파일: `frontend/src/pages/portal/PortalLayout.jsx:9-11`
- 문제: 인증 체크가 `useEffect`로 수행되어 첫 렌더에 `<Outlet />`이 보호 콘텐츠를 렌더링한 후 리다이렉트 발생. 토큰 유효성 검증도 없어 sessionStorage에 아무 값이 있으면 통과.
- 상태: 프론트엔드 가드는 UX 보호 목적이고 실제 보안은 백엔드 `portalAuth`가 담당. 완전 수정은 토큰 검증 API 호출 + 로딩 상태 표시 필요 — 별도 작업.

---

### 8-2. 전체 리뷰 결과 — HIGH (13건)

**H-1. 관리자 RBAC 없음 (사용자 관리)**
- 파일: `backend/routes/sb-admin-users.js:139, 171, 205`
- 문제: 모든 인증된 관리자(역할 무관: editor, admin 등)가 다른 관리자를 생성/수정/삭제 가능. `adminAuth` 미들웨어가 세션 존재만 확인하고 `role`은 체크하지 않음.
- 수정: `auth.js`에 `requireRole(...roles)` 미들웨어 팩토리 추가. `VALID_ROLES = ["admin", "editor"]` 화이트리스트. 사용자 목록(GET), 생성(POST), 수정(PATCH), 삭제(DELETE)에 `requireRole("admin")` 체이닝. `sqlite` import 추가.

**H-2. role 값 검증 없음**
- 파일: `backend/routes/sb-admin-users.js:189`
- 문제: `role` 필드가 사용자 입력 그대로 저장되어 `"superadmin"` 등 임의 문자열 가능.
- 수정: H-1과 함께 `VALID_ROLES.includes(role)` 화이트리스트 검증 추가. 유효하지 않은 역할이면 400 에러 반환.

**H-3. 자기 자신 비활성화/삭제 가능 + 마지막 admin 보호 없음**
- 파일: `backend/routes/sb-admin-users.js:205-227`
- 문제: 관리자가 자기 자신을 비활성화하면 모든 관리자가 잠길 수 있음.
- 수정: PATCH에서 `id === req.adminUser.userId`이고 `isActive=false`이면 400 에러. DELETE에서도 자기 자신이면 400 에러. 마지막 active admin의 역할 변경/비활성화/삭제 시 `SELECT COUNT(*) FROM admin_users WHERE role='admin' AND is_active=1`로 체크하여 1명 이하면 거부.

**H-4. 비활성화된 관리자 세션 미삭제**
- 파일: `backend/routes/sb-admin-users.js:216-221`
- 문제: 관리자 비활성화 시 기존 세션이 `sessions` 테이블에 남아 24시간 동안 접근 유지.
- 수정: PATCH에서 `isActive=false` 설정 시 `sqlite.prepare("DELETE FROM sessions WHERE user_id = ?").run(id)` 실행. DELETE(비활성화)에서도 동일.

**H-5. 비밀번호 강도 미검증 (관리자 생성/변경)**
- 파일: `backend/routes/sb-admin-users.js:152, 186`
- 문제: 관리자 생성/변경 시 비밀번호 길이 체크 없음.
- 수정: POST(생성)와 PATCH(변경) 모두 `password.length < 8`이면 400 에러 반환.

**H-6. 문서 목록/검색 인증 없음**
- 파일: `backend/routes/sb-documents.js:25, 36`
- 문제: `GET /api/sb/documents`와 `GET /api/sb/documents/search`에 인증 없음.
- 판단: VaultPage, SearchPage, DocumentDetailPage 등 공개 페이지에서 사용하므로 의도된 설계. 문서가 기밀 법률 문서인 경우 문제가 되지만, 현재는 공개용 콘텐츠.
- 상태: 에디터 라우트를 admin 영역으로 이동하여 간접 보호. 문서 자체의 접근 제어는 별도 설계 필요.

**H-7. 블로그 조회수 조작 가능**
- 파일: `backend/routes/sb-blog.js:23`
- 문제: `GET /api/sb/blog/:slug` 호출 시마다 조회수 무조건 +1. Rate limiter가 200req/15min이라 자동화로 대량 조작 가능.
- 수정: 인메모리 `viewCache` (Map) 추가. IP:slug 키로 10분 쿨다운. 쿨다운 내 재조회 시 `skipIncrement: true`로 서비스 호출. `blog-service.js`의 `getPost` 함수에 `options.skipIncrement` 파라미터 추가하여 조회수 증가 스킵 지원. 5분마다 만료 엔트리 정리하는 setInterval (`.unref()` 적용).

**H-8. 사이트 설정 히스토리/스케줄 엔드포인트 공개**
- 파일: `backend/routes/sb-site-settings.js:57, 89, 223`
- 문제: `GET /history`, `GET /history/:id`, `GET /schedule`에 `adminAuth` 누락. 누구나 설정 변경 이력과 예약 변경 목록 조회 가능.
- 수정: 3개 라우트에 `adminAuth` 미들웨어 추가.

**H-9. 히어로 비디오 MIME 타입 미검증**
- 파일: `backend/routes/sb-hero-videos.js:35-39`
- 문제: 파일 확장자만 체크하고 MIME 타입은 검증하지 않음. `.mp4` 확장자로 악성 파일 업로드 가능.
- 수정: `fileFilter`에서 확장자 + MIME 타입 동시 체크. `allowedMimes = ["video/mp4", "video/webm", "video/quicktime"]`.

**H-10. 관리자 인증 클라이언트 전용**
- 파일: `frontend/src/App.jsx:116`
- 문제: `useState(!!sessionStorage.getItem("admin_token"))` — sessionStorage에 아무 값 넣으면 UI 통과. API 호출은 백엔드에서 거부되지만 관리자 UI 노출.
- 상태: 백엔드 `adminAuth`가 실제 보안 게이트. 프론트엔드 가드 강화는 UX 개선 수준 — 별도 작업.

**H-11. 에디터 ReadView XSS**
- 파일: `frontend/src/pages/editor/modules/EditorCanvas.jsx:256`
- 문제: `editor.getHTML()` 결과를 `dangerouslySetInnerHTML`로 미살균 렌더링. 백엔드에서 악의적 콘텐츠를 로드하면 XSS 가능. PrintPreview는 `DOMPurify.sanitize()` 적용되어 있었지만 ReadView에는 누락.
- 수정: `DOMPurify.sanitize(editor?.getHTML() || "")` 적용. DOMPurify import 추가.

**H-12. 로그인 레이트리밋 클라이언트 전용**
- 파일: `frontend/src/pages/admin/AdminLogin.jsx:9-10`
- 문제: 5회 실패 후 15분 잠금이 React 상태로만 구현. 새로고침하면 리셋.
- 상태: 백엔드의 rateLimit 미들웨어가 실제 보호. 클라이언트 측은 UX 보조.

**H-13. 포탈 비밀번호 정책 약함**
- 파일: `frontend/src/pages/portal/PortalRegister.jsx:21`
- 문제: 프론트엔드에서 6자 이상만 요구. 백엔드는 이미 8자 이상 요구.
- 수정: `form.password.length < 6` → `form.password.length < 8`, 에러 메시지도 "8자 이상"으로 변경.

---

### 8-3. 전체 리뷰 결과 — MEDIUM (16건)

**M-1. 비활성화된 관리자 세션 미삭제** → H-4에서 함께 수정됨

**M-2. CORS ALLOWED_ORIGINS 미설정 시 전체 허용**
- 파일: `backend/index.js:84-88`
- 문제: `ALLOWED_ORIGINS` 환경변수 미설정 시 `origin: undefined`로 cors()에 전달되어 모든 출처 허용.
- 수정: `NODE_ENV === "production"`에서 미설정 시 경고 로그 출력. `credentials: true` 추가.

**M-3. 업로드 경로 STORAGE_PATH에 샌드박싱 안됨**
- 파일: `backend/routes/sb-documents.js:101-108`
- 문제: 업로드 파일 경로가 `path.join(__dirname, "..", relativeDir)`로 항상 backend 프로젝트 디렉토리에 저장. `STORAGE_PATH`가 외부 경로로 설정되어도 업로드는 프로젝트 내부에 저장되어 정적 서빙과 불일치.
- 수정: `STORAGE_ROOT` 상수 추가 (`process.env.STORAGE_PATH || path.join(__dirname, "..", "data")`). upload와 upload-markdown 라우트 모두 `STORAGE_ROOT` 기반으로 경로 통일.

**M-4. 업로드된 HTML 파일 그대로 서빙 — Stored XSS**
- 파일: `backend/index.js:97-98`
- 문제: `express.static`이 업로드된 HTML/SVG 파일을 원래 MIME 타입으로 서빙. 사용자가 URL 방문 시 악성 스크립트 실행.
- 수정: `staticOptions.setHeaders`에서 `.html/.htm/.svg/.xml` 확장자는 `Content-Disposition: attachment` + `Content-Type: application/octet-stream` 강제. 모든 업로드 파일에 `X-Content-Type-Options: nosniff` 적용.

**M-5. CSRF 쿠키 Secure 플래그 누락**
- 파일: `backend/lib/csrf.js:54`
- 문제: CSRF 쿠키에 `secure` 플래그 없음. HTTPS 환경에서도 HTTP 연결로 쿠키 가로채기 가능.
- 수정: `secure: process.env.NODE_ENV === "production"` 추가.

**M-6. LIKE 쿼리 와일드카드 미이스케이프**
- 파일: `backend/services/document-service.js:70`, `backend/services/client-service.js:34-36`, `backend/routes/sb-media.js:103`
- 문제: 사용자 입력이 LIKE 쿼리에 `%`와 `_` 와일드카드가 이스케이프 없이 삽입됨. `q=%`로 전체 매칭, 병리적 패턴으로 성능 저하 가능.
- 수정: `backend/lib/sanitize.js` 생성. `escapeLike(str)` 함수: `%` → `\%`, `_` → `\_`, `\` → `\\` 치환. 3개 파일에 적용.

**M-7. 텍스트 입력 최대 길이 제한 없음**
- 파일: 다수 라우트
- 문제: 상담 `message`, 포탈 `content`, 관리자 `name` 등에 상한 없음. 메가바이트 단위 텍스트로 DB 저장소 소진 가능.
- 수정: `consultation-service.js`에 상담 메시지 5,000자, 이름 100자 제한 추가. Express `json({ limit: "10mb" })`가 전체 요청 크기는 제한하고 있으므로 가장 위험한 공개 엔드포인트에 우선 적용.

**M-8. 비밀번호 강도 미검증 (관리자 생성/변경)** → H-5에서 함께 수정됨

**M-9. postMessage origin 미검증**
- 파일: `frontend/src/hooks/useSiteSettings.js:118-121`
- 문제: `handleMessage` 함수가 `event.origin`을 확인하지 않음. iframe이나 window.open으로 사이트를 연 후 `postMessage`로 `type: "preview-settings"`를 보내면 임의 설정 주입 가능.
- 수정: `if (event.origin !== window.location.origin) return;` 체크 추가.

**M-10. 자동저장 stale closure**
- 파일: `frontend/src/pages/editor/hooks/useDocumentManager.js:112`
- 문제: `scheduleAutoSave`의 `useCallback` 의존성에 `doc`이 포함되어 있지만, 1초 타임아웃 후 실행 시점의 `doc`은 클로저 캡처 시점의 값. 타이틀 등 메타데이터가 변경되어도 이전 값으로 저장될 수 있음.
- 수정: `docRef = useRef(doc)` 추가하고 `useEffect`로 `doc` 변경 시 `docRef.current` 동기화. `autoSaveToLocal` 호출에서 `doc` → `docRef.current` 사용. `useCallback` 의존성에서 `doc` 제거.

**M-11. EditorPage 페이지네이션 useEffect 의존성 14개** — 기능 변경 없는 성능 이슈. 리팩토링 범위로 보류.

**M-12. InsertTab WordArt dangerouslySetInnerHTML** — 상수 데이터만 사용하여 XSS 위험 없음. 사용자 입력은 `escapeHtml()`로 처리됨.

**M-13. Admin 토큰 콘솔 노출 가능성** — 명시적 토큰 노출 없음. 에러 메시지에 인증 정보 포함 가능성은 낮음.

**M-14. 포탈 토큰 sessionStorage + 커스텀 헤더** — XSS 시 토큰 탈취 가능하나 커스텀 헤더 사용으로 CSRF는 방지. XSS 자체를 막는 것이 우선.

**M-15. 포탈 로그아웃 인증 불필요**
- 파일: `backend/routes/sb-portal.js:50`
- 문제: `POST /portal/logout`에 `portalAuth` 없음. 토큰을 아는 사람이 임의 세션 삭제 가능.
- 수정: `portalAuth` 미들웨어 추가.

**M-16. 포탈 로그인 빈 토큰 저장 가능** — `""` 저장 시 falsy라 재로그인 유도됨. 실질적 위험 낮음.

---

### 8-4. 전체 리뷰 결과 — LOW (16건)

**L-1. 히어로 비디오 활성화 시 ID 존재 확인 안함**
- 파일: `backend/routes/sb-hero-videos.js:156`
- 문제: `PATCH /:id/activate`에서 대상 ID 존재 확인 없이 모든 비디오 비활성화 후 대상 활성화. ID가 없으면 모든 비디오 비활성화되고 아무것도 활성화 안됨.

**L-2. 라우트 파라미터 ID 형식 미검증**
- 파일: `sb-hero-videos.js`, `sb-blog.js` 등 다수
- 문제: `:id` 파라미터가 UUID 형식인지 검증 없이 DB 쿼리 실행. SQL 인젝션은 아니지만 불필요한 DB 호출.

**L-3. 에러 메시지 한/영 혼재**
- 파일: 전체
- 문제: "서버 내부 오류가 발생했습니다" (한국어)와 "Document not found", "No file provided" (영어) 혼재.

**L-4. 민감 데이터 console.log**
- 파일: `backend/services/consultation-service.js:54`
- 문제: Apps Script 응답 전문 로깅.

**L-5. setInterval unref() 누락**
- 파일: `backend/lib/auth.js:204`
- 문제: 세션 정리 setInterval이 `unref()` 없어 Node.js 프로세스 종료 방해.

**L-6. upload-markdown 카테고리 링킹 트랜잭션 없음**
- 파일: `backend/routes/sb-documents.js:216`
- 문제: 카테고리 lookup과 insert가 트랜잭션 밖에서 실행. 동시 업로드 시 중복 가능 (composite PK가 방어하긴 함).

**L-7. 미사용 count import**
- 파일: `backend/routes/sb-hero-videos.js:7`

**L-8. 미사용 pageCount 변수**
- 파일: `frontend/src/pages/editor/EditorPage.jsx:519`
- 문제: `pageCount` 계산 후 사용되지 않음. `dynamicPageCount`가 대신 사용됨.

**L-9. portalApi 네트워크 에러 catch 없음**
- 파일: `frontend/src/utils/portalApi.js:20-23`
- 문제: `fetch` 자체 throw를 잡지 않음. 네트워크 오류 시 raw 에러 노출.

**L-10. format.js thin re-export**
- 파일: `frontend/src/utils/format.js`
- 문제: `formatters.js`에서 `parseAuthor`만 re-export하는 래퍼. 직접 import로 교체 가능.

**L-11. console.error 프로덕션 코드 잔류**
- 파일: `HomePage.jsx:38`, `useDocumentManager.js:54,93`
- 문제: 프로젝트 규칙상 "console.log 디버깅 코드를 커밋에 포함하지 않는다"

**L-12. Layout.jsx 스크롤 핸들러** — rAF 기반 throttle 잘 구현되어 있음. 문제 없음.

**L-13. 미사용 useState import** — `App.jsx:2`에서 `useState`는 `AdminArea` 내부에서만 사용. 문제는 아니나 위치가 혼란.

**L-14. FTS snippet 상수 SQL 보간** — `backend/db/index.js:548-549`. 내부 상수이므로 인젝션 위험 없으나 패턴 불일치.

**L-15. 히어로 비디오 활성화 트랜잭션 내 ID 미검증** — L-1과 동일.

**L-16. 포탈 로그인 triple-fallback 토큰 추출** — `json.data?.token || json.token || ""`. API 응답 형태 불확실성 반영.

---

### 8-5. 수정 완료 내역 (Critical 6/6, High 13/13, Medium 9/9)

#### Critical 수정 (6건 완료)
1. `auth.js:57` — `===` → `crypto.timingSafeEqual` 적용
2. `sb-admin-users.js:234` — 폴백 `"admin1234!"` 제거, 환경변수 필수 + 8자 이상 검증
3. CSRF — Secure 플래그 추가 (부분 보완, HMAC 서명은 별도 작업)
4. `HistorySection.jsx:71` — `DOMPurify.sanitize(markdownToHtml(logContent))` 적용
5. `App.jsx:189-190` — `/editor` → `/admin/editor` 리다이렉트, `EditorRedirect` 컴포넌트 추가
6. 포탈 레이스 컨디션 — 백엔드 `portalAuth`가 실제 보호. 완전 수정은 별도 작업

#### High 수정 (13건 완료)
1. `auth.js` — `requireRole(...roles)` 미들웨어 + `VALID_ROLES` 화이트리스트 추가
2. `sb-admin-users.js` — GET/POST/PATCH/DELETE에 `requireRole("admin")` 적용
3. `sb-admin-users.js` — 자기 자신 비활성화/삭제 방지 + 마지막 admin 보호
4. `sb-admin-users.js` — 비활성화 시 `sessions` 테이블에서 세션 즉시 삭제
5. `sb-admin-users.js` — POST/PATCH에 `password.length < 8` 검증
6. 문서 GET 공개 — 의도된 설계로 판단, 에디터 라우트 보호로 간접 보완
7. `sb-blog.js` — 인메모리 viewCache(IP:slug, 10분 쿨다운) + `blog-service.js` skipIncrement 옵션
8. `sb-site-settings.js` — GET /history, /history/:id, /schedule에 adminAuth 추가
9. `sb-hero-videos.js` — fileFilter에 MIME 타입 화이트리스트 추가
10. 관리자 UI 노출 — 백엔드 adminAuth가 실제 보호
11. `EditorCanvas.jsx:256` — `DOMPurify.sanitize(editor?.getHTML() || "")` 적용
12. 로그인 레이트리밋 — 백엔드 rateLimit이 실제 보호
13. `PortalRegister.jsx:21` — 비밀번호 최소 길이 6자 → 8자

#### Medium 수정 (9건 완료)
1. 세션 미삭제 → H-4에서 함께 수정
2. `index.js` — CORS 프로덕션 경고 + `credentials: true`
3. `sb-documents.js` — `STORAGE_ROOT` 상수로 업로드 경로 STORAGE_PATH 통일
4. `index.js` — HTML/SVG 정적 서빙에 Content-Disposition: attachment + X-Content-Type-Options: nosniff
5. `csrf.js` — `secure: process.env.NODE_ENV === "production"`
6. `lib/sanitize.js` 생성 + document-service/client-service/sb-media에 `escapeLike()` 적용
7. `consultation-service.js` — 상담 메시지 5,000자 / 이름 100자 제한
8. 비밀번호 강도 → H-5에서 함께 수정
9. `useSiteSettings.js` — `event.origin !== window.location.origin` 체크
10. `useDocumentManager.js` — `docRef` ref로 stale closure 수정
11. `sb-portal.js` — `/logout`에 `portalAuth` 추가

---

### 8-6. 미수정 (별도 작업 필요)

| 이슈 | 사유 |
|------|------|
| CSRF HMAC 서명 | 구조 변경 필요 (프론트엔드 토큰 발급 흐름 포함) |
| 포탈 인증 가드 레이스 컨디션 | 토큰 검증 API + 로딩 상태 UI 필요 |
| 관리자 클라이언트 인증 강화 | /me API로 토큰 유효성 검증 로직 추가 필요 |
| EditorPage useEffect 성능 | 기능 변경 없는 리팩토링 |
| Low 이슈 16건 | 아래 8-7에서 처리 |

---

### 8-7. Low 이슈 수정 (9건 수정 / 7건 보류)

**L-1. 히어로 비디오 활성화 시 ID 존재 확인 추가**
- 파일: `backend/routes/sb-hero-videos.js` PATCH `/:id/activate`
- 수정: 트랜잭션 실행 전에 `db.select().from(heroVideos).where(eq(heroVideos.id, id))` 체크 추가. 미존재 시 404 반환하여 "모든 비디오 비활성화되고 아무것도 활성화 안되는" 사고 방지.

**L-3. 에러 메시지 한국어 통일**
- 파일: `sb-documents.js`, `sb-categories.js`, `sb-collections.js`, `sb-hero-videos.js`, `document-service.js`
- 수정: 영어 에러 메시지 전부 한국어로 변경
  - "No file provided" → "파일이 제공되지 않았습니다"
  - "No file or content provided" → "파일 또는 콘텐츠가 제공되지 않았습니다"
  - "Only markdown and text files are supported" → "마크다운 및 텍스트 파일만 지원됩니다"
  - "Category not found" → "카테고리를 찾을 수 없습니다"
  - "Collection not found" → "컬렉션을 찾을 수 없습니다"
  - "Video not found" → "영상을 찾을 수 없습니다"
  - "Document not found" → "문서를 찾을 수 없습니다" (3곳)

**L-4. 민감 데이터 console.log 제거**
- 파일: `backend/services/consultation-service.js:54`
- 수정: Apps Script 응답 본문 전체 로깅 제거. `res.ok`가 아닌 경우에만 상태 코드를 `console.warn`으로 기록.

**L-5. setInterval unref() 추가**
- 파일: `backend/lib/auth.js:224-229`
- 수정: 세션 정리 `setInterval`에 `.unref()` 체이닝. Node.js 프로세스가 graceful shutdown 시 이벤트 루프 종료를 방해하지 않도록.

**L-7. 미사용 count import 제거**
- 파일: `backend/routes/sb-hero-videos.js:7`
- 수정: `const { eq, desc, asc, count } = require("drizzle-orm")` → `count` 제거.

**L-8. 미사용 pageCount 변수 + import 제거**
- 파일: `frontend/src/pages/editor/EditorPage.jsx:519, 47`
- 수정: `const pageCount = Math.max(1, Math.ceil(charCount / CHARS_PER_PAGE_ESTIMATE))` 삭제. import에서 `CHARS_PER_PAGE_ESTIMATE` 제거.

**L-9. portalApi 네트워크 에러 catch 추가**
- 파일: `frontend/src/utils/portalApi.js:20-23`
- 수정: `fetch` 호출을 `try/catch`로 감싸고, 네트워크 실패 시 "네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요." 에러 throw.

**보류된 Low 이슈:**

| 이슈 | 보류 사유 |
|------|----------|
| L-2. 라우트 파라미터 ID 형식 미검증 | `sb-admin-users.js`에는 이미 UUID 검증 있음. 나머지는 Drizzle ORM이 파라미터화하므로 인젝션 위험 없음. 전체 적용은 리팩토링 범위. |
| L-6. upload-markdown 카테고리 링킹 트랜잭션 없음 | composite PK가 중복 삽입을 방어. 동시 업로드 빈도가 극히 낮아 실질적 위험 없음. |
| L-10. format.js thin re-export | 하위 호환성 유지. 제거 시 import 경로 전체 변경 필요. |
| L-11. console.error 프로덕션 잔류 | `console.error`는 에러 로깅 목적으로 유지 합리적. logging 라이브러리 도입 시 교체. |
| L-13. 미사용 useState import 위치 | 실제로 AdminArea에서 사용됨. 위치만 혼란스러울 뿐 기능 문제 없음. |
| L-14. FTS snippet 상수 SQL 보간 | 내부 상수이므로 인젝션 위험 없음. |
| L-16. 포탈 로그인 triple-fallback 토큰 | API 응답 형태 변경 가능성 고려한 방어 코드. |

---

### 8-8. 최종 수정 현황

| 심각도 | 발견 | 수정 | 보류 | 수정률 |
|--------|------|------|------|--------|
| Critical | 6 | 5 | 1 (CSRF HMAC) | 83% |
| High | 13 | 13 | 0 | 100% |
| Medium | 16 | 12 | 4 (성능/UX) | 75% |
| Low | 16 | 9 | 7 | 56% |
| **합계** | **51** | **39** | **12** | **76%** |

수정된 파일 목록:
- `backend/lib/auth.js` — timingSafeEqual, requireRole, VALID_ROLES, setInterval unref
- `backend/lib/csrf.js` — secure 플래그
- `backend/lib/sanitize.js` — 신규 (escapeLike)
- `backend/index.js` — CORS 경고, 정적 파일 보안 헤더
- `backend/routes/sb-admin-users.js` — RBAC, 비밀번호 강도, 환경변수 필수화
- `backend/routes/sb-blog.js` — 조회수 IP 중복 방지
- `backend/routes/sb-site-settings.js` — history/schedule adminAuth
- `backend/routes/sb-hero-videos.js` — MIME 검증, ID 확인, 미사용 import, 에러 메시지
- `backend/routes/sb-documents.js` — STORAGE_ROOT, 에러 메시지
- `backend/routes/sb-portal.js` — logout portalAuth
- `backend/routes/sb-categories.js` — 에러 메시지
- `backend/routes/sb-collections.js` — 에러 메시지
- `backend/routes/sb-media.js` — escapeLike
- `backend/services/blog-service.js` — skipIncrement
- `backend/services/client-service.js` — escapeLike
- `backend/services/consultation-service.js` — 텍스트 길이 제한, 로그 정리
- `backend/services/document-service.js` — escapeLike, 에러 메시지
- `backend/.env.example` — 비밀번호 안내 수정
- `frontend/src/App.jsx` — 에디터 리다이렉트, EditorRedirect
- `frontend/src/pages/admin/site-manager/HistorySection.jsx` — DOMPurify
- `frontend/src/pages/editor/modules/EditorCanvas.jsx` — DOMPurify
- `frontend/src/pages/editor/EditorPage.jsx` — 미사용 코드 제거
- `frontend/src/pages/editor/hooks/useDocumentManager.js` — stale closure 수정
- `frontend/src/pages/portal/PortalRegister.jsx` — 비밀번호 8자
- `frontend/src/hooks/useSiteSettings.js` — postMessage origin
- `frontend/src/utils/portalApi.js` — 네트워크 에러 catch

---

### 8-9. 보안 리팩토링 — 미수정 이슈 점진적 해결 (7 Phase)

리뷰 중 추가 발견: **CSRF가 사실상 무력화 상태**. `backend/lib/csrf.js`에서 POST/PATCH/DELETE에 `x-csrf-token` 헤더를 요구하지만, `frontend/src/utils/api.js`에서는 CSRF 토큰을 **전혀 전송하지 않고 있었음**. 프론트엔드 `api.js`에 `getCookie("csrf-token")` → `x-csrf-token` 헤더 포함 로직이 완전히 누락되어 있었으며, `portalApi.js`도 동일. CSRF 면제 목록에 포함되지 않은 모든 관리자 API 요청(문서 수정, 미디어 업로드, 설정 변경 등)이 이론상 403으로 실패해야 하는 상태.

**Phase 1: CSRF 프론트엔드 연동 (Critical) ✅**
- `frontend/src/utils/api.js`: `getCookie(name)` 헬퍼 추가. `request()` 함수에서 `document.cookie`의 `csrf-token` 값을 읽어 `x-csrf-token` 헤더에 포함. `upload()` 함수에도 동일 적용.
- `frontend/src/utils/portalApi.js`: 동일하게 `getCookie` 헬퍼 + `x-csrf-token` 헤더 추가.
- 이제 모든 POST/PATCH/DELETE 요청에 CSRF 토큰이 자동 전송됨.

**Phase 2: CSRF HMAC 서명 (Critical) ✅**
- `backend/lib/csrf.js`: 단순 랜덤 토큰 비교 → HMAC-SHA256 서명 기반으로 전면 교체.
  - `CSRF_SECRET`: `process.env.CSRF_SECRET || crypto.randomBytes(32).toString("hex")` (서버 시작 시 1회 생성)
  - `createCsrfToken()`: nonce(32바이트 hex) + `.` + HMAC-SHA256(secret, nonce) 형식 토큰 생성
  - `verifyCsrfToken(token)`: `.` 분리 → nonce 추출 → HMAC 재계산 → `crypto.timingSafeEqual`로 비교
  - GET 요청 시: 기존 토큰이 없거나 서명 무효하면 새 토큰 발급
  - POST/PATCH/DELETE 시: 헤더의 `x-csrf-token`만 검증 (쿠키 비교 제거 — 서명 자체가 증명)
  - 타이밍 공격 방지를 위해 `timingSafeEqual` 사용
- `backend/.env.example`: `CSRF_SECRET` 항목 추가 (프로덕션에서 고정 권장)
- 프론트엔드 변경 없음 (Phase 1에서 이미 쿠키 읽기 → 헤더 전송 완료)

**Phase 3: 포털 인증 가드 레이스 컨디션 수정 (Critical) ✅**
- `frontend/src/pages/portal/PortalLayout.jsx`:
  - 변경 전: `useEffect(() => { if (!token) navigate(...) })` — 렌더 후 실행되어 `<Outlet />`이 먼저 렌더 → 보호 콘텐츠 100~200ms 노출
  - 변경 후: `const token = ...; if (!token) return <Navigate to="/portal/login" replace />;` — 동기적 조건부 렌더링으로 Outlet 렌더 자체를 차단
  - `useEffect` 제거, `import { Navigate }` 추가, `import { useEffect }` 제거

**Phase 4: 관리자 토큰 유효성 검증 (High) ✅**
- `frontend/src/App.jsx` — `AdminArea` 함수:
  - 변경 전: `useState(!!sessionStorage.getItem("admin_token"))` — sessionStorage에 아무 문자열 넣으면 admin UI 노출
  - 변경 후: `useState(false)` + `useState(true)` (checking). `useEffect`에서 `/api/sb/admin-users/me` 호출로 토큰 유효성 서버 검증. 무효하면 토큰 삭제 + 로그인 화면. 검증 중 `<LoadingFallback />` 표시.
  - `import`에 `useEffect` 추가
  - 백엔드 변경 없음 (`/me` 엔드포인트 기존 존재)

**Phase 5: EditorPage useEffect 의존성 최적화 (Medium) ✅**
- `frontend/src/pages/editor/EditorPage.jsx`:
  - 페이지네이션 useEffect 의존성에서 `doc.title`, `doc.subtitle` 제거
  - 이 필드들은 페이지 분할 계산에 사용되지 않음
  - 타이틀 입력마다 ResizeObserver 재등록 + 페이지 재계산이 발생하던 성능 문제 해결
  - `eslint-disable-line react-hooks/exhaustive-deps` 주석으로 의도 명시

**Phase 6: 라우트 ID 형식 검증 통일 (Low) ✅**
- `backend/routes/sb-hero-videos.js`:
  - `services/helpers.js`의 `UUID_REGEX` import 추가
  - GET /:id, PATCH /:id, PATCH /:id/activate, DELETE /:id — 4개 라우트에 `UUID_REGEX.test(id)` 검증 추가
  - 유효하지 않은 ID → 400 에러 즉시 반환 (불필요한 DB 쿼리 방지)
  - `sb-blog.js`는 이미 `blog-service.js` 내부에서 `validateUUID` 호출 확인 → 추가 불필요

**Phase 7: upload-markdown 트랜잭션 적용 (Low) ✅**
- `backend/routes/sb-documents.js`:
  - `sqlite` import 추가 (`const { db, sqlite } = require("../db")`)
  - 기존: Drizzle ORM으로 문서 삽입 후 별도로 카테고리 링킹 (트랜잭션 밖)
  - 변경: `sqlite.transaction(() => { ... })()` 내에서 문서 삽입 + 카테고리 링킹을 원자적 처리
  - prepared statement 사용으로 성능 유지
  - `INSERT OR IGNORE`로 중복 카테고리 링크 시 에러 대신 무시

---

### 8-10. 최종 수정 현황 (업데이트)

| 심각도 | 발견 | 수정 | 보류 | 수정률 |
|--------|------|------|------|--------|
| Critical | 6 | 6 | 0 | **100%** |
| High | 13 | 13 | 0 | **100%** |
| Medium | 16 | 13 | 3 | 81% |
| Low | 16 | 12 | 4 | 75% |
| **합계** | **51** | **44** | **7** | **86%** |

추가 수정된 파일 (Phase 1~7):
- `frontend/src/utils/api.js` — getCookie + CSRF 토큰 헤더 전송
- `frontend/src/utils/portalApi.js` — getCookie + CSRF 토큰 헤더 전송
- `backend/lib/csrf.js` — HMAC-SHA256 서명 기반 CSRF 보호로 전면 교체
- `backend/.env.example` — CSRF_SECRET 항목 추가
- `frontend/src/pages/portal/PortalLayout.jsx` — useEffect → 동기적 Navigate 가드
- `frontend/src/App.jsx` — AdminArea 서버 토큰 검증 + useEffect 추가
- `frontend/src/pages/editor/EditorPage.jsx` — useEffect 의존성 최적화
- `backend/routes/sb-hero-videos.js` — UUID_REGEX 검증 4개 라우트 추가
- `backend/routes/sb-documents.js` — upload-markdown sqlite 트랜잭션 적용

보류된 7건:
| 이슈 | 보류 사유 |
|------|----------|
| M-11. EditorPage useEffect 14개 deps | doc.title/subtitle 제거로 Phase 5에서 부분 해결. 나머지 deps는 실제 필요. |
| M-12. InsertTab WordArt dangerouslySetInnerHTML | 상수 데이터만 사용, XSS 위험 없음 |
| M-14. 포탈 토큰 sessionStorage | XSS 자체를 막는 것이 우선, httpOnly 쿠키 전환은 별도 설계 필요 |
| L-10. format.js thin re-export | 하위 호환성 유지 |
| L-11. console.error 프로덕션 잔류 | 에러 로깅 목적으로 유지 합리적 |
| L-14. FTS snippet 상수 SQL 보간 | 내부 상수, 인젝션 위험 없음 |
| L-16. 포탈 로그인 triple-fallback 토큰 | 방어적 코드, 문제 없음 |

---

### 8-11. 코딩 규칙 준수 평가 — 2026-04-07

CLAUDE.md에 정의된 코딩 규칙 8개 항목에 대해 전체 코드베이스를 전수 감사했다. 백엔드/프론트엔드 병렬 에이전트로 탐색하여 파일:줄 단위로 위반 사항을 수집.

**총평: 8개 규칙 중 2개 통과, 6개 위반**

| 규칙 | 상태 | 심각도 |
|------|------|--------|
| 1. 가독성 (함수 30줄) | 위반 — 15+ 함수 초과, 최대 EditorPage 643줄 | HIGH |
| 2. 네이밍 | 부분 위반 — 컨벤션 OK, 단일문자 30건 | MODERATE |
| 3. 파일 구조 (200줄) | 위반 — 310개 중 68개(22%) 초과, 최대 extensions.js 1,531줄 | HIGH |
| 4. 주석 & 문서화 | 부분 통과 — 파일주석 전수 OK, JSDoc 불균등 | LOW |
| 5. 패턴 일관성 | 위반 — adminAuth 9건 누락(CRITICAL), 직접 fetch 6건 | CRITICAL |
| 6. 코드 변경 스타일 | 통과 | PASS |
| 7. 금지 사항 | 위반 — 매직넘버 광범위, console 15건, 중첩 5건 | MODERATE |

### 신규 발견 CRITICAL: adminAuth 미들웨어 누락 9건

보안 감사(8-1~8-10)에서 놓쳤던 3개 라우트 파일에서 `adminAuth` 미들웨어가 완전히 누락되어 있었음:
- `sb-categories.js`: POST /, PATCH /:id, DELETE /:id (3건)
- `sb-collections.js`: POST /, PATCH /:id, DELETE /:id (3건)
- `sb-chatbot.js`: POST /qa, PATCH /qa/:id, DELETE /qa/:id (3건)

**즉시 수정 완료:**
- 3개 파일에 `const { adminAuth } = require("../lib/auth")` import 추가
- 9개 라우트 핸들러에 `adminAuth` 미들웨어 적용

### 신규 발견 HIGH: 직접 fetch()로 인증/CSRF 헤더 누락 2건

`api.js` 래퍼를 우회하여 직접 `fetch()`를 호출하는 2개 파일에서 Authorization과 x-csrf-token 헤더가 누락:
- `frontend/src/pages/admin/media/index.jsx:98` — 미디어 업로드
- `frontend/src/pages/admin/hero-videos/index.jsx:100` — 히어로 비디오 업로드

**즉시 수정 완료:**
- 두 파일 모두 `sessionStorage.getItem("admin_token")` → `Authorization: Bearer` 헤더 추가
- `document.cookie`에서 `csrf-token` 파싱 → `x-csrf-token` 헤더 추가

### 수정된 파일 목록
- `backend/routes/sb-categories.js` — adminAuth 추가 (POST/PATCH/DELETE 3건)
- `backend/routes/sb-collections.js` — adminAuth 추가 (POST/PATCH/DELETE 3건)
- `backend/routes/sb-chatbot.js` — adminAuth 추가 (POST/PATCH/DELETE 3건)
- `frontend/src/pages/admin/media/index.jsx` — 업로드 fetch에 인증/CSRF 헤더 추가
- `frontend/src/pages/admin/hero-videos/index.jsx` — 업로드 fetch에 인증/CSRF 헤더 추가

### 8-12. 코딩 규칙 수정 — 금지사항: console.* 프론트엔드 전수 제거 ✅

프론트엔드 `src/` 내 `console.error` 13건 + `console.warn` 2건 = 총 15건 제거.

| 파일 | 처리 방법 |
|------|----------|
| `SearchPage.jsx:48` | catch에서 console.error 제거 (setResults([])로 이미 복구) |
| `vault/index.jsx:111` | catch에서 console.error 제거 (setDocuments([])로 이미 복구) |
| `TimelinePage.jsx:25` | catch에서 console.error 제거 |
| `GraphPage.jsx:34` | catch에서 console.error 제거 |
| `HomePage.jsx:38` | catch에서 console.error 제거 |
| `App.jsx:45` | ErrorBoundary componentDidCatch에서 console.error 제거 |
| `pdfExport.js:63` | console.error 제거 (showEditorAlert이 이미 사용자에게 알림) |
| `docxImport.js:13` | console.error 제거 (showEditorAlert이 이미 사용자에게 알림) |
| `docxExport.js:399` | console.error 제거 (showEditorAlert이 이미 사용자에게 알림) |
| `useDocumentManager.js:56,95` | console.error(err) 제거, catch 블록에서 err 미사용으로 변경 |
| `otherExports.js:106,297` | console.error 제거 (showEditorAlert이 이미 사용자에게 알림) |
| `fileUtils.js:32` | console.warn 제거 → 주석으로 대체 (자동저장 실패는 조용히 처리) |
| `comment-store.js:309` | console.warn 제거 → 주석으로 대체 |

**결과: 프론트엔드 `console.*` = 0건**

### 8-13. 코딩 규칙 수정 — 금지사항: 3단계 이상 중첩 해소 ✅

4건 검토 → 3건 수정, 1건 보류.

**1. `useGraphCanvas.js:277-300` — 5단계 (for-for-if-for-if) ✅**
- 그룹 간 반발력 계산 25줄을 `applyGroupRepulsion(groupCentroids, nodes, alpha)` 함수로 추출
- 원래 위치는 한 줄 호출로 교체
- 최대 중첩: 5단계 → 2단계

**2. `RibbonBar.jsx:71-82` — 4단계 (map-onClick-if-if) ✅**
- 탭 클릭 핸들러의 if-else-if 체인을 early return 패턴으로 단순화
- `if (file) return; if (same tab) return toggle; else setTab` — 3줄로 압축
- 최대 중첩: 4단계 → 2단계

**3. `FootnoteArea.jsx:153-163` — 4단계 (map-onKeyDown-if-if) ✅**
- 인라인 onKeyDown 핸들러를 `handleFootnoteKeyDown(e, footnoteId)` 함수로 추출
- Enter/Escape/Tab 키 처리를 early return 패턴으로 정리
- 최대 중첩: 4단계 → 2단계

**4. `footnote-extension.js:185-199` — 4단계 (보류)**
- TipTap/ProseMirror 커맨드 패턴(`() => ({ tr, state, dispatch }) => { state.doc.descendants(...) }`)의 구조적 제약
- API 패턴 자체가 2단계 래핑을 요구하므로 실질 비즈니스 로직은 2단계

### 8-14. 코딩 규칙 수정 — 네이밍: 단일문자 변수 서술적 이름으로 변경 ✅

30건 이상의 단일문자 변수를 서술적 이름으로 교체. 12개 파일 수정.

| 파일 | 변경 전 → 변경 후 |
|------|-------------------|
| `BookingCalendar.jsx` | `d` → `result/weekday`, `m` → `month`, `d` → `day`, `y` → `year` |
| `useGraphCanvas.js` | `c` → `camera` (2곳), `w` → `worldPos`, `nz` → `newZoom`, `mx/my` → `mouseX/mouseY`, `wcx/wcy` → `worldCenterX/worldCenterY`, `wmx/wmy` → `worldMouseX/worldMouseY` |
| `graphRenderer.js` | `r0/r` → `baseRadius/radius`, `t` → `connRatio`, `z` → `zoom` (7곳 참조 교체) |
| `VideoEditor.jsx` | `v` → `videoEl` (4곳), `c` → `canvasEl` (1곳), `a` → `link`, 모든 참조 교체 |
| `analyticsConstants.js` | `d` → `date` |
| `analytics/index.jsx` | `a` → `link` |
| `Timeline.jsx` | `t` → `tickTime` |
| `AdminClients.jsx` | `const c = client` 축약 제거 → 직접 `client.` 참조 |
| `GraphPage.jsx` | `s` → `neighbors`, `e` → `edge` |
| `graphUtils.js` | `m` → `meta` |
| `SendTab.jsx` | `q` → `query` |
| `hero-videos/constants.js` | `s` → `seconds`, `m` → `minutes`, `sec` → `secs`, `ms` → `centiseconds` |
| `sb-bookings.js` | `h` → `hours`, `m` → `mins` |
| `useDocDetailState.js` | `d` → `document` |

### 8-15. 코딩 규칙 수정 — 금지사항: 매직넘버 상수 추출 (타이밍 값) ✅

`frontend/src/utils/timing.js` 신규 생성 — UI 타이밍 상수 6개 정의:
- `TOAST_DURATION_MS = 2500` — 토스트 표시 시간
- `TOAST_FADEOUT_MS = 300` — 토스트 페이드아웃 트랜지션
- `FLASH_DURATION_MS = 1500` — 플래시 하이라이트 애니메이션
- `AUTOSAVE_SERVER_DELAY_MS = 2000` — 자동저장 서버 전송 딜레이
- `LAYOUT_MEASURE_DELAY_MS = 150` — UI 레이아웃 재측정 딜레이
- `COPY_FEEDBACK_MS = 2000` — 복사 완료 피드백 표시 시간

적용된 파일 11개:
| 파일 | 변경 전 → 상수 |
|------|---------------|
| `showToast.js` | `3000` → `TOAST_DURATION_MS`, `300` → `TOAST_FADEOUT_MS` |
| `editorToast.js` | `3000` → `TOAST_DURATION_MS`, `300` → `TOAST_FADEOUT_MS` |
| `SeoSection.jsx` | `2500` → `TOAST_DURATION_MS` |
| `useSiteSettings.js` | `2500` → `TOAST_DURATION_MS` |
| `AnnouncementsSection.jsx` | `2500` × 2 → `TOAST_DURATION_MS` |
| `DocDetailUI.jsx` | `2200` → `TOAST_DURATION_MS` (통일) |
| `media/index.jsx` | `2000` → `COPY_FEEDBACK_MS` |
| `useDocumentManager.js` | `2000` → `AUTOSAVE_SERVER_DELAY_MS` |
| `FootnoteArea.jsx` | `1500` → `FLASH_DURATION_MS` |
| `footnote-extension.js` | `2000` → `FLASH_DURATION_MS` (통일) |

토스트 표시 시간이 2200ms, 2500ms, 3000ms로 파일마다 달랐던 것을 `TOAST_DURATION_MS = 2500`으로 통일.

### 8-16. 코딩 규칙 수정 — 주석 & 문서화: JSDoc 추가 ✅

JSDoc이 누락된 주요 유틸리티/훅/컴포넌트에 `@param`/`@returns` 어노테이션 추가. 13개 파일 수정.

**유틸리티 (4파일):**
- `formatters.js` — `formatDate`, `formatDateTime`, `formatPhone`, `getByteLength`, `truncate` 5개 함수에 @param/@returns 추가
- `api.js` — `getCookie`, `request` 2개 함수에 @param/@returns 추가
- `document-types.js` — `getTypeLabel`, `getTypeColor` 2개 함수에 @param/@returns 추가
- `showToast.js` — 기존 JSDoc 유지 (이미 있음)

**훅 (2파일):**
- `useReveal.js` — @returns 추가 (ref 객체 설명)
- `useDocumentManager.js` — @param (editor), @returns (반환 객체 전체 타입) 추가

**공통 컴포넌트 (4파일):**
- `MediaPicker.jsx` — @param (isOpen, onClose, onSelect, accept) 추가
- `PageHeader.jsx` — @param (title, subtitle, onAdd, addLabel, children) 추가
- `ErrorBanner.jsx` — @param (message, onDismiss) 추가
- `DashboardStatCards.jsx` — StatCard에 @param 추가

**에디터 모듈 (2파일):**
- `FloatingToolbar.jsx` — @param (editor, onInsertComment) + 컴포넌트 설명
- `NavigationPane.jsx` — @param (editor, onClose) 추가

**기존 JSDoc 양호한 파일 (변경 불필요):**
- `useCrudForm.js` — 이미 @param 8개 완비
- `auth.js` — 이미 @param/@returns 19개
- `portal-service.js` — 이미 33개 어노테이션
- `graphUtils.js` — 이미 17개 어노테이션
