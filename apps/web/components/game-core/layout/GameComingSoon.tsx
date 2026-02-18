import { PixelPanel } from "@/components/game-core/ui/PixelPanel";

type GameComingSoonProps = {
  title: string;
  description: string;
};

export function GameComingSoon({ title, description }: GameComingSoonProps) {
  return (
    <PixelPanel tone="cyan" className="w-full border border-slate-700 bg-black/80 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">{title}</p>
      <p className="mt-2 text-[11px] leading-6 text-slate-300">{description}</p>
    </PixelPanel>
  );
}
