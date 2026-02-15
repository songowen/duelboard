"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  calculateCategoryScore,
  calculateTotal,
  createEmptyScoreCard,
  getAvailableCategories,
  HoldMask,
  rollDice,
  ScoreCard,
  YACHT_CATEGORIES,
  YachtCategory,
} from "@/lib/yacht-dice-core";
import { useRealtimeRoom } from "@/lib/useRealtimeRoom";

type DbCategory =
  | "ones"
  | "twos"
  | "threes"
  | "fours"
  | "fives"
  | "sixes"
  | "choice"
  | "four_kind"
  | "full_house"
  | "small_straight"
  | "large_straight"
  | "yacht";

type DbScoreCard = Record<DbCategory, number | null>;

type OnlineYachtState = {
  phase: "rolling" | "scoring" | "finished";
  turnNo: number;
  turnSeat: 1 | 2;
  dice: [1 | 2 | 3 | 4 | 5 | 6, 1 | 2 | 3 | 4 | 5 | 6, 1 | 2 | 3 | 4 | 5 | 6, 1 | 2 | 3 | 4 | 5 | 6, 1 | 2 | 3 | 4 | 5 | 6];
  holds: HoldMask;
  rollsUsed: number;
  scoreCard: { "1": DbScoreCard; "2": DbScoreCard };
  scored: { "1": DbCategory[]; "2": DbCategory[] };
};

const STORAGE_PLAYER_KEY = "duelboard.player_key";
const STORAGE_NICKNAME = "duelboard.nickname";

const UI_TO_DB_CATEGORY: Record<YachtCategory, DbCategory> = {
  Ones: "ones",
  Twos: "twos",
  Threes: "threes",
  Fours: "fours",
  Fives: "fives",
  Sixes: "sixes",
  Choice: "choice",
  "Four of a Kind": "four_kind",
  "Full House": "full_house",
  "Small Straight": "small_straight",
  "Large Straight": "large_straight",
  Yacht: "yacht",
};

const DB_TO_UI_CATEGORY = Object.fromEntries(
  Object.entries(UI_TO_DB_CATEGORY).map(([ui, db]) => [db, ui]),
) as Record<DbCategory, YachtCategory>;

const EMPTY_DB_SCORE_CARD: DbScoreCard = {
  ones: null,
  twos: null,
  threes: null,
  fours: null,
  fives: null,
  sixes: null,
  choice: null,
  four_kind: null,
  full_house: null,
  small_straight: null,
  large_straight: null,
  yacht: null,
};

const INITIAL_DICE: OnlineYachtState["dice"] = [1, 1, 1, 1, 1];
const INITIAL_HOLDS: HoldMask = [false, false, false, false, false];

function getOrCreatePlayerKey(): string {
  const existing = window.localStorage.getItem(STORAGE_PLAYER_KEY);
  if (existing && existing.trim()) {
    return existing;
  }
  const next = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_PLAYER_KEY, next);
  return next;
}

function normalizeDice(value: unknown): OnlineYachtState["dice"] {
  if (!Array.isArray(value) || value.length !== 5) {
    return INITIAL_DICE;
  }

  const parsed = value.map((entry) => Number(entry));
  if (parsed.some((die) => !Number.isInteger(die) || die < 1 || die > 6)) {
    return INITIAL_DICE;
  }

  return parsed as OnlineYachtState["dice"];
}

function normalizeHolds(value: unknown): HoldMask {
  if (!Array.isArray(value) || value.length !== 5) {
    return INITIAL_HOLDS;
  }
  if (value.some((entry) => typeof entry !== "boolean")) {
    return INITIAL_HOLDS;
  }
  return value as HoldMask;
}

function normalizeDbScoreCard(value: unknown): DbScoreCard {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_DB_SCORE_CARD };
  }

  const source = value as Record<string, unknown>;
  const result: DbScoreCard = { ...EMPTY_DB_SCORE_CARD };

  for (const key of Object.keys(EMPTY_DB_SCORE_CARD) as DbCategory[]) {
    const current = source[key];
    result[key] = typeof current === "number" ? current : null;
  }

  return result;
}

function normalizeDbCategories(value: unknown): DbCategory[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowed = new Set<DbCategory>(Object.values(UI_TO_DB_CATEGORY));
  return value.filter((entry): entry is DbCategory => typeof entry === "string" && allowed.has(entry as DbCategory));
}

