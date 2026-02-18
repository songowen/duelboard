import type { ReactNode } from "react";

type GameHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  rightSlot?: ReactNode;
};

export function GameHeader({ title, subtitle, rightSlot }: GameHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-2">
      <div className="space-y-1">
        <h1 className="text-xs uppercase tracking-[0.16em] text-cyan-100">{title}</h1>
        {subtitle ? <p className="text-[11px] text-slate-300">{subtitle}</p> : null}
      </div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </header>
  );
}
