# 2026-04-05 | Gmail 앱 비밀번호 + Google Sheets 서비스 계정 설정 안내

## 프롬프트
> Workspace 관리 콘솔 → 보안 → 기본 설정에서 허용해야 합니다. 이거 정확히 어떻게 해야되는지 하나씩 알려줘
> Gmail 앱 비밀번호 생성 완료
> 두개 다 어떻게하는지 하나씩 단계별로 자세히 알려줘 (서비스 계정 + 스프레드시트)

## 작업 내용

### 1. Google Workspace 2단계 인증 허용 안내
- admin.google.com → 보안 → 인증 → 2단계 인증
- "사용자가 2단계 인증을 사용하도록 허용" 체크 → 저장
- 본인 계정에서 2단계 인증 활성화 후 앱 비밀번호 생성

### 2. Gmail 앱 비밀번호 저장
- 사용자가 생성한 앱 비밀번호를 `backend/.env`에 저장
- `GMAIL_USER=younsehwan@younjeong.com`
- `GMAIL_APP_PASSWORD=****` (보안상 기록 생략)
- `.gitignore`에 `.env` 포함 확인 완료

### 3. Google Cloud 서비스 계정 생성 안내
- Google Cloud Console에서 프로젝트 생성 (yjlaw)
- Google Sheets API 활성화
- 서비스 계정 생성 (yjlaw-sheets)
- JSON 키 다운로드 → backend/ 폴더에 배치

### 4. Google 스프레드시트 생성 + 공유 안내
- sheets.google.com에서 새 스프레드시트 생성
- 서비스 계정 이메일에 편집자 권한 공유
- 스프레드시트 URL 확인

## 상태
- Gmail 앱 비밀번호: 완료 ✅
- 서비스 계정 JSON: 사용자 진행 대기 중
- 스프레드시트 URL: 사용자 진행 대기 중

## 수정 파일
- `backend/.env` (신규 생성, gitignore 적용)