function parseOnlineState(raw: unknown): OnlineYachtState | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const state = raw as Record<string, unknown>;
  const scoreCardRaw = (state.scoreCard ?? {}) as Record<string, unknown>;
  const scoredRaw = (state.scored ?? {}) as Record<string, unknown>;

  return {
    phase: state.phase === "finished" ? "finished" : state.phase === "scoring" ? "scoring" : "rolling",
    turnNo: Number(state.turnNo ?? 1),
    turnSeat: Number(state.turnSeat ?? 1) === 2 ? 2 : 1,
    dice: normalizeDice(state.dice),
    holds: normalizeHolds(state.holds),
    rollsUsed: Number(state.rollsUsed ?? 0),
    scoreCard: {
      "1": normalizeDbScoreCard(scoreCardRaw["1"]),
      "2": normalizeDbScoreCard(scoreCardRaw["2"]),
    },
    scored: {
      "1": normalizeDbCategories(scoredRaw["1"]),
      "2": normalizeDbCategories(scoredRaw["2"]),
    },
  };
}

function toUiScoreCard(db: DbScoreCard): ScoreCard {
  const card = createEmptyScoreCard();

  for (const [dbCategory, value] of Object.entries(db) as [DbCategory, number | null][]) {
    card[DB_TO_UI_CATEGORY[dbCategory]] = value;
  }

  return card;
}

function normalizeRpcError(message: string): string {
  if (message.includes("version_mismatch")) {
    return "상대가 먼저 수를 둬 상태가 바뀌었습니다. 최신 상태를 다시 불러왔습니다.";
  }
  if (message.includes("not_your_turn")) {
    return "지금은 내 턴이 아닙니다.";
  }
  if (message.includes("room_not_joinable")) {
    return "이미 시작된 방이거나 참가할 수 없는 상태입니다.";
  }
  if (message.includes("room_full")) {
    return "방이 가득 찼습니다.";
  }
  return message;
}

