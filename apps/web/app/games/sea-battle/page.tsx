import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleFallbackBadge } from "@/components/content/locale-fallback-badge";
import { MdxArticle } from "@/components/content/mdx-article";
import { RelatedLinks } from "@/components/content/related-links";
import { GameComingSoon } from "@/components/game-core/layout/GameComingSoon";
import { CartridgeButton } from "@/components/home/cartridge-button";
import { getGameDocBySlug, getRelatedGames, getRelatedPosts } from "@/lib/content";
import type { GameMode } from "@/lib/registry";
import { getRequestLocale } from "@/lib/i18n-server";
import { getGameBySlug, getGameModeHref } from "@/lib/registry";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const doc = getGameDocBySlug("sea-battle", locale);
  const title = doc?.title ?? "Sea Battle";
  const description = doc?.description ?? "Sea Battle mode select scaffold.";

  return {
    title,
    description,
    alternates: { canonical: "/games/sea-battle" },
    openGraph: {
      title,
      description,
      url: "/games/sea-battle",
    },
  };
}

export default async function SeaBattleModePage() {
  const locale = await getRequestLocale();
  const game = getGameBySlug("sea-battle");
  if (!game) {
    notFound();
  }

  const modeLabelByLocale: Record<GameMode, string> = {
    "vs-ai": locale === "ko" ? "AI 대전" : "VS AI",
    online: locale === "ko" ? "온라인 1:1" : "ONLINE 1V1",
  };
  const modeToneByMode: Record<GameMode, "yellow" | "red"> = {
    "vs-ai": "yellow",
    online: "red",
  };

  const modeSelect = locale === "ko" ? "모드 선택" : "Mode Select";
  const title = game.title[locale];
  const description = game.description?.[locale] ?? "";
  const comingSoon = locale === "ko" ? "출시 예정" : "Coming Soon";
  const live = game.status === "live";
  const doc = getGameDocBySlug("sea-battle", locale);
  if (!doc) {
    notFound();
  }
  const relatedPosts = getRelatedPosts(doc.relatedPosts, locale);
  const relatedGames = getRelatedGames(doc.relatedGames, locale);

  return (
    <div className="space-y-6">
      <section className="grid min-h-[clamp(420px,72vh,760px)] place-items-center">
        <div className="w-full max-w-3xl border border-cyan-300/45 bg-black/80 p-5 sm:p-8">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">{modeSelect}</p>
            <h1 className="mt-3 text-4xl uppercase tracking-[0.12em] text-[#f5f5f5] sm:text-5xl">{title}</h1>
            <p className="mt-3 text-[11px] text-slate-300">{description}</p>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6">
            {game.modes.map((mode) => (
              <CartridgeButton
                key={mode}
                href={live ? getGameModeHref(game.slug, mode) : undefined}
                tone={modeToneByMode[mode]}
                className={live ? "w-full" : "w-full cursor-not-allowed opacity-70"}
                disabled={!live}
                aria-disabled={!live}
              >
                {modeLabelByLocale[mode]} {live ? "" : `(${comingSoon})`}
              </CartridgeButton>
            ))}
          </div>

          <div className="mt-6">
            <GameComingSoon title={comingSoon} description={description} />
          </div>
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
