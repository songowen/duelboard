"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PixelButton } from "@/components/game-core/ui/PixelButton";
import { YachtCelebration } from "@/components/games/yacht-dice/shared/YachtCelebration";
import type { Locale, Messages } from "@/lib/i18n";
import { isYacht } from "@/lib/yachtDiceFx";
import { AIDifficulty, chooseAiAction } from "@/lib/yacht-dice-ai";
import {
  calculateCategoryScore,
  calculateTotal,
  createEmptyHolds,
  createEmptyScoreCard,
  createInitialDice,
  Dice,
  getAvailableCategories,
  HoldMask,
  rollDice,
  ScoreCard,
  YACHT_CATEGORIES,
  YachtCategory,
} from "@/lib/yacht-dice-core";
import { DiceTray, RollButton, ScoreTable, TopScores, YachtShell } from "@/components/games/yacht-dice";

type PlayerKey = "human" | "ai";
type MatchPhase = "preGame" | "playing" | "finished";

type GameState = {
  currentPlayer: PlayerKey;
  turnDice: Dice;
  turnHolds: HoldMask;
  rollsUsed: number;
  humanCard: ScoreCard;
  aiCard: ScoreCard;
  status: "playing" | "finished";
  winner: PlayerKey | "draw" | null;
};

type VsAiContainerProps = {
  locale: Locale;
  text: Messages["yachtVsAi"];
};

const MAX_ROLLS = 3;

function createInitialGameState(): GameState {
  return {
    currentPlayer: "human",
    turnDice: createInitialDice(),
    turnHolds: createEmptyHolds(),
    rollsUsed: 0,
    humanCard: createEmptyScoreCard(),
    aiCard: createEmptyScoreCard(),
    status: "playing",
    winner: null,
  };
}

function isGameFinished(humanCard: ScoreCard, aiCard: ScoreCard): boolean {
  return getAvailableCategories(humanCard).length === 0 && getAvailableCategories(aiCard).length === 0;
}

function resolveWinner(humanCard: ScoreCard, aiCard: ScoreCard): PlayerKey | "draw" {
  const humanTotal = calculateTotal(humanCard);
  const aiTotal = calculateTotal(aiCard);
  if (humanTotal === aiTotal) {
    return "draw";
  }
  return humanTotal > aiTotal ? "human" : "ai";
}

