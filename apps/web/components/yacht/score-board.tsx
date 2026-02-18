"use client";

import { useMemo, useState } from "react";
import { PixelPanel } from "@/components/yacht/pixel-panel";
import type { Locale } from "@/lib/i18n";
import { calculateCategoryScore, Dice, ScoreCard, YachtCategory } from "@/lib/yacht-dice-core";

const CATEGORY_LABELS: Record<Locale, Record<YachtCategory, string>> = {
  en: {
    Ones: "Ones",
    Twos: "Twos",
    Threes: "Threes",
    Fours: "Fours",
    Fives: "Fives",
    Sixes: "Sixes",
    Choice: "Choice",
    "Four of a Kind": "Four of a Kind",
    "Full House": "Full House",
    "Small Straight": "Small Straight",
    "Large Straight": "Large Straight",
    Yacht: "Yacht",
  },
  ko: {
    Ones: "1의 눈",
    Twos: "2의 눈",
    Threes: "3의 눈",
    Fours: "4의 눈",
    Fives: "5의 눈",
    Sixes: "6의 눈",
    Choice: "초이스",
    "Four of a Kind": "포카드",
    "Full House": "풀하우스",
    "Small Straight": "스몰 스트레이트",
    "Large Straight": "라지 스트레이트",
    Yacht: "요트",
  },
};

const CATEGORY_DESCRIPTIONS: Record<Locale, Record<YachtCategory, string>> = {
  en: {
    Ones: "Sum all dice showing 1.",
    Twos: "Sum all dice showing 2.",
    Threes: "Sum all dice showing 3.",
    Fours: "Sum all dice showing 4.",
    Fives: "Sum all dice showing 5.",
    Sixes: "Sum all dice showing 6.",
    Choice: "Sum of all five dice.",
    "Four of a Kind": "If at least four dice match, score the total of all dice.",
    "Full House": "If 3+2 of a kind, score the total of all dice.",
    "Small Straight": "4-number straight (1-4, 2-5, 3-6) gives fixed points.",
    "Large Straight": "5-number straight (1-5, 2-6) gives fixed points.",
    Yacht: "Five of a kind scores 50 points.",
  },
  ko: {
    Ones: "1의 눈이 나온 주사위의 합계입니다.",
    Twos: "2의 눈이 나온 주사위의 합계입니다.",
    Threes: "3의 눈이 나온 주사위의 합계입니다.",
    Fours: "4의 눈이 나온 주사위의 합계입니다.",
    Fives: "5의 눈이 나온 주사위의 합계입니다.",
    Sixes: "6의 눈이 나온 주사위의 합계입니다.",
    Choice: "주사위 5개의 눈 합계입니다.",
    "Four of a Kind": "같은 눈이 4개 이상이면 전체 눈 합계를 얻습니다.",
    "Full House": "트리플+페어 조합이면 전체 눈 합계를 얻습니다.",
    "Small Straight": "연속 4개(1-4, 2-5, 3-6)면 고정 점수입니다.",
    "Large Straight": "연속 5개(1-5, 2-6)면 고정 점수입니다.",
    Yacht: "같은 눈 5개면 50점입니다.",
  },
};

type ScoreBoardProps = {
  locale?: Locale;
  title?: string;
  categoryLabel?: string;
  hoverHint?: string;
  categories: readonly YachtCategory[];
  youLabel?: string;
  opponentLabel?: string;
  youCard: ScoreCard;
  opponentCard: ScoreCard;
  previewDice?: Dice;
  previewEnabled?: boolean;
  selectable?: YachtCategory[];
  onSelect?: (category: YachtCategory) => void;
  selectDisabled?: boolean;
};

type CategoryInfoBadgeProps = {
  label: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onClose: () => void;
};

function CategoryInfoBadge({ label, description, isOpen, onToggle, onOpen, onClose }: CategoryInfoBadgeProps) {
  return (
    <span
      className="group/info relative inline-flex h-[14px] w-[14px] shrink-0 cursor-help items-center justify-center rounded-full border border-[#9d914f]/80 text-[9px] leading-none text-slate-200 sm:h-[16px] sm:w-[16px] sm:text-[10px]"
      aria-label={`${label}: ${description}`}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onFocus={onOpen}
      onBlur={onClose}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }
      }}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
    >
      !
      <span
        className={`pointer-events-none invisible absolute left-full top-1/2 z-20 ml-2 hidden w-[220px] -translate-y-1/2 rounded border border-[#9d914f]/80 bg-black/95 px-2 py-1 text-[10px] normal-case leading-snug text-slate-100 opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-opacity motion-reduce:transition-none md:block ${isOpen ? "visible opacity-100" : ""}`}
      >
        {label}: {description}
      </span>
    </span>
  );
}

