"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale, Messages } from "@/lib/i18n";
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
import { ArcadeHud, DiceRow, PixelButton, ScoreBoard, YachtLayout } from "@/components/yacht";

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

type VsAiClientProps = {
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

export default function VsAiClient({ locale, text }: VsAiClientProps) {
  const [difficulty] = useState<AIDifficulty>("normal");
  const [game, setGame] = useState<GameState>(createInitialGameState);

  const humanTurn = game.currentPlayer === "human" && game.status === "playing";
  const aiTurn = game.currentPlayer === "ai" && game.status === "playing";
  const aiThinking = aiTurn;
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
    <YachtLayout
      top={
        <ArcadeHud
          leftTitle={text.playerScore}
          leftScore={humanTotal}
          rightTitle={text.aiScore}
          rightScore={aiTotal}
          centerSlot={
            <PixelButton
              tone="amber"
              onClick={() => onRoll()}
              disabled={!humanTurn || game.rollsUsed >= MAX_ROLLS}
              className="min-w-[180px] rounded-[10px] border-[4px] border-[#cc8200] px-7 py-2 text-[34px] leading-none tracking-[0.05em] shadow-[0_7px_0_#613100] active:translate-y-[3px] active:shadow-[0_3px_0_#613100] sm:min-w-[230px] sm:px-10 sm:py-3 sm:text-[48px]"
            >
              {`${text.roll} ${Math.max(0, MAX_ROLLS - game.rollsUsed)}`}
            </PixelButton>
          }
          activeSide={game.status === "playing" ? (humanTurn ? "left" : "right") : null}
          statusLabel={
            game.status === "finished"
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
        <>
          <DiceRow
            dice={game.turnDice}
            holds={game.turnHolds}
            canToggle={humanTurn && game.rollsUsed > 0}
            onToggle={(index) => onToggleHold(index)}
          />
        </>
      }
      bottom={
        <ScoreBoard
          locale={locale}
          categoryLabel={text.categoryLabel}
          hoverHint={text.hoverHint}
          categories={YACHT_CATEGORIES}
          youLabel={text.you}
          opponentLabel={text.ai}
          youCard={game.humanCard}
          opponentCard={game.aiCard}
          previewDice={game.turnDice}
          previewEnabled={humanTurn && game.rollsUsed > 0}
          selectable={selectableCategories}
          onSelect={(category) => endTurnWithCategory("human", category)}
          selectDisabled={!humanTurn}
        />
      }
    />
  );
}
