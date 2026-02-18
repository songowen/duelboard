import { ReactNode } from "react";

type PixelPanelTone = "cyan" | "amber" | "slate" | "emerald";

const PANEL_TONE_CLASS: Record<PixelPanelTone, string> = {
  cyan: "text-cyan-100",
  amber: "text-amber-100",
  emerald: "text-emerald-100",
  slate: "text-slate-100",
};

type PixelPanelProps = {
  children: ReactNode;
  className?: string;
  tone?: PixelPanelTone;
};

export function PixelPanel({ children, className = "", tone = "slate" }: PixelPanelProps) {
  return (
    <section className={`relative bg-black ${PANEL_TONE_CLASS[tone]} ${className}`}>{children}</section>
  );
}
