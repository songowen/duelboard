"use client";

import { useEffect, useMemo, useState } from "react";
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

type PlayerKey = "human" | "ai";

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

function getRoundNumber(humanCard: ScoreCard, aiCard: ScoreCard): number {
  const humanFilled = YACHT_CATEGORIES.length - getAvailableCategories(humanCard).length;
  const aiFilled = YACHT_CATEGORIES.length - getAvailableCategories(aiCard).length;
  return Math.min(humanFilled, aiFilled) + 1;
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

export default function VsAiClient() {
  const [difficulty, setDifficulty] = useState<AIDifficulty>("normal");
  const [game, setGame] = useState<GameState>(createInitialGameState);

  const humanTurn = game.currentPlayer === "human" && game.status === "playing";
  const aiTurn = game.currentPlayer === "ai" && game.status === "playing";
  const aiThinking = aiTurn;
  const round = getRoundNumber(game.humanCard, game.aiCard);
  const humanTotal = calculateTotal(game.humanCard);
  const aiTotal = calculateTotal(game.aiCard);

  const selectableCategories = useMemo(() => {
    if (!humanTurn || game.rollsUsed === 0) {
      return [];
    }
    return getAvailableCategories(game.humanCard);
  }, [game.humanCard, game.rollsUsed, humanTurn]);

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

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-cyan-300/35 bg-slate-900/80 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xs uppercase tracking-[0.2em] text-cyan-200">Yacht Dice VS AI (Classic A)</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDifficulty("easy")}
              className={`rounded border px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${
                difficulty === "easy"
                  ? "border-emerald-300 bg-emerald-300/20 text-emerald-100"
                  : "border-slate-600 text-slate-300"
              }`}
            >
              Easy
            </button>
            <button
              type="button"
              onClick={() => setDifficulty("normal")}
              className={`rounded border px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${
                difficulty === "normal"
                  ? "border-cyan-300 bg-cyan-300/20 text-cyan-100"
                  : "border-slate-600 text-slate-300"
              }`}
            >
              Normal
            </button>
          </div>
        </div>

        <div className="mb-4 grid gap-2 rounded-lg border border-slate-700/70 bg-slate-950/70 p-3 text-[10px] uppercase tracking-[0.12em] sm:grid-cols-4">
          <p>Round: {Math.min(round, YACHT_CATEGORIES.length)}</p>
          <p>Turn: {game.currentPlayer === "human" ? "You" : "AI"}</p>
          <p>Total (You): {humanTotal}</p>
          <p>Total (AI): {aiTotal}</p>
        </div>

        <div className="mb-4 grid grid-cols-5 gap-2">
          {game.turnDice.map((value, index) => {
            const held = game.turnHolds[index];
            const canToggle = humanTurn && game.rollsUsed > 0;
            return (
              <button
                key={`die-${index}`}
                type="button"
                onClick={() => onToggleHold(index)}
                disabled={!canToggle}
                className={`rounded-lg border px-2 py-4 text-center text-lg ${
                  held ? "border-emerald-300 bg-emerald-300/20 text-emerald-100" : "border-slate-600 bg-slate-900"
                } ${canToggle ? "cursor-pointer" : "cursor-not-allowed opacity-80"}`}
                aria-pressed={held}
              >
                <span className="block">{value}</span>
                <span className="block pt-1 text-[9px] uppercase tracking-[0.11em] text-slate-300">
                  {held ? "Hold" : "Free"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onRoll()}
            disabled={!humanTurn || game.rollsUsed >= MAX_ROLLS}
            className="rounded border border-cyan-300 bg-cyan-300/20 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-cyan-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
          >
            Roll ({MAX_ROLLS - game.rollsUsed} left)
          </button>
          <button
            type="button"
            onClick={() => {
              setGame(createInitialGameState());
            }}
            className="rounded border border-slate-500 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-slate-200"
          >
            New Game
          </button>
          <p className="text-[10px] uppercase tracking-[0.11em] text-slate-300">
            {game.status === "finished"
              ? game.winner === "draw"
                ? "Result: Draw"
                : `Result: ${game.winner === "human" ? "You Win" : "AI Wins"}`
              : aiThinking
                ? "AI is thinking..."
                : humanTurn
                  ? "Select holds, then roll or lock a category."
                  : "AI turn in progress."}
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="min-w-full border-collapse text-[10px] uppercase tracking-[0.11em]">
            <thead className="bg-slate-900">
              <tr>
                <th className="border-b border-slate-700 px-3 py-2 text-left">Category</th>
                <th className="border-b border-slate-700 px-3 py-2 text-left">You</th>
                <th className="border-b border-slate-700 px-3 py-2 text-left">AI</th>
              </tr>
            </thead>
            <tbody>
              {YACHT_CATEGORIES.map((category) => {
                const humanLocked = game.humanCard[category];
                const aiLocked = game.aiCard[category];
                const canPick = selectableCategories.includes(category);
                const preview = calculateCategoryScore(game.turnDice, category);
                return (
                  <tr
                    key={category}
                    className={canPick ? "bg-emerald-300/10" : "bg-slate-950/40 odd:bg-slate-900/30"}
                  >
                    <td className="border-b border-slate-800 px-3 py-2">{category}</td>
                    <td className="border-b border-slate-800 px-3 py-2">
                      {humanLocked !== null ? (
                        <span className="text-cyan-100">{humanLocked}</span>
                      ) : canPick ? (
                        <button
                          type="button"
                          onClick={() => endTurnWithCategory("human", category)}
                          className="rounded border border-emerald-300 bg-emerald-300/25 px-2 py-1 text-emerald-100"
                        >
                          Take {preview}
                        </button>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="border-b border-slate-800 px-3 py-2">
                      {aiLocked !== null ? <span className="text-amber-100">{aiLocked}</span> : <span>-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 sm:p-6">
        <h2 className="mb-3 text-xs uppercase tracking-[0.18em] text-cyan-200">Rules Summary / FAQ</h2>
        <div className="space-y-3 text-[11px] leading-6 text-slate-300">
          <p>
            <strong>How many rolls per turn?</strong> Up to 3 rolls total (first roll + up to 2 rerolls).
          </p>
          <p>
            <strong>Can I hold dice?</strong> Yes. After rolling at least once, click any die to lock/unlock it.
          </p>
          <p>
            <strong>How do categories work?</strong> You must lock exactly one category per turn, and each category can
            be used only once.
          </p>
          <p>
            <strong>When does the game end?</strong> The game ends when both players fill every category. Highest total
            score wins.
          </p>
          <p>
            <strong>Classic A scoring notes</strong>: Small Straight = 15, Large Straight = 30, Yacht = 50, and Choice
            / Four of a Kind / Full House score by dice sum when valid.
          </p>
        </div>
      </section>
    </div>
  );
}
