-- Fix room_players RLS recursion and expose member-safe room player list RPC.

create or replace function public.request_header_player_key()
returns text
language plpgsql
stable
as $$
declare
  v_headers jsonb := '{}'::jsonb;
  v_key text;
begin
  begin
    v_headers := coalesce(current_setting('request.headers', true), '{}')::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;

  v_key := v_headers ->> 'x-player-key';
  return nullif(trim(v_key), '');
end;
$$;

revoke all on function public.request_header_player_key() from public, anon, authenticated;
grant execute on function public.request_header_player_key() to anon, authenticated;

drop policy if exists room_players_read_participants on public.room_players;
drop policy if exists room_players_read_self on public.room_players;
create policy room_players_read_self
on public.room_players
for select
using (player_key = public.request_header_player_key());

create or replace function public.get_room_players(
  p_room_id uuid
)
returns table (
  room_id uuid,
  player_key text,
  nickname text,
  seat smallint,
  joined_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_player_key text;
begin
  if p_room_id is null then
    raise exception 'room_id is required';
  end if;

  v_player_key := public.request_header_player_key();
  if v_player_key is null then
    raise exception 'player_key is required';
  end if;

  if not exists (
    select 1
    from public.room_players rp
    where rp.room_id = p_room_id
      and rp.player_key = v_player_key
  ) then
    raise exception 'not_a_room_player';
  end if;

  return query
  select rp.room_id, rp.player_key, rp.nickname, rp.seat, rp.joined_at
  from public.room_players rp
  where rp.room_id = p_room_id
  order by rp.seat asc;
end;
$$;

revoke all on function public.get_room_players(uuid) from public, anon, authenticated;
grant execute on function public.get_room_players(uuid) to anon, authenticated;
