"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Locale, Messages } from "@/lib/i18n";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
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
import { ArcadeHud, DiceRow, PixelButton, PixelPanel, ScoreBoard, YachtLayout } from "@/components/yacht";

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

type OnlineClientProps = {
  locale: Locale;
  text: Messages["yachtOnline"];
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

function normalizeRpcError(message: string, t: Messages["yachtOnline"]): string {
  if (message.includes("version_mismatch")) {
    return t.errorVersionMismatch;
  }
  if (message.includes("not_your_turn")) {
    return t.errorNotYourTurn;
  }
  if (message.includes("room_not_joinable")) {
    return t.errorRoomNotJoinable;
  }
  if (message.includes("room_full")) {
    return t.errorRoomFull;
  }
  return message;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function OnlineClient({ locale, text }: OnlineClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");

  const [playerKey, setPlayerKey] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const t = text;

  useEffect(() => {
    const nextPlayerKey = getOrCreatePlayerKey();
    const savedNickname = window.localStorage.getItem(STORAGE_NICKNAME) ?? "";
    setPlayerKey(nextPlayerKey);
    setNickname(savedNickname);
    setOrigin(window.location.origin);
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
        setMessage(normalizeRpcError(rawMessage, t));
        await refetchLatest();
      } finally {
        setBusy(false);
      }
    },
    [broadcastStateUpdated, gameState, playerKey, refetchLatest, roomId, t],
  );

  const handleCreateRoom = useCallback(async () => {
    if (!playerKey) {
      return;
    }

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setMessage(t.requireNickname);
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
      setMessage(copied ? t.createRoomCopied : t.createRoomCreated);
    } catch (createError) {
      const rawMessage = createError instanceof Error ? createError.message : "create_room_failed";
      setMessage(normalizeRpcError(rawMessage, t));
    } finally {
      setBusy(false);
    }
  }, [nickname, playerKey, router, t]);

  const handleJoinRoom = useCallback(async () => {
    if (!roomId || !playerKey) {
      return;
    }
    if (!isUuid(roomId)) {
      setMessage(t.invalidRoomId);
      return;
    }

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setMessage(t.requireNickname);
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      window.localStorage.setItem(STORAGE_NICKNAME, trimmedNickname);

      const supabase = getSupabaseClient(playerKey);
      const payload = {
        p_room_id: roomId,
        p_player_key: playerKey,
        p_nickname: trimmedNickname,
      };
      console.log("[join_room:manual] payload", payload);
      const { data, error: rpcError } = await supabase.rpc("join_room", payload);

      if (rpcError) {
        throw rpcError;
      }

      const row = (data as Array<{ seat: number }> | null)?.[0];
      if (!row?.seat) {
        throw new Error("failed_to_join_room");
      }

      setMySeat(row.seat);
      setJoined(true);
      setMessage(t.joinRoomDone);
    } catch (joinError) {
      const rawMessage = joinError instanceof Error ? joinError.message : "join_room_failed";
      setMessage(normalizeRpcError(rawMessage, t));
    } finally {
      setBusy(false);
    }
  }, [nickname, playerKey, roomId, t]);

  useEffect(() => {
    if (!roomId || !playerKey || joined) {
      return;
    }
    if (!isUuid(roomId)) {
      setMessage(t.invalidRoomId);
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
        const payload = {
          p_room_id: roomId,
          p_player_key: playerKey,
          p_nickname: savedNickname,
        };
        console.log("[join_room:auto] payload", payload);
        const { data, error: rpcError } = await supabase.rpc("join_room", payload);

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
  }, [joined, nickname, playerKey, roomId, t.invalidRoomId]);

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

  const inviteLink = roomId ? `${origin}/games/yacht-dice/online?room=${roomId}` : "";
  const shortRoomId = roomId ? `${roomId.slice(0, 6)}...${roomId.slice(-4)}` : "-";

  return (
    <div className="space-y-5 bg-black">
      {(!joined || !isPlaying) && (
        <PixelPanel tone="cyan" className="space-y-4">
          <h1 className="text-xs uppercase tracking-[0.16em] text-cyan-100">{t.title}</h1>
          <p className="text-[11px] text-slate-300">{t.subtitle}</p>

          <div className="grid gap-2 text-[10px] uppercase tracking-[0.11em] text-slate-300 sm:grid-cols-2">
            <p>
              {t.roomLabel}: {roomId ?? t.roomBeforeCreate}
            </p>
            <p>
              {t.seatLabel}: {myFinalSeat ? `#${myFinalSeat}` : t.notJoined} / {t.turnLabel}:{" "}
              {onlineGameState ? `#${onlineGameState.turnSeat}` : "-"}
            </p>
            <p>
              {t.meLabel}: {onlineState.mineOnline ? t.meOnline : t.meOffline}
              {me ? ` (${me.nickname})` : ""}
            </p>
            <p>
              {t.opponent}: {opponent ? (onlineState.opponentOnline ? t.meOnline : t.meOffline) : t.waiting}
              {opponent ? ` (${opponent.nickname})` : ""}
            </p>
          </div>
          <div className="h-px bg-slate-700/70" />

          <div className="flex flex-col gap-2">
            <label htmlFor="nickname" className="text-[10px] uppercase tracking-[0.12em] text-slate-300">
              {t.nickname}
            </label>
            <input
              id="nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder={t.nicknamePlaceholder}
              className="border-0 border-b border-slate-600 bg-black px-0 py-2 text-sm text-slate-100 focus:border-cyan-300 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!roomId && (
              <PixelButton tone="cyan" onClick={handleCreateRoom} disabled={busy || !playerKey}>
                {t.createRoom}
              </PixelButton>
            )}

            {roomId && !joined && (
              <PixelButton tone="emerald" onClick={handleJoinRoom} disabled={busy || !playerKey}>
                {t.joinRoom}
              </PixelButton>
            )}

            {roomId && (
              <PixelButton
                tone="slate"
                onClick={async () => {
                  if (!inviteLink) {
                    return;
                  }
                  try {
                    await navigator.clipboard.writeText(inviteLink);
                    setMessage(t.copyDone);
                  } catch {
                    setMessage(t.copyFailed);
                  }
                }}
              >
                {t.copyLink}
              </PixelButton>
            )}
          </div>

          {roomId && (
            <div className="space-y-1 text-[10px] text-slate-300">
              <p className="uppercase tracking-[0.12em] text-slate-400">{t.inviteLink}</p>
              <p className="break-all font-mono text-[11px] text-cyan-100">{inviteLink}</p>
            </div>
          )}

          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-300">
            {busy
              ? t.roomRequesting
              : loading
                ? t.roomSyncing
                : message ?? error ?? (room?.status === "waiting" ? t.roomWaitingOpponent : t.roomReady)}
          </p>
        </PixelPanel>
      )}

      {joined && room?.status === "waiting" && (
        <PixelPanel tone="amber" className="space-y-2">
          <h2 className="text-xs uppercase tracking-[0.16em] text-amber-100">{t.waitingRoom}</h2>
          <p className="text-[11px] text-slate-300">{t.waitingRoomDesc}</p>
        </PixelPanel>
      )}

      {joined && isPlaying && onlineGameState && (
        <YachtLayout
          top={
            <ArcadeHud
              leftTitle={t.playerScore}
              leftScore={myTotal}
              rightTitle={t.rivalScore}
              rightScore={opponentTotal}
              centerSlot={
                <PixelButton
                  tone="amber"
                  onClick={() => {
                    void handleRoll();
                  }}
                  disabled={!isMyTurn || onlineGameState.rollsUsed >= 3 || onlineGameState.phase === "finished" || busy}
                  className="min-w-[180px] rounded-[10px] border-[4px] border-[#cc8200] px-7 py-2 text-[34px] leading-none tracking-[0.05em] shadow-[0_7px_0_#613100] active:translate-y-[3px] active:shadow-[0_3px_0_#613100] sm:min-w-[230px] sm:px-10 sm:py-3 sm:text-[48px]"
                >
                  {`${t.roll} ${Math.max(0, 3 - onlineGameState.rollsUsed)}`}
                </PixelButton>
              }
              activeSide={isMyTurn ? "left" : "right"}
              statusLabel={
                onlineGameState.phase === "finished"
                  ? t.gameOver
                  : isMyTurn
                    ? t.youLabel
                    : t.rivalLabel
              }
              rightSlot={
                <p className="text-[11px] uppercase tracking-[0.06em] text-slate-200">
                  {t.roomLabel} {shortRoomId} • {t.seatLabel} {myFinalSeat ? `#${myFinalSeat}` : "-"} • {t.turnLabel}{" "}
                  #{onlineGameState.turnSeat} •{" "}
                  {opponent ? (onlineState.opponentOnline ? t.rivalOnline : t.rivalOffline) : `${t.rivalLabel} ${t.waiting}`}
                </p>
              }
              detailsPanel={{
                summary: t.roomInviteDetails,
                content: (
                  <div className="space-y-2 text-[11px] text-slate-200">
                    <p className="font-mono text-[10px] text-cyan-200">
                      {t.roomId}: {roomId}
                    </p>
                    <p className="break-all font-mono text-[10px] text-cyan-100">{inviteLink}</p>
                    <div className="flex items-center gap-2">
                      <PixelButton
                        tone="slate"
                        onClick={async () => {
                          if (!inviteLink) {
                            return;
                          }
                          try {
                            await navigator.clipboard.writeText(inviteLink);
                            setMessage(t.copyDone);
                          } catch {
                            setMessage(t.copyFailed);
                          }
                        }}
                      >
                        {t.copyLink}
                      </PixelButton>
                      <span className="text-[10px] uppercase tracking-[0.08em] text-slate-400">
                        {t.opponent}: {opponent?.nickname ?? t.waiting}
                      </span>
                    </div>
                  </div>
                ),
              }}
            />
          }
          middle={
            <>
              <DiceRow
                dice={onlineGameState.dice}
                holds={onlineGameState.holds}
                canToggle={Boolean(isMyTurn && onlineGameState.rollsUsed > 0 && onlineGameState.phase === "scoring")}
                busy={busy}
                onToggle={(index) => {
                  void handleToggleHold(index);
                }}
              />
            </>
          }
          bottom={
            <ScoreBoard
              locale={locale}
              categoryLabel={t.categoryLabel}
              hoverHint={t.hoverHint}
              categories={YACHT_CATEGORIES}
              youLabel={t.youLabel}
              opponentLabel={t.rivalLabel}
              youCard={myScoreCard}
              opponentCard={opponentScoreCard}
              previewDice={onlineGameState.dice}
              previewEnabled={Boolean(isMyTurn && onlineGameState.rollsUsed > 0 && onlineGameState.phase !== "finished")}
              selectable={selectableCategories}
              onSelect={(category) => {
                void handleScore(category);
              }}
              selectDisabled={busy}
            />
          }
        />
      )}
    </div>
  );
}
