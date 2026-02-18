-- Fix ambiguous column reference in join_room() without changing its contract.

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
    update public.room_players as rp
    set nickname = p_nickname
    where rp.room_id = p_room_id
      and rp.player_key = p_player_key;

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