export function ScoreBoard({
  locale = "en",
  categoryLabel,
  hoverHint,
  categories,
  youLabel = "YOU",
  opponentLabel = "AI",
  youCard,
  opponentCard,
  previewDice,
  previewEnabled = true,
  selectable = [],
  onSelect,
  selectDisabled = false,
}: ScoreBoardProps) {
  const [activeInfoCategory, setActiveInfoCategory] = useState<YachtCategory | null>(null);
  const selectableSet = new Set<YachtCategory>(selectable);
  const labels = useMemo(() => CATEGORY_LABELS[locale], [locale]);
  const descriptions = useMemo(() => CATEGORY_DESCRIPTIONS[locale], [locale]);
  const fallbackCategoryLabel = locale === "ko" ? "카테고리" : "CATEGORY";
  void hoverHint;

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
              const rowDisabled = !canPick || selectDisabled;
              const rowDim = !canPick || yourScore !== null;
              const previewValue = previewDice ? calculateCategoryScore(previewDice, category) : null;
              const showPreview = previewEnabled && yourScore === null && previewValue !== null;
              const infoOpen = activeInfoCategory === category;
              const rowClass = `grid w-full grid-cols-[minmax(0,1fr)_56px_56px] items-center px-2 py-[6px] text-left text-[13px] leading-none tracking-[0.01em] sm:grid-cols-[minmax(0,1.55fr)_minmax(68px,0.46fr)_minmax(68px,0.46fr)] sm:text-[16px] md:grid-cols-[minmax(0,1.85fr)_minmax(72px,0.52fr)_minmax(72px,0.52fr)] md:text-[19px] ${
                rowDim ? "text-[#e6e6e6]/65" : "text-[#f5f5f5]"
              } ${
                canPick ? "bg-[#1f1a00] hover:bg-[#302700] focus-visible:bg-[#302700]" : "bg-black"
              }`;

              if (canPick) {
                return (
                  <div key={`${locale}-${category}`} className="w-full">
                    <button
                      type="button"
                      onClick={() => onSelect?.(category)}
                      disabled={rowDisabled}
                      className={`${rowClass} disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      <span className="flex min-w-0 items-center gap-1 sm:gap-2">
                        <span className="truncate uppercase tracking-[0.01em]">{labels[category]}</span>
                        <CategoryInfoBadge
                          label={labels[category]}
                          description={descriptions[category]}
                          isOpen={infoOpen}
                          onToggle={() => setActiveInfoCategory((current) => (current === category ? null : category))}
                          onOpen={() => setActiveInfoCategory(category)}
                          onClose={() => setActiveInfoCategory((current) => (current === category ? null : current))}
                        />
                      </span>
                      <span className="border-l border-[#7d7347]/65 text-center">
                        {yourScore ?? (showPreview ? `${previewValue}` : "-")}
                      </span>
                      <span className="border-l border-[#7d7347]/65 text-center">{opponentScore ?? "-"}</span>
                    </button>
                    {infoOpen ? (
                      <p className="px-2 pb-2 text-[11px] leading-snug text-slate-200 md:hidden">
                        {labels[category]}: {descriptions[category]}
                      </p>
                    ) : null}
                  </div>
                );
              }

              return (
                <div key={`${locale}-${category}`} className="w-full">
                  <div className={rowClass}>
                    <span className="flex min-w-0 items-center gap-1 sm:gap-2">
                      <span className="truncate uppercase tracking-[0.01em]">{labels[category]}</span>
                      <CategoryInfoBadge
                        label={labels[category]}
                        description={descriptions[category]}
                        isOpen={infoOpen}
                        onToggle={() => setActiveInfoCategory((current) => (current === category ? null : category))}
                        onOpen={() => setActiveInfoCategory(category)}
                        onClose={() => setActiveInfoCategory((current) => (current === category ? null : current))}
                      />
                    </span>
                    <span className="border-l border-[#7d7347]/65 text-center">
                      {yourScore !== null ? yourScore : showPreview ? <span className="text-slate-500">{previewValue}</span> : "-"}
                    </span>
                    <span className="border-l border-[#7d7347]/65 text-center">{opponentScore ?? "-"}</span>
                  </div>
                  {infoOpen ? (
                    <p className="px-2 pb-2 text-[11px] leading-snug text-slate-200 md:hidden">
                      {labels[category]}: {descriptions[category]}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PixelPanel>
  );
}
