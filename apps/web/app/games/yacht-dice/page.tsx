import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleFallbackBadge } from "@/components/content/locale-fallback-badge";
import { MdxArticle } from "@/components/content/mdx-article";
import { RelatedLinks } from "@/components/content/related-links";
import { CartridgeButton } from "@/components/home/cartridge-button";
import { getGameDocBySlug, getRelatedGames, getRelatedPosts } from "@/lib/content";
import { getMessages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { getGameBySlug } from "@/lib/registry";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const doc = getGameDocBySlug("yacht-dice", locale);
  const title = doc?.title ?? "Yacht Dice";
  const description = doc?.description ?? "Choose a Yacht Dice mode: VS AI or Online 1v1.";

  return {
    title,
    description,
    alternates: { canonical: "/games/yacht-dice" },
    openGraph: {
      title,
      description,
      url: "/games/yacht-dice",
    },
  };
}

export default async function YachtDiceModePage() {
  const locale = await getRequestLocale();
  const game = getGameBySlug("yacht-dice");
  if (!game) {
    notFound();
  }

  const t = getMessages(locale).yachtMode;
  const live = game.status === "live";
  const comingSoon = locale === "ko" ? "출시 예정" : "Coming Soon";
  const doc = getGameDocBySlug("yacht-dice", locale);
  if (!doc) {
    notFound();
  }
  const relatedPosts = getRelatedPosts(doc.relatedPosts, locale);
  const relatedGames = getRelatedGames(doc.relatedGames, locale);

  return (
    <div className="space-y-6">
      <section className="grid min-h-[clamp(420px,72vh,760px)] place-items-center rounded-2xl bg-[url('/game-bg.png')] bg-cover bg-center p-3 sm:p-4">
        <div className="w-full max-w-3xl border border-cyan-300/45 bg-black/84 p-5 sm:p-8">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">{t.modeSelect}</p>
            <h1 className="mt-3 text-4xl uppercase tracking-[0.12em] text-[#f5f5f5] sm:text-5xl">{game.title[locale]}</h1>
            <p className="mt-3 text-[11px] text-slate-300">{game.description?.[locale]}</p>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6">
            <div className="border border-slate-700 bg-slate-950/60 p-4 text-center sm:p-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.14em] text-slate-300">{t.solo}</p>
              <CartridgeButton
                href={live ? "/games/yacht-dice/vs-ai" : undefined}
                tone="yellow"
                hoverArrow
                className={`${live ? "w-full active:translate-y-[2px] motion-safe:transition-transform motion-reduce:transition-none" : "w-full cursor-not-allowed opacity-70"}`}
                disabled={!live}
                aria-disabled={!live}
                aria-label={t.enterVsAiAria}
              >
                {live ? t.vsAi : `${t.vsAi} (${comingSoon})`}
              </CartridgeButton>
              <p className="mt-3 text-[11px] text-slate-400">{t.soloDescription}</p>
            </div>

            <div className="border border-slate-700 bg-slate-950/60 p-4 text-center sm:p-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.14em] text-slate-300">{t.multiplayer}</p>
              <CartridgeButton
                href={live ? "/games/yacht-dice/online" : undefined}
                tone="red"
                hoverArrow
                className={`${live ? "w-full active:translate-y-[2px] motion-safe:transition-transform motion-reduce:transition-none" : "w-full cursor-not-allowed opacity-70"}`}
                disabled={!live}
                aria-disabled={!live}
                aria-label={t.enterOnlineAria}
              >
                {live ? t.online : `${t.online} (${comingSoon})`}
              </CartridgeButton>
              <p className="mt-3 text-[11px] text-slate-400">{t.multiplayerDescription}</p>
            </div>
          </div>

          <p className="mt-8 text-center text-[10px] uppercase tracking-[0.12em] text-slate-500">{t.noRanking}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
          <LocaleFallbackBadge requestedLocale={locale} resolvedLocale={doc.resolvedLocale} />
          <MdxArticle source={doc.content} />
        </div>
        <RelatedLinks locale={locale} posts={relatedPosts} games={relatedGames} />
      </section>
    </div>
  );
}
