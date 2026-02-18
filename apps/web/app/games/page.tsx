import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Games",
  description: "Duelboard game listing page.",
  alternates: { canonical: "/games" },
};

export default function GamesPage() {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
      <h1 className="mb-4 text-sm uppercase tracking-[0.2em] text-cyan-200">Games</h1>
      <div className="space-y-3 text-[11px] leading-6 text-slate-300">
        <p>Featured titles: Yacht Dice, Tic-Tac-Toe, Nim.</p>
        <Link
          href="/games/yacht-dice"
          className="inline-block rounded border border-cyan-300 bg-cyan-300/20 px-3 py-2 uppercase tracking-[0.14em] text-cyan-100"
        >
          Enter Yacht Dice
        </Link>
        <div>
          <Link
            href="/games/yacht-dice/online"
            className="inline-block rounded border border-emerald-300 bg-emerald-300/20 px-3 py-2 uppercase tracking-[0.14em] text-emerald-100"
          >
            Play Yacht Dice Online
          </Link>
        </div>
      </div>
    </section>
  );
}
