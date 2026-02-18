export function isYacht(dice: number[]): boolean {
  if (!Array.isArray(dice) || dice.length !== 5) {
    return false;
  }
  if (dice.some((die) => !Number.isInteger(die) || die < 1 || die > 6)) {
    return false;
  }
  return new Set(dice).size === 1;
}

