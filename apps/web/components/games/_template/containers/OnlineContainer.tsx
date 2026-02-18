"use client";

import type { Locale } from "@/lib/i18n";
import { GameBoard } from "@/components/games/_template/shared/GameBoard";
import { getTemplateGameLabels } from "@/components/games/_template/shared/i18n";

type OnlineContainerProps = {
  locale: Locale;
};

export function OnlineContainer({ locale }: OnlineContainerProps) {
  const labels = getTemplateGameLabels(locale);
  return <GameBoard labels={labels} modeLabel="ONLINE" />;
}
