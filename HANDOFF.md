## 2026-11-20 — 선택한 캐릭터 6종 실제 적용

- 피래미 B / 푸딩 A / 건강 C / 단단 C / 화산 A / 용암 C 시안을 사용해 image_gen으로 투명 배경 PNG 제작, 기존 src/assets/PoopImage의 대응 6개 파일 교체.
- 1254×1254 RGBA 원본 유지. src/scene/poopBounds.json의 알파 96 이상 실루엣 경계 갱신으로 SeatedPoop/PoopPortrait 정렬 보정.
- 미니게임·공방에서 공유하는 건강똥도 새 이미지 반영. 게임 진행과 수치는 변경 없음.
- exports/character-concepts-2026-11-20/selected-sprites.json에 선택 시안·제작 프롬프트·생성 출처 기록. previous-game-sprites에 교체 전 6종 보관. selected-transparent-sprites.zip으로 적용 이미지 제공.
- 투명도/경계 검증 및 빌드 통과. 기존 20종 exports/poop-characters와 contact sheet는 교체 전 기록이므로 현재 아트의 기준은 src/assets/PoopImage.

## 2026-11-20 — 진화 연출 / 강화 캐릭터 단독 표시

- 진화 성공 시 EvolutionCelebration: 0.7초 힘 모으기 → 파동·12개 입자 → 새 캐릭터 확대 등장 → 기본 클릭/자동 생산 전후 수치. 확인 버튼 또는 Escape로 닫기, native dialog 포커스 제어, reduced-motion 대응.
- 진화 능력/저장은 즉시 반영하고 연출은 별도 UI 상태로만 관리. 중복 진화 클릭 잠금. 보상 추가 없음.
- 강화 탭 미리보기는 PoopPortrait로 변경: 장착된 변기뚜껑 모자·오라를 표시하지 않고 PNG 여백을 정규화해 캐릭터만 확대. 실제 장착/메인/꾸미기 화면은 유지.
- /evolution-preview.html: 개발 환경 전용, 실제 게임 데이터 변경 없는 재생 확인용 샘플. 브라우저에서 단독 캐릭터, 애니메이션 적용, 확인 후 닫기 및 재생 확인. 빌드 및 성장 테스트 5개 통과.

## 2026-11-20 — 빠른 초반 진화와 능력 계승

- 진화 조건: 5/10/15/20/25/30/35/40/50/60/70/80/90/100/100/100/100/100/100, 황금똥은 최종 단계.
- `shared/poop-progression.js`: 각 다음 단계의 Lv.1은 이전 단계 진화 조건 또는 실제 보유 레벨 중 높은 쪽의 클릭·자동 생산량을 최소 1.3배 계승. 자동 생산 0이면 다음 단계에서 최소 1/초. 저장된 레벨에서 계산하므로 저장 형식 변경이나 중복 보너스 없음.
- 강화 비용은 단계 Lv.1 기본 클릭 × 20 × 1.025^(레벨-1), 올림. 보유 레벨에 따른 계승 보너스는 가격에 재반영하지 않음. 첫 진화 Lv.5, 시작 비용 20 유지.
- 기존 보유 레벨 및 이전 6종 저장 데이터의 Lv.100 마이그레이션 기준 보존. 진화 패널에 조건과 전후 기본 능력치 표시.
- `npm run test:progression`: 전체 진화 상승, 고레벨 저장/재로드, 기존 능력 하락 방지, 초반 속도, 비용 및 최종 성장 검증 5개 통과. 실제 장기 플레이 속도는 추가 조정 가능.

# 개발 인수인계

## 2026-09-23 — 공방 C안 실제 적용

- EconomyPanel의 제작/미니게임/토큰 탭을 제거하고 단일 페이지 대시보드로 변경.
- 다음 화장실 사진/부품 진행률/제작 버튼을 작은 카드로 배치. 미니게임 바로가기와 일일 무료 토큰 버튼을 나란히 표시.
- 현재 화장실 배경/크림색 패널/청록·노란색 입체 버튼으로 메인 및 C안 퍼즐과 통일.
- 광고와 구매는 준비 중으로 유지. 도감 미리보기와 전체 도감 펼치기, 게스트 로그인, 최종 단계 개조 지원.
- 개발자 토큰·광고·경제 테스트를 하단 개발자 테스트에 모음. 기존 DEV 및 서버 권한 제한 유지.
- 빌드 통과. 375×667/320×568에서 주요 버튼 표시와 가로 넘침 없음, 미니게임 바로가기/공방 복귀 확인. 재화 규칙과 저장 로직 변경 없음.
- 로컬에서 이전 PWA 서비스워커가 Vite 소스를 캐시해 과거 공방을 보여주는 현상 확인. src/main.jsx 개발 모드에서 기존 등록 해제 후 필요 시 한 번 새로고침; 운영 등록 흐름은 유지. 미니게임 이동/뒤로가기 후에도 C안 유지 확인.
- 로컬 적용, 미배포.


## 2026-09-23 — C안 퍼즐 UI 적용

