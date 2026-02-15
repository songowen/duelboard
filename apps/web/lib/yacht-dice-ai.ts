import {
  calculateCategoryScore,
  countFaces,
  createEmptyHolds,
  Dice,
  getAvailableCategories,
  getBestScoringCategory,
  HoldMask,
  ScoreCard,
  YachtCategory,
} from "@/lib/yacht-dice-core";

export type AIDifficulty = "easy" | "normal";
export type AITurnAction =
  | { type: "roll"; holds: HoldMask }
  | { type: "score"; category: YachtCategory };

const NORMAL_TIE_BREAKER: YachtCategory[] = [
  "Yacht",
  "Large Straight",
  "Four of a Kind",
  "Full House",
  "Small Straight",
  "Choice",
  "Sixes",
  "Fives",
  "Fours",
  "Threes",
  "Twos",
  "Ones",
];

const EASY_TIE_BREAKER: YachtCategory[] = [
  "Choice",
  "Sixes",
  "Fives",
  "Fours",
  "Threes",
  "Twos",
  "Ones",
  "Small Straight",
  "Full House",
  "Four of a Kind",
  "Large Straight",
  "Yacht",
];

function getMostFrequentFace(dice: Dice): number {
  const counts = countFaces(dice);
  const entries = Object.entries(counts) as Array<[string, number]>;
  entries.sort((a, b) => b[1] - a[1] || Number(b[0]) - Number(a[0]));
  return Number(entries[0][0]);
}

function getStraightHolds(dice: Dice): HoldMask {
  const bestRun = [1, 2, 3, 4, 5, 6].reduce<{ run: number[]; score: number }>(
    (best, _, startIndex, arr) => {
      const run = arr.slice(startIndex, startIndex + 4);
      if (run.length < 4) {
        return best;
      }
      const uniqueRunMatches = new Set(dice.filter((value) => run.includes(value))).size;
      if (uniqueRunMatches > best.score) {
        return { run, score: uniqueRunMatches };
      }
      return best;
    },
    { run: [1, 2, 3, 4], score: 0 },
  ).run;

  return dice.map((value) => bestRun.includes(value)) as HoldMask;
}

function getSimpleHolds(dice: Dice): HoldMask {
  const mainFace = getMostFrequentFace(dice);
  return dice.map((value) => value === mainFace) as HoldMask;
}

function getNormalHolds(dice: Dice, scoreCard: ScoreCard): HoldMask {
  const available = getAvailableCategories(scoreCard);
  const hasStraightGoals =
    available.includes("Small Straight") || available.includes("Large Straight");
  const hasSetGoals =
    available.includes("Yacht") ||
    available.includes("Four of a Kind") ||
    available.includes("Full House");

  if (hasStraightGoals) {
    const straightHolds = getStraightHolds(dice);
    const holdCount = straightHolds.filter(Boolean).length;
    if (holdCount >= 3) {
      return straightHolds;
    }
  }

  if (hasSetGoals) {
    const setHolds = getSimpleHolds(dice);
    if (setHolds.filter(Boolean).length >= 2) {
      return setHolds;
    }
  }

  let bestUpperCategory: YachtCategory | null = null;
  let bestUpperValue = -1;
  const upperCandidates: YachtCategory[] = ["Ones", "Twos", "Threes", "Fours", "Fives", "Sixes"];
  for (const category of upperCandidates) {
    if (!available.includes(category)) {
      continue;
    }
    const score = calculateCategoryScore(dice, category);
    if (score > bestUpperValue) {
      bestUpperValue = score;
      bestUpperCategory = category;
    }
  }

  if (bestUpperCategory) {
    const faceMap: Record<YachtCategory, number> = {
      Ones: 1,
      Twos: 2,
      Threes: 3,
      Fours: 4,
      Fives: 5,
      Sixes: 6,
      Choice: 6,
      "Four of a Kind": 6,
      "Full House": 6,
      "Small Straight": 6,
      "Large Straight": 6,
      Yacht: 6,
    };
    const target = faceMap[bestUpperCategory];
    return dice.map((value) => value === target) as HoldMask;
  }

  if (available.includes("Choice")) {
    return dice.map((value) => value >= 4) as HoldMask;
  }

  return createEmptyHolds();
}

function shouldNormalAiScoreNow(bestScore: number, rollsUsed: number): boolean {
  if (rollsUsed >= 3) {
    return true;
  }
  if (rollsUsed === 2 && bestScore >= 20) {
    return true;
  }
  if (rollsUsed === 2 && bestScore === 0) {
    return false;
  }
  return rollsUsed === 2 && bestScore >= 15;
}

export function chooseAiAction(params: {
  dice: Dice;
  rollsUsed: number;
  scoreCard: ScoreCard;
  difficulty: AIDifficulty;
}): AITurnAction {
  const { dice, rollsUsed, scoreCard, difficulty } = params;

  if (rollsUsed === 0) {
    return { type: "roll", holds: createEmptyHolds() };
  }

  const tieBreaker = difficulty === "normal" ? NORMAL_TIE_BREAKER : EASY_TIE_BREAKER;
  const best = getBestScoringCategory(dice, scoreCard, tieBreaker);

  if (difficulty === "easy") {
    if (rollsUsed >= 3) {
      return { type: "score", category: best.category };
    }
    if (rollsUsed === 2 && (best.score >= 18 || Math.random() > 0.45)) {
      return { type: "score", category: best.category };
    }
    return { type: "roll", holds: getSimpleHolds(dice) };
  }

  if (shouldNormalAiScoreNow(best.score, rollsUsed)) {
    return { type: "score", category: best.category };
  }

  return { type: "roll", holds: getNormalHolds(dice, scoreCard) };
}
