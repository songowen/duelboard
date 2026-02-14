import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Duelboard terms of service.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
      <h1 className="mb-3 text-sm uppercase tracking-[0.2em] text-cyan-200">Terms</h1>
      <p className="text-[11px] leading-6 text-slate-300">Terms placeholder content.</p>
    </section>
  );
}
