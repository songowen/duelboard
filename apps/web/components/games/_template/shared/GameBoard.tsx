import { GameShell } from "@/components/game-core/layout/GameShell";
import { PixelButton } from "@/components/game-core/ui/PixelButton";
import { PixelPanel } from "@/components/game-core/ui/PixelPanel";
import type { TemplateGameLabels } from "@/components/games/_template/shared/i18n";

type GameBoardProps = {
  labels: TemplateGameLabels;
  modeLabel: string;
};

export function GameBoard({ labels, modeLabel }: GameBoardProps) {
  return (
    <GameShell
      className="bg-black"
      header={
        <PixelPanel tone="amber" className="mx-auto w-full max-w-4xl px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-yellow-300">{labels.title}</p>
              <p className="mt-2 text-[11px] text-slate-300">{labels.subtitle}</p>
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{modeLabel}</p>
          </div>
        </PixelPanel>
      }
      board={
        <PixelPanel tone="cyan" className="mx-auto w-full max-w-4xl px-4 py-8">
          <p className="text-center text-sm uppercase tracking-[0.12em] text-slate-200">{labels.comingSoon}</p>
        </PixelPanel>
      }
      footer={
        <div className="mx-auto flex w-full max-w-4xl items-center justify-center gap-3">
          <PixelButton disabled>{labels.primaryAction}</PixelButton>
          <PixelButton tone="cyan" disabled>
            {labels.secondaryAction}
          </PixelButton>
        </div>
      }
    />
  );
}
