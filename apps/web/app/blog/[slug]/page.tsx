import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleFallbackBadge } from "@/components/content/locale-fallback-badge";
import { MdxArticle } from "@/components/content/mdx-article";
import { RelatedLinks } from "@/components/content/related-links";
import { getAllPostSlugs, getPostBySlug } from "@/lib/blog";
import { getRelatedGames, getRelatedPosts } from "@/lib/content";
import { getRequestLocale } from "@/lib/i18n-server";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const post = getPostBySlug(slug, locale);

  if (!post) {
    return {
      title: "Post not found",
      alternates: { canonical: `/blog/${slug}` },
    };
  }

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const post = getPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post.relatedPosts, locale);
  const relatedGames = getRelatedGames(post.relatedGames, locale);

  return (
    <div className="space-y-4">
      <article className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
        <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-slate-400">{post.date}</p>
        <h1 className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-200">{post.title}</h1>
        <LocaleFallbackBadge requestedLocale={locale} resolvedLocale={post.resolvedLocale} />
        <p className="mb-5 text-[11px] text-slate-300">{post.description}</p>
        <MdxArticle source={post.content} />
      </article>
      <RelatedLinks locale={locale} posts={relatedPosts} games={relatedGames} />
    </div>
  );
}
