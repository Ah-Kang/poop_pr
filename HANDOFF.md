# 개발 인수인계

작성일: 2026-08-04

## 프로젝트 개요

React 19 + Vite 기반 모바일 세로형 클리커 게임입니다. 프런트엔드는 `src/App.jsx`, 로컬 백엔드는 `server/`에 있습니다.

## 현재 구현된 기능

- 클릭 및 초당 자동 생산
- 똥 캐릭터 강화·진화·선택
- 청소 장비 구매·강화
- 화장실 구매와 단계별 배경
- 청소 직원 습격 이벤트
- 0.5초 유예를 둔 초기화 버튼과 3회 클릭 개발자 모드
- 카카오 REST API 로그인, 로그아웃, 닉네임·프로필 처리
- 서명된 OAuth state 검증과 메모리 로그인 세션
- SQLite 사용자·점수·전체 게임 저장
- 전체 랭킹과 똥·화장실·청소 장비 구성 표시
- 로그인 계정 게임 진행도 10초 간격 저장

## UI 상태

- 최신 UI: `UI v1.6.0 · 2026-08-04`
- 상세 변경 기록: `UI_CHANGELOG.md`
- 화장실 배경: 귀여운 일러스트 WebP 6종
- 청소 장비: 플랫폼에 관계없이 동일한 투명 PNG 아이콘 6종

## 보안 주의

- `.env`는 Git에서 제외되어 있습니다.
- 카카오 Client Secret, Supabase DB 비밀번호, Session Secret을 GitHub에 올리지 마세요.
- 이전 Windows 화면 캡처에 비밀값이 노출되었으므로 카카오 Client Secret과 Supabase Database Password를 반드시 재발급해야 합니다.
- 이 문서나 Codex 대화에 실제 키를 붙여넣지 마세요.

## macOS에서 시작하기

```bash
git clone https://github.com/Ah-Kang/poop_pr.git
cd poop_pr
npm install
cp .env.example .env
```

`.env`에 재발급한 값을 직접 입력합니다. Node.js 24 이상을 권장합니다. `DATABASE_URL`이 없으면 `server/database.js`가 Node 내장 `node:sqlite`로 로컬 저장소를 사용하고, `DATABASE_URL`이 있으면 Supabase PostgreSQL을 우선 사용합니다.

프런트엔드와 백엔드를 서로 다른 터미널에서 실행합니다.

```bash
npm run dev
npm run dev:server
```

- 프런트엔드: `http://localhost:5173`
- 백엔드: `http://localhost:3001`
- 카카오 Redirect URI: `http://localhost:3001/auth/kakao/callback`

## 환경변수

`.env.example`을 참고합니다.

- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`
- `KAKAO_REDIRECT_URI`
- `FRONTEND_URL`
- `SESSION_SECRET`
- `PORT`
- `DATABASE_URL`
- `DATABASE_SSL`
- `SUPABASE_URL` / `SUPABASE_SECRET_KEY`는 Secret Key 방식으로 전환할 때 사용

## 현재 데이터 저장 구조

- 로컬 DB: `data/game.db`
- DB 파일은 Git에 포함되지 않습니다.
- 테이블: `users`, `scores`, `game_saves`
- 서버 재시작 시 로그인 세션은 풀리지만 SQLite의 사용자·랭킹·게임 저장 데이터는 남습니다.

## Supabase 진행 상태

- Supabase 프로젝트는 생성했습니다.
- Session pooler 주소 형식은 확인했습니다.
- Supabase Session pooler 연결은 macOS 로컬 `.env` 기준으로 성공했습니다.
- PostgreSQL 드라이버 `pg`는 설치되어 있습니다.
- 온라인 테이블 생성 SQL은 `supabase/schema.sql`에 있습니다.
- `server/database.js`는 PostgreSQL 우선, SQLite fallback 구조로 전환했습니다.
- 서버 시작 시 PostgreSQL 모드에서는 `users`, `scores`, `game_saves` 기본 테이블을 자동 생성합니다.
- 로컬 카카오 로그인 후 Supabase `users`, `scores`, `game_saves` 저장과 랭킹 표시를 확인했습니다.
- 기존 SQLite DB에는 이전할 데이터가 없었습니다.

## 서버 배포

현재 서버는 Express가 `dist/` 정적 프런트엔드와 `/api`, `/auth` 백엔드를 함께 제공합니다. Render 같은 Node Web Service에 배포하기 적합합니다.

Render 배포 기본값은 `render.yaml`에 있습니다.

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`

배포 서비스 환경변수에 아래 값을 직접 입력합니다. 실제 비밀값은 GitHub나 문서에 쓰지 않습니다.

- `NODE_ENV=production`
- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`
- `KAKAO_REDIRECT_URI=https://배포도메인/auth/kakao/callback`
- `FRONTEND_URL=https://배포도메인`
- `SESSION_SECRET`
- `DATABASE_URL`
- `DATABASE_SSL=true`

배포 후 Kakao Developers에도 아래 Redirect URI를 추가해야 합니다.

- `https://배포도메인/auth/kakao/callback`

## 다음 구현 순서

1. 노출된 카카오 Client Secret과 Supabase DB 비밀번호 재발급
2. macOS `.env` 구성 및 카카오 로그인 재검증
3. Supabase Session pooler 연결 성공 확인: `npm run db:check`
4. 필요한 경우 Supabase SQL Editor에서 `supabase/schema.sql` 적용
5. SQLite 데이터를 Supabase PostgreSQL로 일회성 이전: `npm run db:migrate:sqlite`
6. 온라인 저장·전체 랭킹을 실제 여러 기기에서 검증
7. Render 또는 다른 Node 호스팅에 Web Service 배포
8. 배포 도메인을 Kakao Redirect URI와 환경변수에 반영
9. 친구 코드 기반 친구 추가와 친구 랭킹 구현
10. 서비스 완성 후 카카오 친구 목록 권한 신청
11. Capacitor로 Android/iOS 앱 패키징

## 검증 명령

```bash
npm run build
npm run check:server
npm run db:check
node --check server/index.js
node --check server/database.js
```

## Codex에서 이어가기

맥북의 Codex 앱에서 이 저장소 폴더를 프로젝트로 열고 다음과 같이 요청합니다.

> `HANDOFF.md`와 `UI_CHANGELOG.md`를 모두 읽고, 기존 Windows 작업을 이어서 Supabase Session pooler 연결부터 진행해줘. 비밀값은 출력하거나 Git에 포함하지 마.
