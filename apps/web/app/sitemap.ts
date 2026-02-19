import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { gameRegistry, getGameModeHref } from "@/lib/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://duelboard.songowen.cloud";
  const baseStaticRoutes = [
    "",
    "/games",
    "/blog",
    "/about",
    "/contact",
    "/privacy",
    "/privacy-policy",
    "/terms",
  ];

  const gameRoutes = gameRegistry.flatMap((game) => [game.href, ...game.modes.map((mode) => getGameModeHref(game.slug, mode))]);

  const staticRoutes = [...baseStaticRoutes, ...gameRoutes];

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
