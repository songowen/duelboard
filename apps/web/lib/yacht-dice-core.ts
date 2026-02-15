export const YACHT_CATEGORIES = [
  "Ones",
  "Twos",
  "Threes",
  "Fours",
  "Fives",
  "Sixes",
  "Choice",
  "Four of a Kind",
  "Full House",
  "Small Straight",
  "Large Straight",
  "Yacht",
] as const;

export type YachtCategory = (typeof YACHT_CATEGORIES)[number];
export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;
export type Dice = [DieValue, DieValue, DieValue, DieValue, DieValue];
export type HoldMask = [boolean, boolean, boolean, boolean, boolean];
export type ScoreCard = Record<YachtCategory, number | null>;

const UPPER_CATEGORY_TO_VALUE: Partial<Record<YachtCategory, DieValue>> = {
  Ones: 1,
  Twos: 2,
  Threes: 3,
  Fours: 4,
  Fives: 5,
  Sixes: 6,
};

export function createEmptyScoreCard(): ScoreCard {
  return {
    Ones: null,
    Twos: null,
    Threes: null,
    Fours: null,
    Fives: null,
    Sixes: null,
    Choice: null,
    "Four of a Kind": null,
    "Full House": null,
    "Small Straight": null,
    "Large Straight": null,
    Yacht: null,
  };
}

export function createInitialDice(): Dice {
  return [1, 1, 1, 1, 1];
}

export function createEmptyHolds(): HoldMask {
  return [false, false, false, false, false];
}

export function getAvailableCategories(scoreCard: ScoreCard): YachtCategory[] {
  return YACHT_CATEGORIES.filter((category) => scoreCard[category] === null);
}

export function calculateTotal(scoreCard: ScoreCard): number {
  return YACHT_CATEGORIES.reduce((acc, category) => acc + (scoreCard[category] ?? 0), 0);
}

export function rollDice(current: Dice, holds: HoldMask, randomFn = Math.random): Dice {
  return current.map((value, index) => {
    if (holds[index]) {
      return value;
    }
    const next = Math.floor(randomFn() * 6) + 1;
    return next as DieValue;
  }) as Dice;
}

export function countFaces(dice: Dice): Record<DieValue, number> {
  const counts: Record<DieValue, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const die of dice) {
    counts[die] += 1;
  }
  return counts;
}

function sumDice(dice: Dice): number {
  return dice.reduce((acc, value) => acc + value, 0);
}

function isSmallStraight(dice: Dice): boolean {
  const unique = new Set(dice);
  const runs: DieValue[][] = [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6],
  ];
  return runs.some((run) => run.every((value) => unique.has(value)));
}

function isLargeStraight(dice: Dice): boolean {
  const sorted = [...new Set(dice)].sort((a, b) => a - b);
  if (sorted.length !== 5) {
    return false;
  }
  const asText = sorted.join("");
  return asText === "12345" || asText === "23456";
}

export function calculateCategoryScore(dice: Dice, category: YachtCategory): number {
  const counts = countFaces(dice);
  const countValues = Object.values(counts);
  const total = sumDice(dice);

  const upperTarget = UPPER_CATEGORY_TO_VALUE[category];
  if (upperTarget) {
    return counts[upperTarget] * upperTarget;
  }

  switch (category) {
    case "Choice":
      return total;
    case "Four of a Kind":
      return Math.max(...countValues) >= 4 ? total : 0;
    case "Full House": {
      const sortedCounts = countValues.filter((value) => value > 0).sort((a, b) => a - b);
      return sortedCounts.length === 2 && sortedCounts[0] === 2 && sortedCounts[1] === 3 ? total : 0;
    }
    case "Small Straight":
      return isSmallStraight(dice) ? 15 : 0;
    case "Large Straight":
      return isLargeStraight(dice) ? 30 : 0;
    case "Yacht":
      return Math.max(...countValues) === 5 ? 50 : 0;
    default:
      return 0;
  }
}

export function getBestScoringCategory(
  dice: Dice,
  scoreCard: ScoreCard,
  tieBreaker: YachtCategory[],
): { category: YachtCategory; score: number } {
  const available = getAvailableCategories(scoreCard);
  let bestCategory = available[0];
  let bestScore = -1;

  for (const category of available) {
    const score = calculateCategoryScore(dice, category);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
      continue;
    }
    if (score === bestScore && tieBreaker.indexOf(category) < tieBreaker.indexOf(bestCategory)) {
      bestCategory = category;
    }
  }

  return { category: bestCategory, score: bestScore };
}
