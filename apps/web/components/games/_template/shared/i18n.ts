import type { Locale } from "@/lib/i18n";

export type TemplateGameLabels = {
  title: string;
  subtitle: string;
  primaryAction: string;
  secondaryAction: string;
  comingSoon: string;
};

const labels: Record<Locale, TemplateGameLabels> = {
  en: {
    title: "NEW GAME",
    subtitle: "Implement your presentational board in components/games/{slug}/shared",
    primaryAction: "VS AI",
    secondaryAction: "ONLINE",
    comingSoon: "Coming Soon",
  },
  ko: {
    title: "NEW GAME",
    subtitle: "components/games/{slug}/shared에 게임 UI를 구현하세요",
    primaryAction: "AI 대전",
    secondaryAction: "온라인",
    comingSoon: "출시 예정",
  },
};

export function getTemplateGameLabels(locale: Locale): TemplateGameLabels {
  return labels[locale];
}
