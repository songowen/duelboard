import type { Locale } from "@/lib/i18n";
import { getAllBlogPosts, getAllBlogSlugs, getBlogPostBySlug } from "@/lib/content";

export type { BlogPost } from "@/lib/content";

export function getAllPosts(locale: Locale = "en") {
  return getAllBlogPosts(locale);
}

export function getPostBySlug(slug: string, locale: Locale = "en") {
  return getBlogPostBySlug(slug, locale);
}

export const getAllPostSlugs = getAllBlogSlugs;
