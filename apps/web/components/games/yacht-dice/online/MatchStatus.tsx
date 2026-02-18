import { PixelPanel } from "@/components/game-core/ui/PixelPanel";

type MatchStatusProps = {
  title: string;
  description: string;
};

export function MatchStatus({ title, description }: MatchStatusProps) {
  return (
    <PixelPanel tone="amber" className="space-y-2">
      <h2 className="text-xs uppercase tracking-[0.16em] text-amber-100">{title}</h2>
      <p className="text-[11px] text-slate-300">{description}</p>
    </PixelPanel>
  );
}
