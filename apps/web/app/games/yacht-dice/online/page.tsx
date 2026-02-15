import type { Metadata } from "next";
import { Suspense } from "react";
import OnlineClient from "@/app/games/yacht-dice/online/online-client";

export const metadata: Metadata = {
  title: "Yacht Dice Online",
  description: "Create and join a 2-player online Yacht Dice room on Duelboard.",
  alternates: { canonical: "/games/yacht-dice/online" },
};

export default function YachtDiceOnlinePage() {
  return (
    <Suspense fallback={<div className="rounded-xl border border-slate-700 bg-slate-900/70 p-6 text-sm text-slate-300">Loading...</div>}>
      <OnlineClient />
    </Suspense>
  );
}
