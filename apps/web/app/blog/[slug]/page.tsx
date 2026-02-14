import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

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
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
      <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-slate-400">{post.date}</p>
      <h1 className="mb-4 text-sm uppercase tracking-[0.2em] text-cyan-200">{post.title}</h1>
      <div
        className="space-y-4 text-[11px] leading-6 text-slate-200"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </article>
  );
}
