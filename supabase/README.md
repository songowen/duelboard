# Duelboard Supabase MVP (2인 온라인)

## 1) 적용 방법

1. 이 저장소 루트에서 Supabase 프로젝트를 연결합니다.
2. 아래 명령으로 마이그레이션을 반영합니다.

```bash
supabase db push
```

마이그레이션 파일:
- `supabase/migrations/202602140001_duelboard_mvp.sql`

## 2) 권한 모델 요약

핵심 원칙:
- DB 상태가 authoritative.
- 클라이언트의 테이블 direct write(INSERT/UPDATE/DELETE) 금지.
- 상태 변경은 RPC(`join_room`, `make_move`)만 허용.
- 읽기는 해당 방 참가자만 허용.

구현 방식:
- `rooms`, `room_players`, `game_states`, `game_moves`에 대해 `anon/authenticated`의 write 권한을 모두 revoke.
- `select`만 grant 후, RLS policy로 `room_players` 참여자 여부를 검사.
- 참여자 판별은 `current_player_key()` 함수 사용.
  - 우선순위: JWT claim `player_key` -> 요청 헤더 `x-player-key`
- RPC 함수는 `SECURITY DEFINER`로 작성되어 내부적으로만 write 수행.

## 3) 스키마

- `rooms(id, game_type, status, created_at, expires_at, created_by)`
- `room_players(room_id, player_key, nickname, seat, joined_at)`
- `game_states(room_id, state jsonb, turn_seat, version, updated_at)`
- `game_moves(id, room_id, move_no, seat, move jsonb, created_at)`

MVP 기본 제약:
- `game_type`: `yacht`
- `seat`: `1 | 2`
- `rooms.status`: `waiting | playing | finished | cancelled`

## 4) RPC 계약

### `join_room(p_room_id uuid, p_player_key text, p_nickname text)`

동작:
- room 존재/만료 상태 확인
- 이미 참가한 `player_key`면 재참가 처리(닉네임 갱신)
- `waiting` 상태에서 seat 자동 배정(1 -> 2)
- 2명 차면 room `playing` 전환 + `game_states` 초기화

반환:
- `room_id`
- `seat`
- `room_status`
- `state_version`

### `make_move(p_room_id uuid, p_player_key text, p_expected_version bigint, p_move_json jsonb)`

검증:
- 참가자 검증
- 현재 턴 검증
- optimistic lock 버전 검증(`p_expected_version == game_states.version`)

Yacht 최소 검증(MVP):
- `action=roll`: `phase=rolling`일 때만 가능
- `action=score`: `phase=scoring`일 때만 가능
- 카테고리 유효성 체크
- 같은 seat에서 카테고리 중복 기록 방지

상태 변경:
- `game_moves` insert
- `game_states` update(version + 1)
- `score` 시 턴 전환

확장 훅:
- `yacht_validate_move_hook(state, move, seat)` 제공
- 고급 규칙 검증은 이 함수 교체/확장으로 추가

## 5) Realtime 규칙

채널:
- `private:room:{room_id}`

권장 페이로드:
- Presence: `{ player_key, nickname, seat, lastSeen }`
- Broadcast:
  - `state_updated { room_id, version }`
  - `player_joined`
  - `player_left`

클라이언트 규칙:
- Realtime 이벤트는 "알림" 용도.
- 이벤트 수신 후 반드시 DB에서 최신 `game_states`를 다시 fetch.

보안:
- `realtime.messages` RLS policy로 채널 topic(`private:room:{uuid}`)에서 room_id 추출
- 참가자(`room_players`)만 select/insert 가능

## 6) 완료조건 매핑

- migrations 실행 시 스키마/정책/RPC 생성: 충족 (`202602140001_duelboard_mvp.sql`)
- 비참가자는 `rooms/game_states/game_moves` read 불가: RLS로 충족
- join/move는 RPC로만 가능: 테이블 write revoke + SECURITY DEFINER RPC로 충족
