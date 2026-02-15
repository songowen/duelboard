-- Duelboard MVP schema + RLS + RPC + Realtime auth

create extension if not exists pgcrypto;

-- ---------- Tables ----------

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  game_type text not null check (game_type in ('yacht')),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished', 'cancelled')),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by text not null
);

create table if not exists public.room_players (
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_key text not null,
  nickname text not null,
  seat smallint not null check (seat in (1, 2)),
  joined_at timestamptz not null default now(),
  primary key (room_id, player_key),
  unique (room_id, seat)
);

create table if not exists public.game_states (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  state jsonb not null,
  turn_seat smallint not null check (turn_seat in (1, 2)),
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.game_moves (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  move_no integer not null,
  seat smallint not null check (seat in (1, 2)),
  move jsonb not null,
  created_at timestamptz not null default now(),
  unique (room_id, move_no)
);

-- ---------- Indexes ----------

create index if not exists idx_rooms_status_created_at on public.rooms(status, created_at desc);
create index if not exists idx_rooms_expires_at on public.rooms(expires_at);
create index if not exists idx_room_players_player_key on public.room_players(player_key);
create index if not exists idx_game_moves_room_created_at on public.game_moves(room_id, created_at desc);

-- ---------- Helper functions ----------

create or replace function public.current_player_key()
returns text
language plpgsql
stable
as $$
declare
  v_claims jsonb := '{}'::jsonb;
  v_headers jsonb := '{}'::jsonb;
  v_key text;
begin
  begin
    v_claims := coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb;
  exception when others then
    v_claims := '{}'::jsonb;
  end;

  begin
    v_headers := coalesce(current_setting('request.headers', true), '{}')::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;

  v_key := coalesce(v_claims ->> 'player_key', v_headers ->> 'x-player-key');
  return nullif(trim(v_key), '');
end;
$$;

create or replace function public.initial_game_state(p_game_type text)
returns jsonb
language sql
immutable
as $$
  select case p_game_type
    when 'yacht' then jsonb_build_object(
      'game', 'yacht',
      'phase', 'rolling',
      'turnNo', 1,
      'turnSeat', 1,
      'scored', jsonb_build_object('1', '[]'::jsonb, '2', '[]'::jsonb)
    )
    else '{}'::jsonb
  end;
$$;

create or replace function public.can_access_room(p_room_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.room_players rp
    where rp.room_id = p_room_id
      and rp.player_key = public.current_player_key()
  );
$$;

create or replace function public.can_access_room_by_topic(p_topic text)
returns boolean
language plpgsql
stable
as $$
declare
  v_room_id_text text;
  v_room_id uuid;
begin
  v_room_id_text := substring(p_topic from '^private:room:([0-9a-fA-F-]{36})$');
  if v_room_id_text is null then
    return false;
  end if;

  begin
    v_room_id := v_room_id_text::uuid;
  exception when others then
    return false;
  end;

  return public.can_access_room(v_room_id);
end;
$$;

-- Optional hook: replace this function later with stricter per-game validation.
create or replace function public.yacht_validate_move_hook(
  p_state jsonb,
  p_move jsonb,
  p_seat smallint
)
returns void
language plpgsql
as $$
begin
  return;
end;
$$;

-- ---------- RPC ----------

create or replace function public.join_room(
  p_room_id uuid,
  p_player_key text,
  p_nickname text
)
returns table (
  room_id uuid,
  seat smallint,
  room_status text,
  state_version bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_room public.rooms%rowtype;
  v_existing_seat smallint;
  v_assigned_seat smallint;
  v_player_count integer;
  v_state_version bigint := 0;
begin
  if p_room_id is null then
    raise exception 'room_id is required';
  end if;

  if p_player_key is null or btrim(p_player_key) = '' then
    raise exception 'player_key is required';
  end if;

  if p_nickname is null or btrim(p_nickname) = '' then
    raise exception 'nickname is required';
  end if;

  select *
  into v_room
  from public.rooms r
  where r.id = p_room_id
  for update;

  if not found then
    raise exception 'room_not_found';
  end if;

  if v_room.expires_at is not null and v_room.expires_at <= now() then
    raise exception 'room_expired';
  end if;

  select rp.seat
  into v_existing_seat
  from public.room_players rp
  where rp.room_id = p_room_id
    and rp.player_key = p_player_key;

  if found then
    update public.room_players
    set nickname = p_nickname
    where room_id = p_room_id
      and player_key = p_player_key;

    select gs.version into v_state_version
    from public.game_states gs
    where gs.room_id = p_room_id;

    return query
    select p_room_id, v_existing_seat, v_room.status, coalesce(v_state_version, 0);
    return;
  end if;

  if v_room.status <> 'waiting' then
    raise exception 'room_not_joinable';
  end if;

  if exists (
    select 1
    from public.room_players rp
    where rp.room_id = p_room_id
      and rp.seat = 1
  ) then
    v_assigned_seat := 2;
  else
    v_assigned_seat := 1;
  end if;

  insert into public.room_players (room_id, player_key, nickname, seat)
  values (p_room_id, p_player_key, p_nickname, v_assigned_seat);

  select count(*)
  into v_player_count
  from public.room_players rp
  where rp.room_id = p_room_id;

  if v_player_count > 2 then
    raise exception 'room_full';
  end if;

  if v_player_count = 2 then
    update public.rooms
    set status = 'playing'
    where id = p_room_id;

    insert into public.game_states (room_id, state, turn_seat, version, updated_at)
    values (
      p_room_id,
      public.initial_game_state(v_room.game_type),
      1,
      0,
      now()
    )
    on conflict (room_id) do nothing;

    select gs.version into v_state_version
    from public.game_states gs
    where gs.room_id = p_room_id;

    return query
    select p_room_id, v_assigned_seat, 'playing'::text, coalesce(v_state_version, 0);
    return;
  end if;

  return query
  select p_room_id, v_assigned_seat, 'waiting'::text, 0::bigint;
end;
$$;

create or replace function public.make_move(
  p_room_id uuid,
  p_player_key text,
  p_expected_version bigint,
  p_move_json jsonb
)
returns table (
  new_version bigint,
  next_turn_seat smallint,
  state jsonb
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_room public.rooms%rowtype;
  v_game public.game_states%rowtype;
  v_player_seat smallint;
  v_move_no integer;
  v_new_state jsonb;
  v_new_turn smallint;
  v_action text;
  v_category text;
  v_scored_for_seat jsonb;
  v_category_exists boolean;
  v_turn_no integer;
begin
  if p_room_id is null then
    raise exception 'room_id is required';
  end if;

  if p_player_key is null or btrim(p_player_key) = '' then
    raise exception 'player_key is required';
  end if;

  if p_move_json is null then
    raise exception 'move_json is required';
  end if;

  select *
  into v_room
  from public.rooms r
  where r.id = p_room_id
  for update;

  if not found then
    raise exception 'room_not_found';
  end if;

  if v_room.status <> 'playing' then
    raise exception 'room_not_playing';
  end if;

  select *
  into v_game
  from public.game_states gs
  where gs.room_id = p_room_id
  for update;

  if not found then
    raise exception 'game_state_not_initialized';
  end if;

  select rp.seat
  into v_player_seat
  from public.room_players rp
  where rp.room_id = p_room_id
    and rp.player_key = p_player_key;

  if not found then
    raise exception 'not_a_room_player';
  end if;

  if v_game.turn_seat <> v_player_seat then
    raise exception 'not_your_turn';
  end if;

  if v_game.version <> p_expected_version then
    raise exception 'version_mismatch';
  end if;

  v_new_state := v_game.state;
  v_new_turn := v_game.turn_seat;

  if v_room.game_type = 'yacht' then
    perform public.yacht_validate_move_hook(v_game.state, p_move_json, v_player_seat);

    v_action := p_move_json ->> 'action';
    if v_action is null then
      raise exception 'invalid_move_action';
    end if;

    if v_action = 'roll' then
      if coalesce(v_game.state ->> 'phase', 'rolling') <> 'rolling' then
        raise exception 'invalid_phase_for_roll';
      end if;

      v_new_state := jsonb_set(v_new_state, '{phase}', '"scoring"', true);

    elsif v_action = 'score' then
      if coalesce(v_game.state ->> 'phase', 'rolling') <> 'scoring' then
        raise exception 'invalid_phase_for_score';
      end if;

      v_category := p_move_json ->> 'category';
      if v_category is null or btrim(v_category) = '' then
        raise exception 'category_required';
      end if;

      if v_category not in (
        'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
        'choice', 'four_kind', 'full_house', 'small_straight',
        'large_straight', 'yacht'
      ) then
        raise exception 'invalid_category';
      end if;

      v_scored_for_seat := coalesce(v_new_state #> array['scored', v_player_seat::text], '[]'::jsonb);

      select exists (
        select 1
        from jsonb_array_elements_text(v_scored_for_seat) as c(value)
        where c.value = v_category
      )
      into v_category_exists;

      if v_category_exists then
        raise exception 'category_already_scored';
      end if;

      v_scored_for_seat := v_scored_for_seat || jsonb_build_array(v_category);
      v_new_state := jsonb_set(v_new_state, array['scored', v_player_seat::text], v_scored_for_seat, true);
      v_new_state := jsonb_set(v_new_state, '{phase}', '"rolling"', true);

      v_new_turn := case when v_player_seat = 1 then 2 else 1 end;
      v_turn_no := coalesce((v_new_state ->> 'turnNo')::integer, 1) + 1;
      v_new_state := jsonb_set(v_new_state, '{turnNo}', to_jsonb(v_turn_no), true);
      v_new_state := jsonb_set(v_new_state, '{turnSeat}', to_jsonb(v_new_turn), true);

    else
      raise exception 'unsupported_move_action';
    end if;

  else
    raise exception 'unsupported_game_type';
  end if;

  select coalesce(max(gm.move_no), 0) + 1
  into v_move_no
  from public.game_moves gm
  where gm.room_id = p_room_id;

  insert into public.game_moves (room_id, move_no, seat, move, created_at)
  values (p_room_id, v_move_no, v_player_seat, p_move_json, now());

  update public.game_states
  set state = v_new_state,
      turn_seat = v_new_turn,
      version = version + 1,
      updated_at = now()
  where room_id = p_room_id
  returning version, turn_seat, state
  into new_version, next_turn_seat, state;

  return next;
end;
$$;

-- ---------- Privileges ----------

revoke all on table public.rooms from public, anon, authenticated;
revoke all on table public.room_players from public, anon, authenticated;
revoke all on table public.game_states from public, anon, authenticated;
revoke all on table public.game_moves from public, anon, authenticated;

grant select on table public.rooms to anon, authenticated;
grant select on table public.room_players to anon, authenticated;
grant select on table public.game_states to anon, authenticated;
grant select on table public.game_moves to anon, authenticated;

revoke all on function public.join_room(uuid, text, text) from public, anon, authenticated;
revoke all on function public.make_move(uuid, text, bigint, jsonb) from public, anon, authenticated;

grant execute on function public.join_room(uuid, text, text) to anon, authenticated;
grant execute on function public.make_move(uuid, text, bigint, jsonb) to anon, authenticated;

-- ---------- RLS ----------

alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.game_states enable row level security;
alter table public.game_moves enable row level security;

alter table public.rooms force row level security;
alter table public.room_players force row level security;
alter table public.game_states force row level security;
alter table public.game_moves force row level security;

drop policy if exists rooms_read_participants on public.rooms;
create policy rooms_read_participants
on public.rooms
for select
using (public.can_access_room(id));

drop policy if exists room_players_read_participants on public.room_players;
create policy room_players_read_participants
on public.room_players
for select
using (public.can_access_room(room_id));

drop policy if exists game_states_read_participants on public.game_states;
create policy game_states_read_participants
on public.game_states
for select
using (public.can_access_room(room_id));

drop policy if exists game_moves_read_participants on public.game_moves;
create policy game_moves_read_participants
on public.game_moves
for select
using (public.can_access_room(room_id));

-- ---------- Realtime (private channel auth) ----------
-- Channel format: private:room:{room_id}

alter table realtime.messages enable row level security;

drop policy if exists duelboard_realtime_select on realtime.messages;
create policy duelboard_realtime_select
on realtime.messages
for select
to anon, authenticated
using (public.can_access_room_by_topic(realtime.topic()));

drop policy if exists duelboard_realtime_insert on realtime.messages;
create policy duelboard_realtime_insert
on realtime.messages
for insert
to anon, authenticated
with check (public.can_access_room_by_topic(realtime.topic()));
