"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabaseClient";

export type RoomRow = {
  id: string;
  game_type: string;
  status: "waiting" | "playing" | "finished" | "cancelled";
  created_at: string;
  expires_at: string | null;
};

export type RoomPlayerRow = {
  room_id: string;
  player_key: string;
  nickname: string;
  seat: 1 | 2;
  joined_at: string;
};

export type GameStateRow = {
  room_id: string;
  state: Record<string, unknown>;
  turn_seat: 1 | 2;
  version: number;
  updated_at: string;
};

export type UseRealtimeRoomResult = {
  room: RoomRow | null;
  players: RoomPlayerRow[];
  gameState: GameStateRow | null;
  onlineByPlayerKey: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  refetchLatest: () => Promise<void>;
  broadcastStateUpdated: (version: number) => Promise<void>;
};

type UseRealtimeRoomOptions = {
  playerKey: string | null;
  nickname: string;
  seat: number | null;
  enabled: boolean;
};

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "unknown_error";
}

export function useRealtimeRoom(
  roomId: string | null,
  {
  playerKey,
  nickname,
  seat,
  enabled,
  }: UseRealtimeRoomOptions,
): UseRealtimeRoomResult {
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [players, setPlayers] = useState<RoomPlayerRow[]>([]);
  const [gameState, setGameState] = useState<GameStateRow | null>(null);
  const [onlineByPlayerKey, setOnlineByPlayerKey] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const supabase = useMemo(() => {
    if (!playerKey) {
      return null;
    }
    return getSupabaseClient(playerKey);
  }, [playerKey]);

  const refetchLatest = useCallback(async () => {
    if (!enabled || !supabase || !roomId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [roomRes, playersRes, gameRes] = await Promise.all([
        supabase.from("rooms").select("id,game_type,status,created_at,expires_at").eq("id", roomId).single(),
        supabase.rpc("get_room_players", { p_room_id: roomId }),
        supabase
          .from("game_states")
          .select("room_id,state,turn_seat,version,updated_at")
          .eq("room_id", roomId)
          .maybeSingle(),
      ]);

      if (roomRes.error) {
        throw roomRes.error;
      }
      if (playersRes.error) {
        throw playersRes.error;
      }
      if (gameRes.error) {
        throw gameRes.error;
      }

      setRoom(roomRes.data as RoomRow);
      setPlayers((playersRes.data ?? []) as RoomPlayerRow[]);
      setGameState((gameRes.data ?? null) as GameStateRow | null);
    } catch (nextError) {
      setError(normalizeError(nextError));
    } finally {
      setLoading(false);
    }
  }, [enabled, roomId, supabase]);

  const broadcastStateUpdated = useCallback(
    async (version: number) => {
      if (!enabled || !roomId || !channelRef.current) {
        return;
      }
      await channelRef.current.send({
        type: "broadcast",
        event: "state_updated",
        payload: { room_id: roomId, version },
      });
    },
    [enabled, roomId],
  );

  useEffect(() => {
    if (!enabled || !supabase || !roomId || !playerKey) {
      return;
    }

    const topic = `private:room:${roomId}`;
    const channel = supabase.channel(topic, {
      config: {
        broadcast: { self: false },
        presence: { key: playerKey },
      },
    });
    channelRef.current = channel;

    channel.on("broadcast", { event: "state_updated" }, async () => {
      await refetchLatest();
    });

    channel.on("presence", { event: "sync" }, () => {
      const presenceState = channel.presenceState();
      const online: Record<string, boolean> = {};

      for (const [presenceKey, entries] of Object.entries(presenceState)) {
        online[presenceKey] = entries.length > 0;
      }

      setOnlineByPlayerKey(online);
      void refetchLatest();
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          player_key: playerKey,
          nickname,
          seat,
          last_seen: new Date().toISOString(),
        });
        await refetchLatest();
      }
    });

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [enabled, nickname, playerKey, refetchLatest, roomId, seat, supabase]);

  return {
    room,
    players,
    gameState,
    onlineByPlayerKey,
    loading,
    error,
    refetchLatest,
    broadcastStateUpdated,
  };
}
