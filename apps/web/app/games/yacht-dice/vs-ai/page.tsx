import type { Metadata } from "next";
import VsAiClient from "@/app/games/yacht-dice/vs-ai/vs-ai-client";

export const metadata: Metadata = {
  title: "Yacht Dice VS AI",
  description: "Play Yacht Dice Classic A against local Easy/Normal AI on Duelboard.",
  alternates: { canonical: "/games/yacht-dice/vs-ai" },
};

export default function YachtDiceVsAiPage() {
  return <VsAiClient />;
}
