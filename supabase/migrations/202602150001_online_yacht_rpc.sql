-- Online Yacht room creation + richer move/state handling

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
      'dice', jsonb_build_array(1, 1, 1, 1, 1),
      'holds', jsonb_build_array(false, false, false, false, false),
      'rollsUsed', 0,
      'scored', jsonb_build_object('1', '[]'::jsonb, '2', '[]'::jsonb),
      'scoreCard', jsonb_build_object(
        '1', jsonb_build_object(
          'ones', null, 'twos', null, 'threes', null,
          'fours', null, 'fives', null, 'sixes', null,
          'choice', null, 'four_kind', null, 'full_house', null,
          'small_straight', null, 'large_straight', null, 'yacht', null
        ),
        '2', jsonb_build_object(
          'ones', null, 'twos', null, 'threes', null,
          'fours', null, 'fives', null, 'sixes', null,
          'choice', null, 'four_kind', null, 'full_house', null,
          'small_straight', null, 'large_straight', null, 'yacht', null
        )
      )
    )
    else '{}'::jsonb
  end;
$$;

create or replace function public.create_room(
  p_game_type text,
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
  v_room_id uuid;
begin
  if p_game_type is null or btrim(p_game_type) = '' then
    raise exception 'game_type is required';
  end if;

  if p_game_type <> 'yacht' then
    raise exception 'unsupported_game_type';
  end if;

  if p_player_key is null or btrim(p_player_key) = '' then
    raise exception 'player_key is required';
  end if;

  if p_nickname is null or btrim(p_nickname) = '' then
    raise exception 'nickname is required';
  end if;

  insert into public.rooms (game_type, status, created_by)
  values (p_game_type, 'waiting', p_player_key)
  returning id into v_room_id;

  insert into public.room_players (room_id, player_key, nickname, seat)
  values (v_room_id, p_player_key, p_nickname, 1);

  return query
  select v_room_id, 1::smallint, 'waiting'::text, 0::bigint;
end;
$$;

create or replace function public.yacht_calculate_category_score(
  p_dice jsonb,
  p_category text
)
returns integer
language plpgsql
immutable
as $$
declare
  v_counts integer[] := array[0, 0, 0, 0, 0, 0];
  v_die_json jsonb;
  v_die integer;
  v_sum integer := 0;
  v_max integer := 0;
  v_non_zero_counts integer[] := '{}';
  v_unique_count integer;
  v_i integer;
begin
  if p_dice is null or jsonb_typeof(p_dice) <> 'array' or jsonb_array_length(p_dice) <> 5 then
    raise exception 'invalid_dice';
  end if;

  for v_die_json in select value from jsonb_array_elements(p_dice)
  loop
    if jsonb_typeof(v_die_json) <> 'number' then
      raise exception 'invalid_die_value';
    end if;

    v_die := (v_die_json)::text::integer;
    if v_die < 1 or v_die > 6 then
      raise exception 'invalid_die_range';
    end if;

    v_counts[v_die] := v_counts[v_die] + 1;
    v_sum := v_sum + v_die;
  end loop;

  for v_i in 1..6
  loop
    if v_counts[v_i] > v_max then
      v_max := v_counts[v_i];
    end if;

    if v_counts[v_i] > 0 then
      v_non_zero_counts := array_append(v_non_zero_counts, v_counts[v_i]);
    end if;
  end loop;

  if p_category = 'ones' then
    return v_counts[1] * 1;
  elsif p_category = 'twos' then
    return v_counts[2] * 2;
  elsif p_category = 'threes' then
    return v_counts[3] * 3;
  elsif p_category = 'fours' then
    return v_counts[4] * 4;
  elsif p_category = 'fives' then
    return v_counts[5] * 5;
  elsif p_category = 'sixes' then
    return v_counts[6] * 6;
  elsif p_category = 'choice' then
    return v_sum;
  elsif p_category = 'four_kind' then
    if v_max >= 4 then
      return v_sum;
    end if;
    return 0;
  elsif p_category = 'full_house' then
    if cardinality(v_non_zero_counts) = 2
      and ((v_non_zero_counts[1] = 2 and v_non_zero_counts[2] = 3)
        or (v_non_zero_counts[1] = 3 and v_non_zero_counts[2] = 2)) then
      return v_sum;
    end if;
    return 0;
  elsif p_category = 'small_straight' then
    if (v_counts[1] > 0 and v_counts[2] > 0 and v_counts[3] > 0 and v_counts[4] > 0)
      or (v_counts[2] > 0 and v_counts[3] > 0 and v_counts[4] > 0 and v_counts[5] > 0)
      or (v_counts[3] > 0 and v_counts[4] > 0 and v_counts[5] > 0 and v_counts[6] > 0) then
      return 15;
    end if;
    return 0;
  elsif p_category = 'large_straight' then
    select count(*) into v_unique_count
    from (
      select distinct (value)::text::integer as die
      from jsonb_array_elements(p_dice)
    ) d;

    if v_unique_count = 5 and (
      (v_counts[1] = 1 and v_counts[2] = 1 and v_counts[3] = 1 and v_counts[4] = 1 and v_counts[5] = 1)
      or (v_counts[2] = 1 and v_counts[3] = 1 and v_counts[4] = 1 and v_counts[5] = 1 and v_counts[6] = 1)
    ) then
      return 30;
    end if;
    return 0;
  elsif p_category = 'yacht' then
    if v_max = 5 then
      return 50;
    end if;
    return 0;
  end if;

  raise exception 'invalid_category';
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

revoke all on function public.create_room(text, text, text) from public, anon, authenticated;
revoke all on function public.yacht_calculate_category_score(jsonb, text) from public, anon, authenticated;

grant execute on function public.create_room(text, text, text) to anon, authenticated;
grant execute on function public.yacht_calculate_category_score(jsonb, text) to anon, authenticated;
