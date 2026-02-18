-- Fix remaining ambiguous column references in RPC functions.
-- Contract/signature and behavior remain unchanged.

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
    on conflict on constraint game_states_pkey do nothing;

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
  v_turn_no integer;
  v_scored_for_seat jsonb;
  v_score_card_value jsonb;
  v_dice jsonb;
  v_holds jsonb;
  v_rolls_used integer;
  v_score integer;
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
  v_action := p_move_json ->> 'action';

  if v_action is null then
    raise exception 'invalid_move_action';
  end if;

  if v_action = 'hold' then
    if coalesce(v_new_state ->> 'phase', 'rolling') not in ('rolling', 'scoring') then
      raise exception 'invalid_phase_for_hold';
    end if;

    v_rolls_used := coalesce((v_new_state ->> 'rollsUsed')::integer, 0);
    if v_rolls_used <= 0 then
      raise exception 'cannot_hold_before_first_roll';
    end if;

    v_holds := p_move_json -> 'holds';
    if v_holds is null or jsonb_typeof(v_holds) <> 'array' or jsonb_array_length(v_holds) <> 5 then
      raise exception 'invalid_holds';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(v_holds) as h(value)
      where jsonb_typeof(h.value) <> 'boolean'
    ) then
      raise exception 'invalid_hold_value';
    end if;

    v_new_state := jsonb_set(v_new_state, '{holds}', v_holds, true);
    v_new_state := jsonb_set(v_new_state, '{phase}', '"scoring"', true);

  elsif v_action = 'roll' then
    if coalesce(v_new_state ->> 'phase', 'rolling') not in ('rolling', 'scoring') then
      raise exception 'invalid_phase_for_roll';
    end if;

    v_rolls_used := coalesce((v_new_state ->> 'rollsUsed')::integer, 0);
    if v_rolls_used >= 3 then
      raise exception 'max_rolls_reached';
    end if;

    v_dice := p_move_json -> 'dice';
    if v_dice is null or jsonb_typeof(v_dice) <> 'array' or jsonb_array_length(v_dice) <> 5 then
      raise exception 'invalid_dice';
    end if;

    perform public.yacht_calculate_category_score(v_dice, 'choice');

    if p_move_json ? 'holds' then
      v_holds := p_move_json -> 'holds';
      if jsonb_typeof(v_holds) <> 'array' or jsonb_array_length(v_holds) <> 5 then
        raise exception 'invalid_holds';
      end if;

      if exists (
        select 1
        from jsonb_array_elements(v_holds) as h(value)
        where jsonb_typeof(h.value) <> 'boolean'
      ) then
        raise exception 'invalid_hold_value';
      end if;

      v_new_state := jsonb_set(v_new_state, '{holds}', v_holds, true);
    end if;

    v_rolls_used := v_rolls_used + 1;

    v_new_state := jsonb_set(v_new_state, '{dice}', v_dice, true);
    v_new_state := jsonb_set(v_new_state, '{rollsUsed}', to_jsonb(v_rolls_used), true);
    v_new_state := jsonb_set(v_new_state, '{phase}', '"scoring"', true);

  elsif v_action = 'score' then
    if coalesce(v_new_state ->> 'phase', 'rolling') <> 'scoring' then
      raise exception 'invalid_phase_for_score';
    end if;

    v_rolls_used := coalesce((v_new_state ->> 'rollsUsed')::integer, 0);
    if v_rolls_used <= 0 then
      raise exception 'must_roll_before_score';
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

    v_score_card_value := v_new_state #> array['scoreCard', v_player_seat::text, v_category];
    if v_score_card_value is not null and jsonb_typeof(v_score_card_value) <> 'null' then
      raise exception 'category_already_scored';
    end if;

    v_dice := v_new_state -> 'dice';
    v_score := public.yacht_calculate_category_score(v_dice, v_category);

    v_new_state := jsonb_set(
      v_new_state,
      array['scoreCard', v_player_seat::text, v_category],
      to_jsonb(v_score),
      true
    );

    v_scored_for_seat := coalesce(v_new_state #> array['scored', v_player_seat::text], '[]'::jsonb);
    v_scored_for_seat := v_scored_for_seat || jsonb_build_array(v_category);
    v_new_state := jsonb_set(v_new_state, array['scored', v_player_seat::text], v_scored_for_seat, true);

    v_turn_no := coalesce((v_new_state ->> 'turnNo')::integer, 1) + 1;
    v_new_state := jsonb_set(v_new_state, '{turnNo}', to_jsonb(v_turn_no), true);

    if jsonb_array_length(coalesce(v_new_state #> '{scored,1}', '[]'::jsonb)) >= 12
      and jsonb_array_length(coalesce(v_new_state #> '{scored,2}', '[]'::jsonb)) >= 12 then
      v_new_state := jsonb_set(v_new_state, '{phase}', '"finished"', true);
      update public.rooms
      set status = 'finished'
      where id = p_room_id;
    else
      v_new_turn := case when v_player_seat = 1 then 2 else 1 end;
      v_new_state := jsonb_set(v_new_state, '{turnSeat}', to_jsonb(v_new_turn), true);
      v_new_state := jsonb_set(v_new_state, '{phase}', '"rolling"', true);
      v_new_state := jsonb_set(v_new_state, '{rollsUsed}', '0'::jsonb, true);
      v_new_state := jsonb_set(v_new_state, '{dice}', '[1,1,1,1,1]'::jsonb, true);
      v_new_state := jsonb_set(v_new_state, '{holds}', '[false,false,false,false,false]'::jsonb, true);
    end if;

  else
    raise exception 'unsupported_move_action';
  end if;

  select coalesce(max(gm.move_no), 0) + 1
  into v_move_no
  from public.game_moves gm
  where gm.room_id = p_room_id;

  insert into public.game_moves (room_id, move_no, seat, move, created_at)
  values (p_room_id, v_move_no, v_player_seat, p_move_json, now());

  update public.game_states as gs
  set state = v_new_state,
      turn_seat = v_new_turn,
      version = version + 1,
      updated_at = now()
  where gs.room_id = p_room_id
  returning gs.version, gs.turn_seat, gs.state
  into new_version, next_turn_seat, state;

  return next;
end;
$$;
