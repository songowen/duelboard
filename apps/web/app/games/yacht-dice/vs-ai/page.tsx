import type { Metadata } from "next";
import { VsAiContainer } from "@/components/games/yacht-dice/containers/VsAiContainer";
import { getMessages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Yacht Dice VS AI",
  description: "Play Yacht Dice Classic A against local Easy/Normal AI on Duelboard.",
  alternates: { canonical: "/games/yacht-dice/vs-ai" },
};

export default async function YachtDiceVsAiPage() {
  const locale = await getRequestLocale();
  const t = getMessages(locale).yachtVsAi;
  return <VsAiContainer locale={locale} text={t} />;
}
