import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Duelboard blog posts.",
  alternates: { canonical: "/blog" },
};

export default function BlogListPage() {
  const posts = getAllPosts();

  return (
    <section className="space-y-5 rounded-xl border border-slate-700 bg-slate-900/70 p-6">
      <h1 className="text-sm uppercase tracking-[0.2em] text-cyan-200">Blog</h1>
      {posts.length === 0 ? (
        <p className="text-[11px] text-slate-300">No posts yet.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.slug} className="rounded border border-slate-700 bg-slate-950/70 p-4">
              <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-slate-400">{post.date}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="text-xs uppercase tracking-[0.12em] text-cyan-100 hover:text-cyan-200"
              >
                {post.title}
              </Link>
              <p className="mt-2 text-[11px] leading-6 text-slate-300">{post.description}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
