import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://duelboard.gg";
  const staticRoutes = [
    "",
    "/games",
    "/games/yacht-dice/vs-ai",
    "/games/yacht-dice/online",
    "/blog",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
  ];

  const staticEntries = staticRoutes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));

  const postEntries = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  return [...staticEntries, ...postEntries];
}
