import type { Metadata } from "next";
import Image from "next/image";
import { RetroGameCard } from "@/components/home/retro-game-card";
import { PressStartButton } from "@/components/press-start-button";
import { getMessages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { gameRegistry } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Home",
  description: "Duelboard landing page with featured games and quick access.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Duelboard",
    description: "Duelboard landing page with featured games and quick access.",
    url: "/",
  },
};

export default async function HomePage() {
  const locale = await getRequestLocale();
  const t = getMessages(locale);
  return (
    <div className="relative bg-black pb-16">
      <h1 className="sr-only">Duelboard 2-player web arcade platform</h1>
      <section className="relative z-10 flex min-h-[90vh] items-center px-0 pt-6 sm:min-h-[92vh] sm:px-2">
        <div className="mx-auto max-w-6xl">
          <div className="relative mx-auto w-[92vw] max-w-[520px] pb-16 sm:pb-20 md:w-[70vw] md:max-w-[980px]">
            <Image
              src="/hero.gif"
              alt="Retro gamers around a CRT monitor"
              width={1220}
              height={686}
              priority
              className="h-auto w-full object-contain [image-rendering:pixelated]"
            />
            <div className="absolute inset-x-0 bottom-0 flex translate-y-[110%] justify-center">
              <PressStartButton ariaLabel={t.home.pressStartAria} />
            </div>
          </div>
        </div>
      </section>

      <section id="games" className="relative z-10 scroll-mt-24 px-2 pt-32 sm:px-4 sm:pt-36">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-5xl uppercase tracking-[0.12em] text-[#f5f5f5]">{t.home.gamesTitle}</h2>

          <div className="mt-16 grid grid-cols-1 justify-items-center gap-y-16 md:grid-cols-2 md:gap-x-16">
            {gameRegistry.map((game) => (
              <RetroGameCard
                key={game.slug}
                title={game.title[locale]}
                summary={game.description?.[locale] ?? ""}
                href={game.href}
                imageSrc={game.imageSrc}
                tone={game.tone}
                comingSoon={game.status !== "live"}
                playLabel={t.home.play}
                comingSoonLabel={t.home.comingSoon}
                openGameImageAria={t.home.openGameImageAria}
                comingSoonImageAria={t.home.comingSoonImageAria}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
