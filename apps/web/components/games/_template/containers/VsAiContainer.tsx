"use client";

import type { Locale } from "@/lib/i18n";
import { GameBoard } from "@/components/games/_template/shared/GameBoard";
import { getTemplateGameLabels } from "@/components/games/_template/shared/i18n";

type VsAiContainerProps = {
  locale: Locale;
};

export function VsAiContainer({ locale }: VsAiContainerProps) {
  const labels = getTemplateGameLabels(locale);
  return <GameBoard labels={labels} modeLabel="VS AI" />;
}
