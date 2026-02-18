import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleFallbackBadge } from "@/components/content/locale-fallback-badge";
import { MdxArticle } from "@/components/content/mdx-article";
import { RelatedLinks } from "@/components/content/related-links";
import { getPageDocBySlug, getRelatedGames, getRelatedPosts } from "@/lib/content";
import { getRequestLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const doc = getPageDocBySlug("contact", locale);
  const title = doc?.title ?? "Contact";
  const description = doc?.description ?? "Contact Duelboard.";

  return {
    title,
    description,
    alternates: { canonical: "/contact" },
    openGraph: {
      title,
      description,
      url: "/contact",
    },
  };
}

export default async function ContactPage() {
  const locale = await getRequestLocale();
  const doc = getPageDocBySlug("contact", locale);
  if (!doc) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(doc.relatedPosts, locale);
  const relatedGames = getRelatedGames(doc.relatedGames, locale);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
        <h1 className="text-sm uppercase tracking-[0.2em] text-cyan-200">{doc.title}</h1>
        <p className="mt-3 text-[11px] leading-6 text-slate-300">{doc.description}</p>
        <div className="mt-3">
          <LocaleFallbackBadge requestedLocale={locale} resolvedLocale={doc.resolvedLocale} />
        </div>
        <MdxArticle source={doc.content} />
      </section>
      <RelatedLinks locale={locale} posts={relatedPosts} games={relatedGames} />
    </div>
  );
}
