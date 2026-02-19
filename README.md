# Duelboard

2-player web arcade platform

[![Deploy](https://img.shields.io/badge/Deploy-duelboard.songowen.cloud-0ea5e9?style=flat-square)](https://duelboard.songowen.cloud)
![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000000?style=flat-square&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Realtime-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Auto%20Deploy-000000?style=flat-square&logo=vercel)
![pnpm](https://img.shields.io/badge/pnpm-Workspace-4A4A4A?style=flat-square&logo=pnpm)

배포: [https://duelboard.songowen.cloud](https://duelboard.songowen.cloud)

---

## 프로젝트 소개

Duelboard는 **2인용 웹 게임을 빠르게 추가/운영하기 위한 플랫폼 아키텍처**를 목표로 만든 프로젝트입니다.

- 포트폴리오 관점:
  - 단순 게임 1개 구현이 아니라, 이후 게임을 추가해도 구조가 무너지지 않는 플랫폼 설계
  - 실시간 동기화, 온라인 대전, AI 대전, 다국어, CI/CD까지 포함한 운영형 구조 검증
- 핵심 목표:
  - **온라인 1:1 실시간 대전**
  - **AI 대전 모드**
  - **상태 동기화 일관성(version 기반 optimistic lock)**

현재 구현 게임은 **Yacht Dice**이며, Sea Battle은 확장 예정 스캐폴드까지 준비되어 있습니다.

---

## 주요 기능

### 🎮 Yacht Dice
- AI 대전
  - 난이도 선택(Easy / Normal)
  - 턴 기반 자동 의사결정 로직
- 온라인 1:1 실시간 대전
  - 방 생성/참가 RPC
  - Realtime broadcast + 최신 상태 refetch
- 점수 시스템
  - 카테고리별 점수 계산
  - 선택 가능한 카테고리와 preview 점수 표시
- 동기화 안정성
  - `game_states.version` 기반 optimistic locking

### 🌐 다국어 지원 (EN/KR)
- 쿠키 기반 locale 유지
- 상단 언어 토글 즉시 반영
- UI 텍스트 및 게임 관련 라벨 다국어 대응

### 🧱 게임 플랫폼 아키텍처
- 공통 UI와 게임별 UI 분리
- 라우트 레이어와 컨테이너/표현 컴포넌트 레이어 분리
- Registry 기반으로 게임 목록/상태(coming-soon 포함) 관리

### 🚀 배포 / 🧪 품질
- Vercel Git 연동 자동 배포
- GitHub Actions CI(`lint`, `typecheck`, `build`)
- Conventional Commits + commitlint/husky 기반 커밋 규칙

---

## 아키텍처

### 폴더 구조(요약)

```text
duelboard/
├─ apps/
│  └─ web/
│     ├─ app/                       # Next.js App Router (라우팅 전담)
│     │  └─ games/{slug}/...
│     ├─ components/
│     │  ├─ game-core/              # 공통 레이아웃/버튼/유틸/UI
│     │  └─ games/
│     │     ├─ yacht-dice/          # 실제 구현 게임
│     │     ├─ sea-battle/          # 스캐폴드(coming soon)
│     │     └─ _template/           # 게임 추가 템플릿
│     ├─ lib/
│     │  ├─ registry.ts             # 게임 메타 단일 소스
│     │  ├─ useRealtimeRoom.ts      # 온라인 방 상태 구독/동기화
│     │  └─ yacht-dice-*.ts         # 게임 규칙/AI/점수 로직
│     └─ content/                   # 페이지/블로그/게임 문서(MDX)
├─ supabase/
│  └─ migrations/                   # DB 스키마/RLS/RPC
└─ .github/workflows/ci.yml         # CI 파이프라인
```

### Supabase 데이터 모델

- `rooms`
  - 방 메타 정보 (`status: waiting|playing|finished|cancelled`)
- `room_players`
  - 방 참가자, 좌석(seat), 닉네임
- `game_states`
  - 현재 게임 상태(JSON), `turn_seat`, `version`
- `game_moves`
  - move 로그(`move_no`, `seat`, `move jsonb`)

### RPC

- `create_room(p_game_type, p_player_key, p_nickname)`
- `join_room(p_room_id, p_player_key, p_nickname)`
- `make_move(p_room_id, p_player_key, p_expected_version, p_move_json)`
- `get_room_players(p_room_id)` (참가자 조회 보조 RPC)

---

## 온라인 1:1 흐름

1. 클라이언트가 `join_room`/`create_room` RPC 호출
2. 참가 완료 후 `rooms`, `room_players`, `game_states` 상태 확보
3. 플레이어가 수를 두면 `make_move` 호출
4. 서버에서 `p_expected_version === game_states.version` 검증
5. 검증 통과 시:
   - `game_moves` insert
   - `game_states` update (`version + 1`)
6. 클라이언트는 Realtime(`state_updated`)를 수신
7. 이벤트 수신 후 DB 최신 상태 refetch로 동기화

핵심은 **낙관적 락(optimistic locking)** 입니다.  
동일 턴 경쟁 업데이트가 들어와도 `version_mismatch`로 충돌을 감지하고 최신 상태로 복구합니다.

---

## 기술적 고민 & 해결

### 1) 모노레포 + Vercel Root 설정
- 이 저장소는 `apps/web`가 실제 Next.js 앱입니다.
- Vercel에서 Root Directory를 `apps/web`로 명확히 지정해 빌드 경로 혼선을 방지했습니다.

### 2) RLS / RPC 중심 설계
- 클라이언트 직접 write를 최소화하고 핵심 상태 변경은 RPC로 제한했습니다.
- `x-player-key` 기반으로 참가자 권한을 검증하고, RLS 재귀 이슈는 별도 migration으로 분리 수정했습니다.

### 3) Edge Runtime 주의점
- 일부 페이지는 edge runtime 특성으로 정적 생성 제약이 있습니다.
- build/SSR 동작을 고려해 metadata/sitemap/robots 경로를 분리 관리했습니다.

### 4) 1 Screen 게임 UI
- 게임 화면은 스크롤이 생기지 않도록 `100vh` 기준 보드 레이아웃으로 구성했습니다.
- 모바일에서는 정보 밀도를 유지하면서도 플레이 영역이 우선 보이게 레이아웃을 조정했습니다.

---

## 로컬 실행 방법

```bash
# repo root
pnpm install

# web app dependencies (최초 1회 권장)
pnpm -C apps/web install

# dev server
pnpm -C apps/web dev
```

빌드:

```bash
pnpm -C apps/web build
```

---

## 배포 구조

- 배포: Vercel + GitHub 연동
- 전략:
  - `main` → Production
  - Pull Request → Preview
- 도메인:
  - 기본 Vercel 도메인 + 커스텀 도메인 연결 가능
  - 현재 공개 주소: [duelboard.songowen.cloud](https://duelboard.songowen.cloud)

---

## CI (GitHub Actions)

파일: `.github/workflows/ci.yml`

트리거:
- `pull_request`
- `push` on `main`

실행 순서:
1. `pnpm -C apps/web install --frozen-lockfile`
2. `pnpm -C apps/web lint`
3. `pnpm -C apps/web typecheck`
4. `pnpm -C apps/web build`

PR에서 실패하면 머지 전에 즉시 확인할 수 있도록 구성했습니다.

---

## Commit Convention

Conventional Commits를 사용합니다.

형식:

```text
<type>(<scope>): <한국어 한 줄 요약>
```

예시:

```text
feat(yacht): 요트 대기방 UI 추가
fix(online): join_room UUID 검증 버그 수정
```

도구:
- `husky` + `commitlint` (커밋 메시지 규칙 강제)
- `commitizen` (프롬프트 기반 메시지 작성)
- `.gitmessage.txt` (git commit 템플릿)

자세한 규칙: `docs/commit-convention.md`

---

## 향후 계획

- Sea Battle 게임 실제 구현
- 랭킹/매치 히스토리 시스템
- E2E 테스트(Playwright) 도입
- 게임 추가 자동화 스캐폴드 확장
- 온라인 대전 관측성(로그/메트릭) 강화

---

## Tech Stack

- Frontend: Next.js(App Router), React, TypeScript, Tailwind CSS
- Backend: Supabase(Postgres, RPC, Realtime, RLS)
- Infra: Vercel, GitHub Actions
- Tooling: pnpm, ESLint, commitlint, husky, commitizen
