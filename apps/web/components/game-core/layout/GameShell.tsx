import type { ReactNode } from "react";
import { cn } from "@/components/game-core/utils/classnames";

type GameShellProps = {
  header: ReactNode;
  board: ReactNode;
  footer: ReactNode;
  className?: string;
};

export function GameShell({ header, board, footer, className }: GameShellProps) {
  return (
    <section
      className={cn(
        "mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-[1320px] flex-col justify-between gap-3 overflow-hidden bg-black px-1 py-1 md:gap-4 lg:gap-5",
        className,
      )}
    >
      <div className="w-full shrink-0">{header}</div>
      <div className="w-full shrink-0 space-y-3 md:space-y-4">{board}</div>
      <div className="w-full min-h-0">{footer}</div>
    </section>
  );
}
