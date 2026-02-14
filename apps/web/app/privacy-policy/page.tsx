import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Duelboard privacy policy.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
      <h1 className="mb-3 text-sm uppercase tracking-[0.2em] text-cyan-200">Privacy Policy</h1>
      <p className="text-[11px] leading-6 text-slate-300">Privacy policy placeholder content.</p>
    </section>
  );
}
