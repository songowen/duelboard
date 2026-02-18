import type { Metadata } from "next";
import { CartridgeButton } from "@/components/home/cartridge-button";
import { getMessages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Yacht Dice",
  description: "Choose a Yacht Dice mode: VS AI or Online 1v1.",
  alternates: { canonical: "/games/yacht-dice" },
};

export default async function YachtDiceModePage() {
  const locale = await getRequestLocale();
  const t = getMessages(locale).yachtMode;

  return (
    <section className="grid min-h-[clamp(420px,72vh,760px)] place-items-center">
      <div className="w-full max-w-3xl border border-cyan-300/45 bg-black/80 p-5 sm:p-8">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">{t.modeSelect}</p>
          <h1 className="mt-3 text-4xl uppercase tracking-[0.12em] text-[#f5f5f5] sm:text-5xl">{t.title}</h1>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6">
          <div className="border border-slate-700 bg-slate-950/60 p-4 text-center sm:p-5">
            <p className="mb-3 text-[10px] uppercase tracking-[0.14em] text-slate-300">{t.solo}</p>
            <CartridgeButton
              href="/games/yacht-dice/vs-ai"
              tone="yellow"
              hoverArrow
              className="w-full active:translate-y-[2px] motion-safe:transition-transform motion-reduce:transition-none"
              aria-label={t.enterVsAiAria}
            >
              {t.vsAi}
            </CartridgeButton>
            <p className="mt-3 text-[11px] text-slate-400">{t.soloDescription}</p>
          </div>

          <div className="border border-slate-700 bg-slate-950/60 p-4 text-center sm:p-5">
            <p className="mb-3 text-[10px] uppercase tracking-[0.14em] text-slate-300">{t.multiplayer}</p>
            <CartridgeButton
              href="/games/yacht-dice/online"
              tone="red"
              hoverArrow
              className="w-full active:translate-y-[2px] motion-safe:transition-transform motion-reduce:transition-none"
              aria-label={t.enterOnlineAria}
            >
              {t.online}
            </CartridgeButton>
            <p className="mt-3 text-[11px] text-slate-400">{t.multiplayerDescription}</p>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.12em] text-slate-500">{t.noRanking}</p>
      </div>
    </section>
  );
}
