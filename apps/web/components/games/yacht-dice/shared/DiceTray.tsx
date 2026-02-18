"use client";

import { useEffect, useRef, useState } from "react";
import { PixelPanel } from "@/components/game-core/ui/PixelPanel";
import type { Dice, HoldMask } from "@/lib/yacht-dice-core";

type DiceTrayProps = {
  dice: Dice;
  holds: HoldMask;
  canToggle: boolean;
  busy?: boolean;
  onToggle: (index: number) => void;
};

const PIP_LAYOUT: Record<number, Array<[number, number]>> = {
  1: [[2, 2]],
  2: [
    [1, 1],
    [3, 3],
  ],
  3: [
    [1, 1],
    [2, 2],
    [3, 3],
  ],
  4: [
    [1, 1],
    [1, 3],
    [3, 1],
    [3, 3],
  ],
  5: [
    [1, 1],
    [1, 3],
    [2, 2],
    [3, 1],
    [3, 3],
  ],
  6: [
    [1, 1],
    [2, 1],
    [3, 1],
    [1, 3],
    [2, 3],
    [3, 3],
  ],
};

export function DiceTray({ dice, holds, canToggle, busy = false, onToggle }: DiceTrayProps) {
  const previousDice = useRef<Dice>(dice);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    const changed = previousDice.current.some((value, index) => value !== dice[index]);
    previousDice.current = dice;
    if (!changed) {
      return;
    }
    setRolling(true);
    const timeout = window.setTimeout(() => {
      setRolling(false);
    }, 360);
    return () => window.clearTimeout(timeout);
  }, [dice]);

  return (
    <PixelPanel tone="amber" className="py-1">
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-5 justify-items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5">
        {dice.map((value, index) => {
          const held = holds[index];
          const interactive = canToggle && !busy;
          return (
            <button
              key={`die-${index}`}
              type="button"
              onClick={() => onToggle(index)}
              disabled={!interactive}
              aria-pressed={held}
              className={`group relative aspect-square w-full max-w-[94px] rounded-[16px] sm:max-w-[124px] md:max-w-[148px] lg:max-w-[170px] xl:max-w-[186px] ${
                held ? "-translate-y-[3px] outline outline-[5px] outline-yellow-300" : ""
              } ${
                interactive ? "cursor-pointer hover:-translate-y-[1px] hover:brightness-105" : "cursor-not-allowed opacity-70"
              } border border-[#dee5ee]/80 bg-gradient-to-b from-[#ffffff] via-[#eef3f8] to-[#d7dee8] px-[12%] py-[12%] text-black shadow-[0_6px_0_rgba(88,102,125,0.55),0_10px_18px_rgba(0,0,0,0.35)] motion-safe:transition-[transform,outline-color,opacity,filter] motion-reduce:transition-none motion-reduce:transform-none`}
            >
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-slate-500/30" />
              <span className="sr-only">Die {index + 1}: {value}</span>
              <span className={`grid h-full w-full grid-cols-3 grid-rows-3 place-items-center ${rolling ? "dice-rolling" : ""}`}>
                {PIP_LAYOUT[value].map(([row, col]) => (
                  <span
                    key={`${row}-${col}`}
                    className="h-[12px] w-[12px] rounded-[2px] bg-[#b70202] shadow-[0_1px_0_rgba(0,0,0,0.5)] sm:h-[14px] sm:w-[14px] md:h-[16px] md:w-[16px] lg:h-[19px] lg:w-[19px]"
                    style={{ gridColumn: col, gridRow: row }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </PixelPanel>
  );
}
