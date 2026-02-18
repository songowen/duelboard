import type { Dice, YachtCategory } from "@/lib/yacht-dice-core";
import { calculateCategoryScore } from "@/lib/yacht-dice-core";

export function getYachtScorePreview(dice: Dice | undefined, category: YachtCategory) {
  if (!dice) {
    return null;
  }
  return calculateCategoryScore(dice, category);
}
