import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Duelboard.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
      <h1 className="mb-3 text-sm uppercase tracking-[0.2em] text-cyan-200">Contact</h1>
      <p className="text-[11px] leading-6 text-slate-300">Contact endpoint placeholder.</p>
    </section>
  );
}