- 실제 `/minigame`에 C안 적용: 상단 크림색 재화/콤보 패널, 작은 제목, 8×8 퍼즐, 공방/힌트/기록 입체 버튼.
- 점수/이동 횟수/최고 기록/배경 이름은 기록 창으로 이동. 충분한 높이에서는 물똥 안내 카드 표시, 짧은 화면에서는 생략.
- 남은 화면 높이와 너비로 퍼즐 크기를 계산. 375×667 및 320×568에서 64칸/버튼이 모두 스크롤 없이 표시됨을 브라우저에서 확인.
- `src/data/toilets.js`를 메인과 퍼즐이 공유. 공통 지갑의 toiletLevel에 해당하는 배경 사용(20개 모두 빌드용 asset import).
- 빌드/배경 20개 경로/변경 형식 검사 통과. 실제 힌트/교환/콤보 적립/기록 창 동작 확인. 경제와 매칭 규칙은 그대로 유지.
- 로컬 적용, 미배포.


## 2026-09-22 — 무제한 콤보 퍼즐 (현재 규칙)

- 입장 8토큰, 이동 무제한. 공방 나가기는 종료하며 재입장은 8토큰. 새로고침/연결 끊김은 무료 이어하기.
- 스테이지·목표·결과 덮개를 제거하고 입장 중 획득 부품·최고 연쇄·10칸 누적 콤보 게이지 표시. 이전 스테이지 기록은 보존만 함.
- 4개 한 줄 폭발, 5개 이상 같은 그림 싹쓸이, 2×2/3×3 주변 폭발, ㄱ·ㄴ 네 방향 모서리 폭발.
- 기본 매칭 +1콤보, 특수 폭발/연쇄는 추가 적립. 10콤보마다 부품 1개 자동 교환. 지갑 comboProgress에 잔여 콤보를 저장해 퇴장/재입장에도 유지. 정확한 보상식과 API는 `ECONOMY_INTEGRATION.md` 참고.
- 교환/복귀·폭발 입자/파동·부품 팝업·중력 낙하 애니메이션, 동작 줄이기 설정 지원.
- 이동/부품은 서버 또는 게스트 공통 지갑에 원자적으로 저장. 종료 보상 중복 지급 없음. 기존 유료 판은 무료 변환.
- 검증: 퍼즐 테스트 11개, 재화/API 테스트 14개, 빌드. 브라우저에서 4연쇄 → 콤보 +11 → 부품 1개 자동 교환/콤보 1 유지 확인.
- 로컬 변경만 적용, 배포/푸시하지 않음. 아래의 스테이지 방식 기록은 이전 구현 내역.


작성일: 2026-08-04

## 개발 재개 (2026-09-21)

Node.js 24에서 다음 명령 하나로 로컬 프런트엔드와 백엔드를 함께 실행합니다.

```bash
npm run dev:local
```

- 게임: `http://127.0.0.1:5173` (Vite, 프런트엔드 변경 자동 반영)
- 백엔드: `http://127.0.0.1:3001` (Node watch, 서버 코드 변경 시 재시작)
- 실행을 끝내려면 터미널에서 `Ctrl+C`를 누릅니다.
- `.env`를 수정하지 않고 클라우드 DB 대신 `data/dev-game.db`를 사용합니다. 기존 `data/game.db`와 운영 데이터는 유지됩니다.
- 로컬 모드에서는 카카오 연결을 끕니다. 게임의 **다른 계정으로 시작하기 → 회원가입**으로 개발 전용 계정을 만들 수 있습니다.
- 개발 서버를 완전히 재실행하면 세션 키가 바뀌므로 다시 로그인해야 합니다. 계정과 저장 데이터는 유지됩니다.
- 기본 `npm run dev` / `npm run dev:server` 명령은 기존처럼 `.env`의 Supabase 설정을 사용합니다.

서버 점검에서 Supabase `poop_pr` 프로젝트의 일시 중지와 Render의 DB 초기화 실패를 확인했습니다. 같은 증상이 재발하면 Supabase 대시보드에서 프로젝트 상태를 확인하고 재개한 뒤 Render 로그와 `/api/health`를 확인하세요. 유료 전환은 별도 결정 사항입니다.

이번 점검에서는 Supabase 프로젝트를 재개했고 복원 완료를 확인했습니다. 기존 연결 설정으로 `SELECT 1`이 성공했으며, 운영 `https://poop-pr.onrender.com/api/health`가 `ok: true`, `database: postgres`를 반환하고 게임 화면도 정상 로드됐습니다.

검증: Vite 프로덕션 빌드, 서버 구문 검사, 별도 임시 SQLite DB에서 회원가입·로그인·저장/불러오기·랭킹, 응답 없는 PostgreSQL 연결의 10초 제한을 확인했습니다.

로컬 수정에서는 PostgreSQL 연결·쿼리 대기 시간을 제한하고 `/api/health`가 실제 DB 연결을 검사하도록 보완했습니다. DB 장애 시 `503 database_unavailable`을 반환합니다. 운영 서버 적용에는 이 변경의 커밋·배포가 필요합니다.

