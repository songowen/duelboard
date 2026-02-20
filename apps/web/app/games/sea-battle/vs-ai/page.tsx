import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameComingSoon } from "@/components/game-core/layout/GameComingSoon";
import { getRequestLocale } from "@/lib/i18n-server";
import { getGameBySlug } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Sea Battle VS AI",
  description: "Sea Battle VS AI scaffold page.",
  alternates: { canonical: "/games/sea-battle/vs-ai" },
  openGraph: {
    title: "Sea Battle VS AI",
    description: "Sea Battle VS AI scaffold page.",
    url: "/games/sea-battle/vs-ai",
  },
};

export default async function SeaBattleVsAiPage() {
  const locale = await getRequestLocale();
  const game = getGameBySlug("sea-battle");
  if (!game) {
    notFound();
  }
  const title = game.title[locale];
  const comingSoon = locale === "ko" ? "출시 예정" : "Coming Soon";

  if (game.status !== "live") {
    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
        <h1 className="mb-3 text-xs uppercase tracking-[0.16em] text-cyan-200">
          {title} VS AI ({comingSoon})
        </h1>
        <GameComingSoon title={comingSoon} description={game.description?.[locale] ?? ""} />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
      <h1 className="mb-3 text-xs uppercase tracking-[0.16em] text-cyan-200">{title} VS AI</h1>
      <GameComingSoon title={title} description={game.description?.[locale] ?? ""} />
    </section>
  );
}
