import type { Metadata } from "next";
import { Suspense } from "react";
import OnlineClient from "@/app/games/yacht-dice/online/online-client";
import { getMessages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Yacht Dice Online",
  description: "Create and join a 2-player online Yacht Dice room on Duelboard.",
  alternates: { canonical: "/games/yacht-dice/online" },
};

export default async function YachtDiceOnlinePage() {
  const locale = await getRequestLocale();
  const t = getMessages(locale).yachtOnline;
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-300">{t.loading}</div>}>
      <OnlineClient locale={locale} text={t} />
    </Suspense>
  );
}
