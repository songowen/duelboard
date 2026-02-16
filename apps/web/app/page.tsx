import type { Metadata } from "next";
import Image from "next/image";
import { RetroGameCard } from "@/components/home/retro-game-card";
import { PressStartButton } from "@/components/press-start-button";

export const metadata: Metadata = {
  title: "Home",
  description: "Duelboard landing page with featured games and quick access.",
  alternates: { canonical: "/" },
};

const featuredGames = [
  {
    title: "Yacht Dice",
    summary: "Roll, hold, and outscore the rival in quick retro rounds.",
    href: "/games/yacht-dice/vs-ai",
    tone: "yellow" as const,
    imageSrc: "/yacht-dice.gif",
  },
  {
    title: "Sea Battle",
    summary: "Sea Battle is under development and will be available soon.",
    tone: "red" as const,
    imageSrc: "/sea-battle.gif",
    comingSoon: true as const,
  },
];

export default function HomePage() {
  return (
    <div className="relative bg-black pb-16">
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
              <PressStartButton />
            </div>
          </div>
        </div>
      </section>

      <section id="games" className="relative z-10 scroll-mt-24 px-2 pt-32 sm:px-4 sm:pt-36">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-5xl uppercase tracking-[0.12em] text-[#f5f5f5]">GAMES</h2>

          <div className="mt-16 grid grid-cols-1 justify-items-center gap-y-16 md:grid-cols-2 md:gap-x-16">
            {featuredGames.map((game) => (
              <RetroGameCard
                key={game.title}
                title={game.title}
                summary={game.summary}
                href={game.href}
                imageSrc={game.imageSrc}
                tone={game.tone}
                comingSoon={game.comingSoon}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