## 프로젝트 개요

### 토큰·부품 경제 구조 (2026-09-21)

- `shared/economy.js`: 재화와 제작 규칙. 가격/보상 밸런스는 이 파일에서 조절합니다.
- `src/economy/`: 공방 UI, 공통 클라이언트와 React 상태 연결.
- 계정은 `player_economy`에 지갑을 저장하고 `economy_actions`로 요청 중복 처리를 막습니다. SQLite/PostgreSQL 모두 트랜잭션을 사용합니다.
- 게스트는 별도 `poop-pr-guest-economy-v1` 지갑을 사용합니다. 체험 재화는 계정에 합산하지 않습니다.
- 기존 게임 저장의 화장실은 첫 지갑 생성 시 이전하고, 이후 제작 단계는 공방 상태가 기준입니다. 게임 저장/랭킹 API로 임의의 화장실 단계를 보내도 제작 상태를 덮어쓰지 않습니다.
- 마지막 화장실 이후 개조마다 화장실 기본 생산량의 5%를 추가합니다. 초기화는 부품/제작을 초기화하지만 토큰과 무료 보상 수령 기록은 보존합니다.
- `npm run test:economy`: 규칙 테스트 10개와 임시 SQLite 서버 API 통합 테스트. 동시 요청, 재전송, 보상 중복, 계정 분리, 저장 위조, 초기화를 검증합니다.
- `npm run dev:local`의 공방에서만 개발용 보상 테스트를 사용합니다. 배포 빌드에는 체험 지급 버튼이 없습니다.
- 미니게임 제작 파일은 별도 작업 소유입니다. 연결 절차와 실서비스에 필요한 결과/광고/결제 검증은 `ECONOMY_INTEGRATION.md`를 참고하세요. 현재 실제 연동은 잠겨 있습니다.
- 이번 변경은 로컬 개발용이며 운영 DB 마이그레이션이나 배포는 실행하지 않았습니다. 운영 PostgreSQL에 대한 실제 통합 검증은 배포 전 별도 개발 DB에서 진행해야 합니다.

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


## 2026-09-21: 8×8 퍼즐 통합

- `/minigame`: 10개 목표 스테이지 + 7개 구성의 반복 도전, 수집/찌든 때 목표, 별/연쇄 점수.
- `shared/match3.js`, `shared/puzzle.js`: 서버/게스트 공용 판 및 결정적 이동 계산.
- 공통 경제 `puzzle_start`/`puzzle_move`: 서버 이동 검증과 완료 보상 원자적 저장, 별도 미니게임 지갑 사용 중단.
- `/?workshop=1`: 결과에서 공방을 바로 열기. 지갑 로딩 전 광고 횟수 접근 오류 수정.
- 이전 7×7 시제품 저장 키는 삭제하지 않고 미사용으로 유지. 기존 공통 지갑은 재지급 없이 호환.
- `npm run test:puzzle` 추가. 퍼즐 6개 + 경제/API 12개 검사. 빌드/서버 구문 검사.
- 로컬 브라우저: 잘못된 교환은 무료, 8토큰 입장, 64칸, 이동 후 리로드/이어하기,
  첫 스테이지 완료와 부품 지급/재접속 중복 지급 방지, 다음 스테이지 해금, 공방 복귀 확인.
- 375px 화면에서 퍼즐 폭 339px, 칸 약 39px. 실제 폰 터치감과 목표별 승률은 추가 플레이로 조정할 항목.
- 실제 광고/결제 및 배포는 수행하지 않음. PostgreSQL 운영 적용 전 별도 검증 필요.


## 2026-09-21: 변기 위 캐릭터 배치

- `src/scene/SeatedPoop.jsx`를 `.game-shell`의 직계 레이어로 장착. flex 중앙 영역/상단 HUD 높이에 종속되지 않음.
- `src/scene/placements.js`: 원본 배경 1080×1920 좌표로 각 변기의 접촉점, 실제 캐릭터 폭, 그림자 크기 관리.
- `src/scene/poopBounds.json`: 현재 20개 스프라이트의 알파 ≥96 경계. 이미지 교체 시 다시 측정해야 함.
- `src/scene/seated-poop.css`: PNG 투명 여백 보정, 바닥 기준 squash, 접촉 그림자, 클릭 보상.
- 배경과 캐릭터 모두 같은 상자 기준으로 배치. `background-size: 100% 100%` 정책을 변경하면 좌표 변환도 조정 필요.
- `/scene-preview.html` + `src/scene/preview.jsx`/`preview-data.json`: DEV 전용 비교 페이지. 실제 SeatedPoop 컴포넌트를 사용해 20개 배경/캐릭터/화면 비율/눌림 상태 비교. 메인 빌드 엔트리에서 참조하지 않음.
- 실제 메인 학교 화장실에서 물똥 접촉, 클릭 생산 확인. 미리보기에서 물똥/불꽃똥과 20개 배경, 두 화면 비율, 눌림 상태 확인.
- 빌드로 확인. 별도의 경제/미니게임 수정이나 배포 없음.
