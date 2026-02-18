"use client";

import type { ReactNode } from "react";
import { cn } from "@/components/game-core/utils/classnames";

type TooltipProps = {
  content: ReactNode;
  open: boolean;
  className?: string;
};

export function Tooltip({ content, open, className }: TooltipProps) {
  return (
    <span
      className={cn(
        "pointer-events-none invisible absolute left-full top-1/2 z-20 ml-2 hidden w-[220px] -translate-y-1/2 rounded border border-[#9d914f]/80 bg-black/95 px-2 py-1 text-[10px] normal-case leading-snug text-slate-100 opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-opacity motion-reduce:transition-none md:block",
        open && "visible opacity-100",
        className,
      )}
    >
      {content}
    </span>
  );
}