export default function OnlineClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");

  const [playerKey, setPlayerKey] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextPlayerKey = getOrCreatePlayerKey();
    const savedNickname = window.localStorage.getItem(STORAGE_NICKNAME) ?? "";
    setPlayerKey(nextPlayerKey);
    setNickname(savedNickname);
  }, []);

  const {
    room,
    players,
    gameState,
    onlineByPlayerKey,
    loading,
    error,
    refetchLatest,
    broadcastStateUpdated,
  } = useRealtimeRoom(roomId, {
    playerKey,
    nickname,
    seat: mySeat,
    enabled: Boolean(roomId && playerKey && joined),
  });

  const seat1 = players.find((player) => player.seat === 1) ?? null;
  const seat2 = players.find((player) => player.seat === 2) ?? null;
  const me = players.find((player) => player.player_key === playerKey) ?? null;
  const myFinalSeat = me?.seat ?? (mySeat === 1 || mySeat === 2 ? mySeat : null);
  const opponent = myFinalSeat === 1 ? seat2 : myFinalSeat === 2 ? seat1 : null;

  const onlineState = useMemo(() => {
    const mineOnline = playerKey ? Boolean(onlineByPlayerKey[playerKey]) : false;
    const opponentOnline = opponent ? Boolean(onlineByPlayerKey[opponent.player_key]) : false;
    return { mineOnline, opponentOnline };
  }, [onlineByPlayerKey, opponent, playerKey]);

  const onlineGameState = useMemo(() => parseOnlineState(gameState?.state ?? null), [gameState?.state]);

  const myScoreCard = useMemo(() => {
    if (!onlineGameState || !myFinalSeat) {
      return createEmptyScoreCard();
    }
    return toUiScoreCard(onlineGameState.scoreCard[String(myFinalSeat) as "1" | "2"]);
  }, [myFinalSeat, onlineGameState]);

  const opponentScoreCard = useMemo(() => {
    if (!onlineGameState || !myFinalSeat) {
      return createEmptyScoreCard();
    }
    const opponentSeat = myFinalSeat === 1 ? "2" : "1";
    return toUiScoreCard(onlineGameState.scoreCard[opponentSeat]);
  }, [myFinalSeat, onlineGameState]);

  const myTotal = calculateTotal(myScoreCard);
  const opponentTotal = calculateTotal(opponentScoreCard);

  const isPlaying = room?.status === "playing" && !!onlineGameState;
  const isMyTurn = Boolean(isPlaying && myFinalSeat && onlineGameState?.turnSeat === myFinalSeat);

  const selectableCategories = useMemo(() => {
    if (!onlineGameState || !isMyTurn || onlineGameState.phase !== "scoring" || onlineGameState.rollsUsed <= 0) {
      return [] as YachtCategory[];
    }
    return getAvailableCategories(myScoreCard);
  }, [isMyTurn, myScoreCard, onlineGameState]);

  const submitMove = useCallback(
    async (move: Record<string, unknown>) => {
      if (!roomId || !playerKey || !gameState) {
        return;
      }

      setBusy(true);
      setMessage(null);

      try {
        const supabase = getSupabaseClient(playerKey);
        const { data, error: rpcError } = await supabase.rpc("make_move", {
          p_room_id: roomId,
          p_player_key: playerKey,
          p_expected_version: Number(gameState.version),
          p_move_json: move,
        });

        if (rpcError) {
          throw rpcError;
        }

        const row = (data as Array<{ new_version: number }> | null)?.[0];
        if (row?.new_version !== undefined) {
          await broadcastStateUpdated(Number(row.new_version));
        }

        await refetchLatest();
      } catch (moveError) {
        const rawMessage = moveError instanceof Error ? moveError.message : "move_failed";
        setMessage(normalizeRpcError(rawMessage));
        await refetchLatest();
      } finally {
        setBusy(false);
      }
    },
    [broadcastStateUpdated, gameState, playerKey, refetchLatest, roomId],
  );

  const handleCreateRoom = useCallback(async () => {
    if (!playerKey) {
      return;
    }

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setMessage("닉네임을 입력해 주세요.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      window.localStorage.setItem(STORAGE_NICKNAME, trimmedNickname);

      const supabase = getSupabaseClient(playerKey);
      const { data, error: rpcError } = await supabase.rpc("create_room", {
        p_game_type: "yacht",
        p_player_key: playerKey,
        p_nickname: trimmedNickname,
      });

      if (rpcError) {
        throw rpcError;
      }

      const row = (data as Array<{ room_id: string; seat: number }> | null)?.[0];
      if (!row?.room_id) {
        throw new Error("failed_to_create_room");
      }

      setMySeat(row.seat);
      setJoined(true);

      const inviteUrl = `${window.location.origin}/games/yacht-dice/online?room=${row.room_id}`;
      let copied = false;
      try {
        await navigator.clipboard.writeText(inviteUrl);
        copied = true;
      } catch {
        copied = false;
      }

      router.replace(`/games/yacht-dice/online?room=${row.room_id}`);
      setMessage(copied ? "방이 생성되었습니다. 초대 링크를 클립보드에 복사했습니다." : "방이 생성되었습니다. 아래 링크를 복사해 초대하세요.");
    } catch (createError) {
      const rawMessage = createError instanceof Error ? createError.message : "create_room_failed";
      setMessage(normalizeRpcError(rawMessage));
    } finally {
      setBusy(false);
    }
  }, [nickname, playerKey, router]);

  const handleJoinRoom = useCallback(async () => {
    if (!roomId || !playerKey) {
      return;
    }

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setMessage("닉네임을 입력해 주세요.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      window.localStorage.setItem(STORAGE_NICKNAME, trimmedNickname);

      const supabase = getSupabaseClient(playerKey);
      const { data, error: rpcError } = await supabase.rpc("join_room", {
        p_room_id: roomId,
        p_player_key: playerKey,
        p_nickname: trimmedNickname,
      });

      if (rpcError) {
        throw rpcError;
      }

      const row = (data as Array<{ seat: number }> | null)?.[0];
      if (!row?.seat) {
        throw new Error("failed_to_join_room");
      }

      setMySeat(row.seat);
      setJoined(true);
      setMessage("참가 완료. 상대를 기다리거나 게임을 시작합니다.");
    } catch (joinError) {
      const rawMessage = joinError instanceof Error ? joinError.message : "join_room_failed";
      setMessage(normalizeRpcError(rawMessage));
    } finally {
      setBusy(false);
    }
  }, [nickname, playerKey, roomId]);

  useEffect(() => {
    if (!roomId || !playerKey || joined) {
      return;
    }

    const savedNickname = nickname.trim();
    if (!savedNickname) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const supabase = getSupabaseClient(playerKey);
        const { data, error: rpcError } = await supabase.rpc("join_room", {
          p_room_id: roomId,
          p_player_key: playerKey,
          p_nickname: savedNickname,
        });

        if (cancelled || rpcError) {
          return;
        }

        const row = (data as Array<{ seat: number }> | null)?.[0];
        if (!row?.seat) {
          return;
        }

        setMySeat(row.seat);
        setJoined(true);
      } catch {
        // Manual join remains available.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [joined, nickname, playerKey, roomId]);

  const handleRoll = useCallback(async () => {
    if (!onlineGameState) {
      return;
    }
    const rolledDice = rollDice(onlineGameState.dice, onlineGameState.holds);
    await submitMove({ action: "roll", dice: rolledDice, holds: onlineGameState.holds });
  }, [onlineGameState, submitMove]);

  const handleToggleHold = useCallback(
    async (index: number) => {
      if (!onlineGameState) {
        return;
      }
      const nextHolds = [...onlineGameState.holds] as HoldMask;
      nextHolds[index] = !nextHolds[index];
      await submitMove({ action: "hold", holds: nextHolds });
    },
    [onlineGameState, submitMove],
  );

  const handleScore = useCallback(
    async (category: YachtCategory) => {
      await submitMove({ action: "score", category: UI_TO_DB_CATEGORY[category] });
    },
    [submitMove],
  );

  const inviteLink = roomId
    ? `${typeof window === "undefined" ? "" : window.location.origin}/games/yacht-dice/online?room=${roomId}`
    : "";

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-cyan-300/35 bg-slate-900/80 p-4 sm:p-6">
        <h1 className="mb-4 text-xs uppercase tracking-[0.2em] text-cyan-200">Yacht Dice Online (2P Room)</h1>

        <div className="mb-4 grid gap-2 rounded-lg border border-slate-700/70 bg-slate-950/70 p-3 text-[10px] uppercase tracking-[0.12em] sm:grid-cols-2">
          <p>Room: {roomId ?? "새 방 생성 전"}</p>
          <p>
            Seat: {myFinalSeat ? `Seat ${myFinalSeat}` : "미참가"} / Turn: {onlineGameState ? `Seat ${onlineGameState.turnSeat}` : "-"}
          </p>
          <p>
            Me: {onlineState.mineOnline ? "Online" : "Offline"}
            {me ? ` (${me.nickname})` : ""}
          </p>
          <p>
            Opponent: {opponent ? (onlineState.opponentOnline ? "Online" : "Offline") : "Waiting"}
            {opponent ? ` (${opponent.nickname})` : ""}
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-2">
          <label htmlFor="nickname" className="text-[10px] uppercase tracking-[0.12em] text-slate-300">
            Nickname
          </label>
          <input
            id="nickname"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="닉네임"
            className="rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
        </div>

        {!roomId && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={busy || !playerKey}
              className="rounded border border-cyan-300 bg-cyan-300/20 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-cyan-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
            >
              방 만들기
            </button>
          </div>
        )}

        {roomId && !joined && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleJoinRoom}
              disabled={busy || !playerKey}
              className="rounded border border-emerald-300 bg-emerald-300/20 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-emerald-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
            >
              참가
            </button>
          </div>
        )}

        {roomId && (
          <div className="mb-4 rounded border border-slate-700 bg-slate-950/60 p-3 text-[10px] text-slate-300">
            <p className="mb-2 uppercase tracking-[0.12em]">초대 링크</p>
            <p className="mb-2 break-all font-mono text-[11px] text-cyan-100">{inviteLink}</p>
            <button
              type="button"
              onClick={async () => {
                if (!inviteLink) {
                  return;
                }
                try {
                  await navigator.clipboard.writeText(inviteLink);
                  setMessage("초대 링크를 클립보드에 복사했습니다.");
                } catch {
                  setMessage("클립보드 복사에 실패했습니다. 링크를 직접 복사해 주세요.");
                }
              }}
              className="rounded border border-slate-500 px-3 py-1 uppercase tracking-[0.12em] text-slate-200"
            >
              링크 복사
            </button>
          </div>
        )}

        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-300">
          {busy
            ? "요청 처리 중..."
            : loading
              ? "최신 상태 동기화 중..."
              : message ?? error ?? (room?.status === "waiting" ? "상대를 기다리는 중입니다." : "준비 완료")}
        </p>
      </section>

      {joined && room?.status === "waiting" && (
        <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 sm:p-6">
          <h2 className="mb-2 text-xs uppercase tracking-[0.18em] text-cyan-200">Waiting Room</h2>
          <p className="text-[11px] text-slate-300">두 번째 플레이어가 참가하면 자동으로 게임이 시작됩니다.</p>
        </section>
      )}

      {joined && isPlaying && onlineGameState && (
        <section className="rounded-xl border border-cyan-300/35 bg-slate-900/80 p-4 sm:p-6">
          <div className="mb-4 grid gap-2 rounded-lg border border-slate-700/70 bg-slate-950/70 p-3 text-[10px] uppercase tracking-[0.12em] sm:grid-cols-4">
            <p>Round: {Math.min(onlineGameState.turnNo, YACHT_CATEGORIES.length * 2)}</p>
            <p>Turn: Seat {onlineGameState.turnSeat}</p>
            <p>Total (Me): {myTotal}</p>
            <p>Total (Opponent): {opponentTotal}</p>
          </div>

          <div className="mb-4 grid grid-cols-5 gap-2">
            {onlineGameState.dice.map((value, index) => {
              const held = onlineGameState.holds[index];
              const canToggle = Boolean(isMyTurn && onlineGameState.rollsUsed > 0 && onlineGameState.phase === "scoring");
              return (
                <button
                  key={`die-${index}`}
                  type="button"
                  onClick={() => {
                    void handleToggleHold(index);
                  }}
                  disabled={!canToggle || busy}
                  className={`rounded-lg border px-2 py-4 text-center text-lg ${
                    held ? "border-emerald-300 bg-emerald-300/20 text-emerald-100" : "border-slate-600 bg-slate-900"
                  } ${canToggle && !busy ? "cursor-pointer" : "cursor-not-allowed opacity-80"}`}
                  aria-pressed={held}
                >
                  <span className="block">{value}</span>
                  <span className="block pt-1 text-[9px] uppercase tracking-[0.11em] text-slate-300">{held ? "Hold" : "Free"}</span>
                </button>
              );
            })}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void handleRoll();
              }}
              disabled={!isMyTurn || onlineGameState.rollsUsed >= 3 || onlineGameState.phase === "finished" || busy}
              className="rounded border border-cyan-300 bg-cyan-300/20 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-cyan-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
            >
              Roll ({Math.max(0, 3 - onlineGameState.rollsUsed)} left)
            </button>
            <p className="text-[10px] uppercase tracking-[0.11em] text-slate-300">
              {onlineGameState.phase === "finished"
                ? "게임 종료"
                : isMyTurn
                  ? "내 턴: 주사위를 굴리거나 카테고리를 확정하세요."
                  : "상대 턴 진행 중"}
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="min-w-full border-collapse text-[10px] uppercase tracking-[0.11em]">
              <thead className="bg-slate-900">
                <tr>
                  <th className="border-b border-slate-700 px-3 py-2 text-left">Category</th>
                  <th className="border-b border-slate-700 px-3 py-2 text-left">Me</th>
                  <th className="border-b border-slate-700 px-3 py-2 text-left">Opponent</th>
                </tr>
              </thead>
              <tbody>
                {YACHT_CATEGORIES.map((category) => {
                  const myLocked = myScoreCard[category];
                  const oppLocked = opponentScoreCard[category];
                  const canPick = selectableCategories.includes(category);
                  const preview = calculateCategoryScore(onlineGameState.dice, category);
                  return (
                    <tr key={category} className={canPick ? "bg-emerald-300/10" : "bg-slate-950/40 odd:bg-slate-900/30"}>
                      <td className="border-b border-slate-800 px-3 py-2">{category}</td>
                      <td className="border-b border-slate-800 px-3 py-2">
                        {myLocked !== null ? (
                          <span className="text-cyan-100">{myLocked}</span>
                        ) : canPick ? (
                          <button
                            type="button"
                            onClick={() => {
                              void handleScore(category);
                            }}
                            disabled={busy}
                            className="rounded border border-emerald-300 bg-emerald-300/25 px-2 py-1 text-emerald-100 disabled:opacity-60"
                          >
                            Take {preview}
                          </button>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="border-b border-slate-800 px-3 py-2">
                        {oppLocked !== null ? <span className="text-amber-100">{oppLocked}</span> : <span>-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
