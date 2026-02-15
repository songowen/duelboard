import type { Metadata } from "next";
import Image from "next/image";
import { PixelObjects } from "@/components/home/pixel-objects";
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
    imageSrc: "/hero.gif",
  },
  {
    title: "Sea Battle",
    summary: "Call your shots and sink every ship before your opponent.",
    href: "/games",
    tone: "red" as const,
    imageSrc: "/hero.gif",
  },
  {
    title: "Game 3",
    summary: "Fast-paced duel mode with short sessions and rematches.",
    href: "/games",
    tone: "yellow" as const,
    imageSrc: "/hero.gif",
  },
  {
    title: "Game 4",
    summary: "Simple rules, tight choices, and one last winning move.",
    href: "/games",
    tone: "red" as const,
    imageSrc: "/hero.gif",
  },
];

export default function HomePage() {
  return (
    <div className="relative bg-black pb-16">
      <PixelObjects />

      <section className="relative z-10 px-0 pt-6 sm:px-2">
        <div className="mx-auto max-w-6xl">
          <div className="relative mx-auto w-full max-w-[1220px] pb-16 sm:pb-20">
            <Image
              src="/hero.gif"
              alt="Retro gamers around a CRT monitor"
              width={1220}
              height={686}
              priority
              className="h-auto w-full [image-rendering:pixelated]"
            />
            <div className="absolute inset-x-0 bottom-0 flex translate-y-[110%] justify-center">
              <PressStartButton />
            </div>
          </div>
        </div>
      </section>

      <section id="games" className="relative z-10 scroll-mt-24 px-2 pt-24 sm:px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-5xl uppercase tracking-[0.12em] text-[#f5f5f5]">GAMES</h2>

          <div className="mt-16 grid grid-cols-1 gap-y-16 md:grid-cols-2 md:gap-x-10">
            {featuredGames.map((game) => (
              <RetroGameCard
                key={game.title}
                title={game.title}
                summary={game.summary}
                href={game.href}
                imageSrc={game.imageSrc}
                tone={game.tone}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
