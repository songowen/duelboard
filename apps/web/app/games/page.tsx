import type { Metadata } from "next";
import Link from "next/link";
import { gameRegistry } from "@/lib/registry";
import { getMessages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Games",
  description: "Duelboard game listing page.",
  alternates: { canonical: "/games" },
};

export default async function GamesPage() {
  const locale = await getRequestLocale();
  const t = getMessages(locale);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
      <h1 className="mb-4 text-sm uppercase tracking-[0.2em] text-cyan-200">{t.home.gamesTitle}</h1>
      <div className="space-y-4 text-[11px] leading-6 text-slate-300">
        {gameRegistry.map((game) => {
          const live = game.status === "live";
          const modeLabel = game.modes.join(" / ").toUpperCase();
          return (
            <article key={game.slug} className="rounded border border-slate-700/80 bg-slate-950/70 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-100">{game.title[locale]}</p>
              <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">{modeLabel}</p>
              <p className="mt-1 text-[11px] text-slate-300">{game.description?.[locale] ?? "-"}</p>
              {live ? (
                <Link
                  href={game.href}
                  className="mt-2 inline-block rounded border border-cyan-300 bg-cyan-300/20 px-3 py-2 uppercase tracking-[0.14em] text-cyan-100"
                >
                  {t.home.play}
                </Link>
              ) : (
                <span className="mt-2 inline-block rounded border border-slate-600 px-3 py-2 uppercase tracking-[0.14em] text-slate-500">
                  {t.home.comingSoon}
                </span>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
