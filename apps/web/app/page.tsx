import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PressStartButton } from "@/components/press-start-button";

export const metadata: Metadata = {
  title: "Home",
  description: "Duelboard landing page with featured games and quick access.",
  alternates: { canonical: "/" },
};

const featuredGames = [
  {
    title: "Yacht Dice",
    summary: "Roll smart and score across classic category rows.",
  },
  {
    title: "Tic-Tac-Toe",
    summary: "Fast rounds for quick duels with clean 3x3 strategy.",
  },
  {
    title: "Nim",
    summary: "Take piles with perfect play and trap your opponent.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/40 bg-slate-900/70 p-4 sm:p-6">
        <div className="relative h-[68vh] min-h-[360px] w-full max-w-5xl overflow-hidden rounded-xl border border-cyan-200/40 bg-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
          <Image
            src="/hero.gif"
            alt="Duelboard landing hero animation"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/25" />
          <div className="absolute inset-0 flex items-center justify-center">
            <PressStartButton />
          </div>
        </div>
      </section>

      <section id="games-preview" className="scroll-mt-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm uppercase tracking-[0.2em] text-cyan-200">Game Preview</h2>
          <Link
            href="/games"
            className="rounded border border-emerald-300/60 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-emerald-200 transition hover:bg-emerald-300/10"
          >
            View all games
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featuredGames.map((game) => (
            <article
              key={game.title}
              className="rounded-lg border border-slate-700 bg-slate-900/70 p-4"
            >
              <h3 className="mb-2 text-xs uppercase tracking-[0.15em] text-cyan-100">{game.title}</h3>
              <p className="text-[11px] leading-6 text-slate-300">{game.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
