-- Prevent RLS recursion when selecting public.room_players.
-- room_players policy calls can_access_room(room_id), so this helper must not
-- evaluate room_players under the caller's RLS context.

create or replace function public.can_access_room(p_room_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_player_key text;
begin
  v_player_key := public.current_player_key();

  if p_room_id is null or v_player_key is null then
    return false;
  end if;

  return exists (
    select 1
    from public.room_players rp
    where rp.room_id = p_room_id
      and rp.player_key = v_player_key
  );
end;
$$;

revoke all on function public.can_access_room(uuid) from public, anon, authenticated;
grant execute on function public.can_access_room(uuid) to anon, authenticated;
