# Duelboard Web

Duelboard는 2-player 미니게임을 빠르게 추가할 수 있도록 분리된 플랫폼 구조를 사용합니다.

## Platform Structure

```text
apps/web/
  app/                         # routing only
    games/{slug}/              # game entry + mode routes
  components/
    game-core/                 # platform common UI/layout/hook/type/util
    games/{slug}/              # game-specific UI (containers + presentational)
    games/_template/           # scaffold template source (not registered)
  lib/
    registry.ts                # single source of game metadata
    games/{slug}/              # game domain helpers (score preview, categories)
  scripts/
    scaffold-game.mjs          # game scaffold generator
```

## Architecture Intent (10-line summary)

1. `app/`는 URL 라우팅만 담당하고 게임 로직은 담지 않습니다.
2. 게임 컨테이너/표현 컴포넌트는 `components/games/{slug}`에만 둡니다.
3. 공통 버튼/패널/툴팁/쉘은 `components/game-core`에서 재사용합니다.
4. 게임 목록/상태(`live`, `coming-soon`)는 `lib/registry.ts` 단일 소스로 관리합니다.
5. 홈(`/`)과 `/games`는 registry를 읽어 자동 렌더합니다.
6. sitemap도 registry 기반으로 게임 URL을 자동 생성합니다.
7. `coming-soon` 게임은 홈 버튼 disabled + 게임 라우트 안내 UI로 일관 처리합니다.
8. 새 게임은 `_template` 복사 기반으로 동일한 컨테이너 패턴을 따릅니다.
9. Yacht Dice의 온라인/AI 계약 로직은 컨테이너 내부에서 유지됩니다.
10. 결과적으로 새 게임 추가는 “스캐폴드 + registry 1줄”로 끝나는 구조를 목표로 합니다.

## Add a New Game

### Option A) Scaffold script (recommended)

```bash
cd apps/web
pnpm scaffold:game sea-battle "Sea Battle" "바다전투"
```

스크립트가 수행하는 작업:

1. `components/games/_template`를 복사해 `components/games/{slug}` 생성
2. `app/games/{slug}/page.tsx`, `vs-ai/page.tsx`, `online/page.tsx` 생성
3. `lib/registry.ts`에 `status: "coming-soon"` 메타 항목 추가

### Option B) Manual setup

1. `components/games/{slug}`에 컨테이너/공용 컴포넌트 추가
2. `app/games/{slug}`에 라우트 3개(page/vs-ai/online) 추가
3. `lib/registry.ts`에 메타 추가
4. `status`를 `live`로 바꾸기 전까지는 Coming Soon 상태 유지

## Registry model

`lib/registry.ts`의 `GameMeta`:

- `slug`
- `title: { en, ko }`
- `description?: { en, ko }`
- `href`
- `imageSrc?`, `heroImage?`, `tone?`
- `modes: ("vs-ai" | "online")[]`
- `status: "live" | "coming-soon"`

## Yacht Dice Contract Safety

아래 항목은 변경 금지:

- `submitMove / handleRoll / handleToggleHold / handleScore` 시그니처/동작
- `OnlineYachtState` 필드 키/의미
- `useRealtimeRoom.ts`, SQL migrations, RPC(`create_room`, `join_room`, `make_move`), Realtime topic/version
- `chooseAiAction` 트리거(useEffect), AI 턴 상태 전이 로직

## Local commands

```bash
pnpm -C apps/web dev
pnpm -C apps/web build
```

## Yacht Dice Online local test

1. repo root에서 Supabase migration 반영

```bash
supabase db push
```

2. 앱 실행

```bash
pnpm -C apps/web dev
```

3. `http://localhost:3000/games/yacht-dice/online`에서 방 생성/참가 후 실시간 동기화 확인
