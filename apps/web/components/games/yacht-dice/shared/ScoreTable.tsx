"use client";

import { useEffect, useState } from "react";
import { PixelPanel } from "@/components/game-core/ui/PixelPanel";
import { CategoryHint } from "@/components/games/yacht-dice/shared/CategoryHint";
import { useI18nYacht } from "@/components/games/yacht-dice/shared/useI18nYacht";
import { getYachtScorePreview } from "@/lib/games/yacht-dice/scorePreview";
import type { Locale } from "@/lib/i18n";
import type { Dice, ScoreCard, YachtCategory } from "@/lib/yacht-dice-core";

type ScoreTableProps = {
  locale: Locale;
  categoryLabel?: string;
  categories: readonly YachtCategory[];
  youLabel?: string;
  opponentLabel?: string;
  youCard: ScoreCard;
  opponentCard: ScoreCard;
  previewDice?: Dice;
  previewEnabled?: boolean;
  hideOpponentValuesWhilePreview?: boolean;
  selectable?: YachtCategory[];
  onSelect?: (category: YachtCategory) => void;
  selectDisabled?: boolean;
};

export function ScoreTable({
  locale,
  categoryLabel,
  categories,
  youLabel = "YOU",
  opponentLabel = "AI",
  youCard,
  opponentCard,
  previewDice,
  previewEnabled = true,
  hideOpponentValuesWhilePreview = false,
  selectable = [],
  onSelect,
  selectDisabled = false,
}: ScoreTableProps) {
  const [activeInfoCategory, setActiveInfoCategory] = useState<YachtCategory | null>(null);
  const selectableSet = new Set<YachtCategory>(selectable);
  const { labels, descriptions } = useI18nYacht(locale);
  const fallbackCategoryLabel = locale === "ko" ? "카테고리" : "CATEGORY";
  const hideOpponentValues = hideOpponentValuesWhilePreview && previewEnabled;

  useEffect(() => {
    setActiveInfoCategory(null);
  }, [locale]);

  return (
    <PixelPanel tone="emerald" className="mx-auto w-full max-w-[1080px] px-1 pt-1">
      <div className="overflow-x-hidden md:overflow-visible">
        <div className="mx-auto w-full border border-[#667535]/75 bg-black/95">
          <div className="grid grid-cols-[minmax(0,1fr)_56px_56px] items-center bg-black px-2 py-2 text-[13px] uppercase leading-none tracking-[0.04em] text-yellow-300 sm:grid-cols-[minmax(0,1.55fr)_minmax(68px,0.46fr)_minmax(68px,0.46fr)] sm:text-[17px] md:grid-cols-[minmax(0,1.85fr)_minmax(72px,0.52fr)_minmax(72px,0.52fr)] md:text-[20px]">
            <p className="text-center">{categoryLabel ?? fallbackCategoryLabel}</p>
            <p className="border-l border-[#7c7240]/70 text-center text-[#f5f5f5]">{youLabel}</p>
            <p className="border-l border-[#7c7240]/70 text-center text-cyan-300">{opponentLabel}</p>
          </div>
          <div className="h-px bg-[#9d914f]/80" />

          <div className="max-h-[43vh] divide-y divide-[#7d7347]/65 overflow-y-auto md:max-h-none md:overflow-visible">
            {categories.map((category) => {
              const canPick = selectableSet.has(category);
              const yourScore = youCard[category];
              const opponentScore = opponentCard[category];
              const opponentDisplayScore = hideOpponentValues ? (opponentScore !== null ? opponentScore : "-") : opponentScore ?? "-";
              const rowDisabled = !canPick || selectDisabled;
              const rowDim = !canPick || yourScore !== null;
              const previewValue = getYachtScorePreview(previewDice, category);
              const showPreview = previewEnabled && yourScore === null && previewValue !== null;
              const infoOpen = activeInfoCategory === category;
              const rowClass = `grid w-full grid-cols-[minmax(0,1fr)_56px_56px] items-center px-2 py-[6px] text-left text-[13px] leading-none tracking-[0.01em] sm:grid-cols-[minmax(0,1.55fr)_minmax(68px,0.46fr)_minmax(68px,0.46fr)] sm:text-[16px] md:grid-cols-[minmax(0,1.85fr)_minmax(72px,0.52fr)_minmax(72px,0.52fr)] md:text-[19px] ${
                rowDim ? "text-[#e6e6e6]/65" : "text-[#f5f5f5]"
              } ${canPick ? "bg-[#1f1a00] hover:bg-[#302700] focus-visible:bg-[#302700]" : "bg-black"}`;

              const categoryCell = (
                <span className="flex min-w-0 items-center gap-1 sm:gap-2">
                  <span className="truncate uppercase tracking-[0.01em]">{labels[category]}</span>
                  <CategoryHint
                    key={`${locale}-${category}`}
                    label={labels[category]}
                    description={descriptions[category]}
                    open={infoOpen}
                    onToggle={() => setActiveInfoCategory((current) => (current === category ? null : category))}
                    onOpen={() => setActiveInfoCategory(category)}
                    onClose={() => setActiveInfoCategory((current) => (current === category ? null : current))}
                  />
                </span>
              );

              const mobileInfo = infoOpen ? (
                <p className="px-2 pb-2 text-[11px] leading-snug text-slate-200 md:hidden">
                  {labels[category]}: {descriptions[category]}
                </p>
              ) : null;

              if (canPick) {
                return (
                  <div key={`${locale}-${category}`} className="w-full">
                    <button
                      type="button"
                      onClick={() => onSelect?.(category)}
                      disabled={rowDisabled}
                      className={`${rowClass} disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      {categoryCell}
                      <span className="border-l border-[#7d7347]/65 text-center">{yourScore ?? (showPreview ? `${previewValue}` : "-")}</span>
                      <span className="border-l border-[#7d7347]/65 text-center">{opponentDisplayScore}</span>
                    </button>
                    {mobileInfo}
                  </div>
                );
              }

              return (
                <div key={`${locale}-${category}`} className="w-full">
                  <div className={rowClass}>
                    {categoryCell}
                    <span className="border-l border-[#7d7347]/65 text-center">
                      {yourScore !== null ? yourScore : showPreview ? <span className="text-slate-500">{previewValue}</span> : "-"}
                    </span>
                    <span className="border-l border-[#7d7347]/65 text-center">{opponentDisplayScore}</span>
                  </div>
                  {mobileInfo}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PixelPanel>
  );
}