export function VsAiContainer({ locale, text }: VsAiContainerProps) {
  const [difficulty, setDifficulty] = useState<AIDifficulty>("normal");
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("preGame");
  const [game, setGame] = useState<GameState>(createInitialGameState);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const celebratedTurnRef = useRef<string | null>(null);

  const matchPlaying = matchPhase === "playing";
  const humanTurn = matchPlaying && game.currentPlayer === "human" && game.status === "playing";
  const aiTurn = matchPlaying && game.currentPlayer === "ai" && game.status === "playing";
  const aiThinking = aiTurn;
  const humanTotal = calculateTotal(game.humanCard);
  const aiTotal = calculateTotal(game.aiCard);

  const selectableCategories = useMemo(() => {
    if (!humanTurn || game.rollsUsed === 0) {
      return [];
    }
    return getAvailableCategories(game.humanCard);
  }, [game.humanCard, game.rollsUsed, humanTurn]);

  const turnMarker = useMemo(() => {
    const humanScoredCount = Object.values(game.humanCard).filter((value) => typeof value === "number").length;
    const aiScoredCount = Object.values(game.aiCard).filter((value) => typeof value === "number").length;
    return `${game.currentPlayer}:${humanScoredCount}:${aiScoredCount}`;
  }, [game.aiCard, game.currentPlayer, game.humanCard]);

  const endTurnWithCategory = (player: PlayerKey, category: YachtCategory) => {
    setGame((current) => {
      if (current.status !== "playing") {
        return current;
      }
      const score = calculateCategoryScore(current.turnDice, category);
      const nextHuman = { ...current.humanCard };
      const nextAi = { ...current.aiCard };
      if (player === "human") {
        nextHuman[category] = score;
      } else {
        nextAi[category] = score;
      }

      if (isGameFinished(nextHuman, nextAi)) {
        return {
          ...current,
          humanCard: nextHuman,
          aiCard: nextAi,
          status: "finished",
          winner: resolveWinner(nextHuman, nextAi),
        };
      }

      return {
        ...current,
        humanCard: nextHuman,
        aiCard: nextAi,
        currentPlayer: player === "human" ? "ai" : "human",
        turnDice: createInitialDice(),
        turnHolds: createEmptyHolds(),
        rollsUsed: 0,
      };
    });
  };

  const onRoll = (holdsOverride?: HoldMask) => {
    setGame((current) => {
      if (current.status !== "playing" || current.rollsUsed >= MAX_ROLLS) {
        return current;
      }
      const holds = holdsOverride ?? current.turnHolds;
      const rolled = rollDice(current.turnDice, holds);
      return {
        ...current,
        turnDice: rolled,
        turnHolds: holds,
        rollsUsed: current.rollsUsed + 1,
      };
    });
  };

  const onToggleHold = (index: number) => {
    setGame((current) => {
      if (!humanTurn || current.rollsUsed === 0) {
        return current;
      }
      const nextHolds = [...current.turnHolds] as HoldMask;
      nextHolds[index] = !nextHolds[index];
      return { ...current, turnHolds: nextHolds };
    });
  };

  const startMatch = () => {
    celebratedTurnRef.current = null;
    setCelebrationOpen(false);
    setGame(createInitialGameState());
    setMatchPhase("playing");
  };

  const playAgain = () => {
    celebratedTurnRef.current = null;
    setCelebrationOpen(false);
    setGame(createInitialGameState());
    setMatchPhase("playing");
  };

  useEffect(() => {
    if (!aiTurn) {
      return;
    }

    const timeout = window.setTimeout(
      () => {
        const aiAction = chooseAiAction({
          dice: game.turnDice,
          rollsUsed: game.rollsUsed,
          scoreCard: game.aiCard,
          difficulty,
        });

        if (aiAction.type === "roll") {
          onRoll(aiAction.holds);
          return;
        }

        endTurnWithCategory("ai", aiAction.category);
      },
      game.rollsUsed === 0 ? 700 : 850,
    );

    return () => window.clearTimeout(timeout);
  }, [aiTurn, difficulty, game.aiCard, game.rollsUsed, game.turnDice]);

  useEffect(() => {
    if (matchPhase === "playing" && game.status === "finished") {
      setMatchPhase("finished");
    }
  }, [game.status, matchPhase]);

  useEffect(() => {
    if (!celebrationOpen) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setCelebrationOpen(false);
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [celebrationOpen]);

  useEffect(() => {
    if (matchPhase !== "playing" || game.status !== "playing" || game.rollsUsed <= 0) {
      return;
    }
    if (!isYacht(game.turnDice)) {
      return;
    }
    if (celebratedTurnRef.current === turnMarker) {
      return;
    }

    celebratedTurnRef.current = turnMarker;
    setCelebrationOpen(true);
  }, [game.rollsUsed, game.status, game.turnDice, matchPhase, turnMarker]);

  const winnerHeadline =
    game.winner === "human" ? `${text.youWin}!` : game.winner === "ai" ? `${text.aiWins}!` : `${text.draw}!`;
  if (matchPhase === "preGame") {
    return (
      <YachtShell
        top={
          <TopScores
            leftTitle={text.playerScore}
            leftScore={0}
            rightTitle={text.aiScore}
            rightScore={0}
            centerSlot={<RollButton label={`${text.roll} ${MAX_ROLLS}`} onClick={() => undefined} disabled />}
            activeSide={null}
          />
        }
        middle={
          <div className="mx-auto w-full max-w-2xl rounded-xl border border-slate-700 bg-[url('/game-bg.png')] bg-cover bg-center p-6 text-center">
            <h2 className="text-sm uppercase tracking-[0.16em] text-yellow-300">{text.difficultySelectTitle}</h2>
            <p className="mt-3 text-[12px] text-slate-300">{text.difficultySelectDescription}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <PixelButton
                tone={difficulty === "easy" ? "amber" : "slate"}
                onClick={() => setDifficulty("easy")}
                aria-pressed={difficulty === "easy"}
              >
                {text.difficultyEasy}
              </PixelButton>
              <PixelButton
                tone={difficulty === "normal" ? "amber" : "slate"}
                onClick={() => setDifficulty("normal")}
                aria-pressed={difficulty === "normal"}
              >
                {text.difficultyNormal}
              </PixelButton>
            </div>
            <div className="mt-6">
              <PixelButton tone="amber" onClick={startMatch}>
                {text.startMatch}
              </PixelButton>
            </div>
            <p className="mt-4 text-[11px] text-slate-400">{text.difficultyLockedHint}</p>
          </div>
        }
        bottom={<div className="h-2" />}
      />
    );
  }

  return (
    <div className="relative">
      <YachtShell
        top={
          <TopScores
            leftTitle={text.playerScore}
            leftScore={humanTotal}
            rightTitle={text.aiScore}
            rightScore={aiTotal}
            centerSlot={
              <RollButton
                label={`${text.roll} ${Math.max(0, MAX_ROLLS - game.rollsUsed)}`}
                onClick={() => onRoll()}
                disabled={!humanTurn || game.rollsUsed >= MAX_ROLLS}
              />
            }
            activeSide={matchPhase === "playing" ? (humanTurn ? "left" : "right") : null}
            statusLabel={
              matchPhase === "finished"
                ? game.winner === "draw"
                  ? text.draw
                  : game.winner === "human"
                    ? text.youWin
                    : text.aiWins
                : aiThinking
                  ? text.aiThinking
                  : humanTurn
                    ? text.yourTurn
                    : text.aiTurn
            }
          />
        }
        middle={
          <DiceTray
            dice={game.turnDice}
            holds={game.turnHolds}
            canToggle={humanTurn && game.rollsUsed > 0}
            onToggle={(index) => onToggleHold(index)}
          />
        }
        bottom={
          <ScoreTable
            locale={locale}
            categoryLabel={text.categoryLabel}
            categories={YACHT_CATEGORIES}
            youLabel={text.you}
            opponentLabel={text.ai}
            youCard={game.humanCard}
            opponentCard={game.aiCard}
            previewDice={game.turnDice}
            previewEnabled={humanTurn && game.rollsUsed > 0}
            hideOpponentValuesWhilePreview
            selectable={selectableCategories}
            onSelect={(category) => endTurnWithCategory("human", category)}
            selectDisabled={!humanTurn}
          />
        }
      />

      {matchPhase === "finished" ? (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 px-4"
          role="dialog"
          aria-modal="true"
          aria-label={winnerHeadline}
        >
          <div className="relative w-full max-w-2xl rounded-xl border border-[#f6d32d]/70 bg-black/95 px-5 py-8 text-center">
            <p className="text-[44px] uppercase leading-none tracking-[0.08em] text-yellow-300 sm:text-[72px]">{winnerHeadline}</p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <PixelButton tone={difficulty === "easy" ? "amber" : "slate"} onClick={() => setDifficulty("easy")} aria-pressed={difficulty === "easy"}>
                {text.difficultyEasy}
              </PixelButton>
              <PixelButton
                tone={difficulty === "normal" ? "amber" : "slate"}
                onClick={() => setDifficulty("normal")}
                aria-pressed={difficulty === "normal"}
              >
                {text.difficultyNormal}
              </PixelButton>
            </div>

            <div className="mt-6">
              <PixelButton tone="amber" onClick={playAgain}>
                {text.playAgain}
              </PixelButton>
            </div>
          </div>
        </div>
      ) : null}

      <YachtCelebration open={celebrationOpen} durationMs={900} />
    </div>
  );
}

export default VsAiContainer;
