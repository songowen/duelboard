import { ReactNode } from "react";

type ArcadeHudProps = {
  leftTitle: string;
  leftScore: ReactNode;
  rightTitle: string;
  rightScore: ReactNode;
  centerSlot?: ReactNode;
  activeSide?: "left" | "right" | null;
  statusLabel?: ReactNode;
  rightSlot?: ReactNode;
  detailsPanel?: {
    summary: ReactNode;
    content: ReactNode;
    defaultOpen?: boolean;
  };
};

export function ArcadeHud({
  leftTitle,
  leftScore,
  rightTitle,
  rightScore,
  centerSlot,
  activeSide = null,
  statusLabel,
  rightSlot,
  detailsPanel,
}: ArcadeHudProps) {
  void statusLabel;
  const hasActiveSide = activeSide === "left" || activeSide === "right";
  const leftClass = hasActiveSide ? (activeSide === "left" ? "active-side" : "inactive-side") : "active-side";
  const rightClass = hasActiveSide ? (activeSide === "right" ? "active-side" : "inactive-side") : "active-side";

  return (
    <section className="space-y-2 bg-black">
      <div className="grid grid-cols-2 items-start gap-6 sm:gap-14 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className={`order-1 min-w-0 ${leftClass}`}>
          <p className="truncate text-[14px] uppercase tracking-[0.08em] text-yellow-300 sm:text-[30px] sm:leading-none">{leftTitle}</p>
          <p className="mt-1 text-[44px] leading-none text-[#f5f5f5] sm:mt-2 sm:text-[74px]">{leftScore}</p>
        </div>

        <div className={`order-2 min-w-0 text-right md:order-3 ${rightClass}`}>
          <p className="truncate text-[14px] uppercase tracking-[0.08em] text-yellow-300 sm:text-[30px] sm:leading-none">{rightTitle}</p>
          <p className="mt-1 text-[44px] leading-none text-[#f5f5f5] sm:mt-2 sm:text-[74px]">{rightScore}</p>
        </div>

        {centerSlot ? (
          <div className="order-3 col-span-2 flex justify-center pt-1 md:order-2 md:col-span-1 md:items-center md:pt-0">
            {centerSlot}
          </div>
        ) : null}
      </div>

      {rightSlot ? <div className="flex flex-wrap items-center justify-end gap-2 py-1 text-[12px] uppercase tracking-[0.08em] text-slate-200 sm:text-[13px]">{rightSlot}</div> : null}

      {detailsPanel ? (
        <details
          className="rounded-md border border-slate-700/70 bg-black/85 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-slate-300"
          open={detailsPanel.defaultOpen}
        >
          <summary className="cursor-pointer list-none text-slate-200 marker:content-none">{detailsPanel.summary}</summary>
          <div className="mt-2 border-t border-slate-700/70 pt-2 normal-case tracking-normal">{detailsPanel.content}</div>
        </details>
      ) : null}
    </section>
  );
}
