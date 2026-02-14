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
      <p className="text-[11px] leading-6 text-slate-300">
        Featured titles: Yacht Dice, Tic-Tac-Toe, Nim.
      </p>
    </section>
  );
}
